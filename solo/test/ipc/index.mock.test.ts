import { describe, it, expect } from 'vitest';
import * as ipc from '../../src/ipc';

describe('ipc/index', () => {
  it('导出 IPC_METHODS 常量', () => {
    expect(ipc.IPC_METHODS).toBeDefined();
    expect(ipc.IPC_METHODS.registerTask).toBe('registerTask');
  });

  it('导出 handleMessage 服务端处理函数', () => {
    expect(typeof ipc.handleMessage).toBe('function');
  });

  it('导出 registerTask 客户端函数', () => {
    expect(typeof ipc.registerTask).toBe('function');
  });

  it('导出 listTasks 客户端函数', () => {
    expect(typeof ipc.listTasks).toBe('function');
  });

  it('导出 exitDaemon 客户端函数', () => {
    expect(typeof ipc.exitDaemon).toBe('function');
  });
});
