import * as net from 'net';
import { unlinkSync, existsSync } from 'fs';
import chalk from 'chalk';

import { IPC_SOCKET_PATH } from '../config/paths';
import { handleMessage } from './server';
import type { IpcRequest } from './types';
import { debug, info } from '../logging';
import { readPidFile } from '../process';
import { killSession, sessionExists } from '../tmux';
import { validateWorkspace } from '../commander/status';

let ipcServerInstance: net.Server | null = null;

/**
 * 处理单个 IPC 连接的请求和响应
 * @param conn socket 连接
 * @param onExit exit 方法被调用时的回调
 */
const handleConnection = (conn: net.Socket, onExit: () => void): void => {
  let data = '';
  conn.on('data', (chunk: Buffer) => {
    data += chunk.toString();
  });
  conn.on('end', () => {
    try {
      const req: IpcRequest = JSON.parse(data);
      const res = handleMessage(req, { onExit });
      const pid = readPidFile();
      conn.end(JSON.stringify(res));
      if (req.method === 'exit') {
        setImmediate(() => {
          const sessionName = validateWorkspace();
          sessionExists(sessionName).then(tag => {
            if (tag) {
              killSession(sessionName).then(() => {
                console.log(chalk.green(`✅ session ${sessionName} 已终止`));
              });
            } else {
              console.log(chalk.yellow(`⚠️ session ${sessionName} is already terminated`));
            }
          });

          info(`process exited with pid: ${pid}...`);
          process.exit(0);
        });
      }
    } catch (err) {
      debug(`[ipc-server] error handling request: ${String(err)}`);
      conn.end();
    }
  });
};

/**
 * 启动 IPC Unix socket 服务端，接收请求并委托 handleMessage 处理
 * @param onExit exit 方法被调用时的回调（用于触发 daemon 优雅关闭）
 * @param onListening socket 开始监听后的回调
 */
export const startIpcServer = (onExit: () => void, onListening?: () => void): void => {
  if (ipcServerInstance !== null) return;
  debug('[ipc-server] starting...');
  if (existsSync(IPC_SOCKET_PATH)) {
    unlinkSync(IPC_SOCKET_PATH);
  }

  const server = net.createServer(conn => handleConnection(conn, onExit));
  server.on('error', err => {
    debug(`[ipc-server] error: ${String(err)}`);
  });
  server.listen(IPC_SOCKET_PATH, () => {
    ipcServerInstance = server;
    debug(`[ipc-server] listening on ${IPC_SOCKET_PATH}`);
    onListening?.();
  });
};

/**
 * 停止 IPC 服务端并清理 socket 文件
 */
export const stopIpcServer = (): void => {
  if (ipcServerInstance !== null) {
    ipcServerInstance.close();
    ipcServerInstance = null;
    if (existsSync(IPC_SOCKET_PATH)) {
      unlinkSync(IPC_SOCKET_PATH);
    }
    debug('[ipc-server] stopped');
  }
};

// 导出供测试/诊断使用
export const getIpcServerInstance = (): net.Server | null => ipcServerInstance;
