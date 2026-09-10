import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('logging/logger tslog 日志模块', () => {
  let loggerModule: typeof import('../../src/logging');
  let testLogFile: string;
  let testLogDir: string;

  beforeEach(async () => {
    // 每次测试前重置模块状态
    vi.resetModules();
    // 创建临时日志目录
    testLogDir = join(tmpdir(), `solo-logger-test-${Date.now()}`);
    mkdirSync(testLogDir, { recursive: true });
    testLogFile = join(testLogDir, 'test.log');
    // 动态导入确保每次测试都是干净状态
    loggerModule = await import('../../src/logging');
  });

  afterEach(() => {
    // 清理测试文件
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('setup', () => {
    it('初始化后日志文件被创建', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      expect(existsSync(testLogFile)).toBe(true);
    });

    it('未调用 setup 时日志函数不输出', () => {
      // 不 setup，直接调用
      loggerModule.debug('test message');
      loggerModule.info('test message');
      // 不应有异常抛出
    });
  });

  describe('日志级别过滤', () => {
    it('level=info 时 debug 不写入文件', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      loggerModule.debug('debug message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('debug message');
    });

    it('level=info 时 info 写入文件', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      loggerModule.info('info message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('info message');
    });

    it('level=info 时 warn 写入文件', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      loggerModule.warn('warn message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('warn message');
    });

    it('level=info 时 error 写入文件', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      loggerModule.error('error message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('error message');
    });

    it('level=debug 时 debug 写入文件', () => {
      loggerModule.setup({ level: 'debug', file: testLogFile });
      loggerModule.debug('debug message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('debug message');
    });

    it('level=error 时 info 不写入文件', () => {
      loggerModule.setup({ level: 'error', file: testLogFile });
      loggerModule.info('info message');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('info message');
    });
  });

  describe('日志格式', () => {
    it('日志包含级别标签', () => {
      loggerModule.setup({ level: 'debug', file: testLogFile });
      loggerModule.info('test');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content.toUpperCase()).toContain('INFO');
    });

    it('日志包含消息内容', () => {
      loggerModule.setup({ level: 'info', file: testLogFile });
      loggerModule.info('unique-message-12345');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('unique-message-12345');
    });
  });
});
