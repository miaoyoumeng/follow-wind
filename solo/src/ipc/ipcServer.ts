import * as net from 'net';
import { unlinkSync, existsSync } from 'fs';

import { handleMessage } from './server';
import type { IpcRequest } from './types';
import { logger } from '../logging';
import { readPidFile } from '../process';
import { killSession, sessionExists } from '../tmux';
import { validateWorkspace } from '../commander';

let ipcServerInstance: net.Server | null = null;
let ipcSocketPath: string = '';

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
      const req = JSON.parse(data) as IpcRequest;
      const res = handleMessage(req, { onExit });
      const pid = readPidFile();
      conn.end(JSON.stringify(res));
      logger.info(`[ipc-server] handle method ${req.method},  request info: ${JSON.stringify(res)}`);
      if (req.method === 'exit') {
        setImmediate(() => {
          const sessionName = validateWorkspace();
          void sessionExists(sessionName).then(tag => {
            if (tag) {
              logger.info(`✅️ session ${sessionName} exists: ${tag}`);
              void killSession(sessionName).then(() => {
                logger.info(`✅ session ${sessionName} 已终止`);
              });
            } else {
              logger.info(`⚠️ session ${sessionName} is already terminated`);
            }
          });

          logger.info(`[ipc-server] process exited with pid: ${pid}...`);
          conn.end();
          process.exit(0);
        });
      }
    } catch (err) {
      logger.error(`[ipc-server] error handling request: ${String(err)}`);
      conn.end();
    } finally {
      logger.trace('[ipc-server] info connection terminated ');
    }
  });
};

/**
 * 启动 IPC Unix socket 服务端，接收请求并委托 handleMessage 处理
 * @param socketPath socket 文件路径（如 .solo/ipc-[name].sock）
 * @param onExit exit 方法被调用时的回调（用于触发 daemon 优雅关闭）
 * @param onListening socket 开始监听后的回调
 */
export const startIpcServer = (socketPath: string, onExit: () => void, onListening?: () => void): void => {
  if (ipcServerInstance !== null) return;
  ipcSocketPath = socketPath;
  logger.info('[ipc-server] starting...');
  if (existsSync(socketPath)) {
    unlinkSync(socketPath);
  }

  const server = net.createServer(conn => handleConnection(conn, onExit));
  server.on('error', err => {
    logger.error(`[ipc-server] error: ${String(err)}`);
  });
  server.listen(socketPath, () => {
    ipcServerInstance = server;
    logger.info(`[ipc-server] listening on ${socketPath}`);
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
    if (ipcSocketPath && existsSync(ipcSocketPath)) {
      unlinkSync(ipcSocketPath);
    }
    ipcSocketPath = '';
    logger.info('[ipc-server] stopped');
  }
};

// 导出供测试/诊断使用
export const getIpcServerInstance = (): net.Server | null => ipcServerInstance;
