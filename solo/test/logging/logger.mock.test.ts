import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Logger, logger, setup } from '../../src/logging/logger';

describe('Logger 类', () => {
  let testLogFile: string;
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `solo-logger-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testLogDir, { recursive: true });
    testLogFile = join(testLogDir, 'test.log');
  });

  afterEach(() => {
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('实例', () => {
    it('Logger 类可实例化', () => {
      const instance = new Logger();
      expect(instance).toBeInstanceOf(Logger);
    });

    it('logger 为 Logger 实例', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('日志级别过滤', () => {
    it('level=info 时 trace 不写入文件', () => {
      setup({ level: 'debug', file: testLogFile });
      logger.trace('trace-msg-xyz');
      if (!existsSync(testLogFile)) return;
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('trace-msg-xyz');
    });

    it('level=info 时 debug 不写入文件', () => {
      setup({ level: 'info', file: testLogFile });
      logger.debug('debug-msg-abc');
      if (!existsSync(testLogFile)) return;
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('debug-msg-abc');
    });

    it('level=info 时 info 写入文件', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('info-msg-def');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('info-msg-def');
    });

    it('level=info 时 warn 写入文件', () => {
      setup({ level: 'info', file: testLogFile });
      logger.warn('warn-msg-ghi');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('warn-msg-ghi');
    });

    it('level=info 时 error 写入文件', () => {
      setup({ level: 'info', file: testLogFile });
      logger.error('error-msg-jkl');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('error-msg-jkl');
    });

    it('level=debug 时 trace 仍不写入文件（debug 为最低配置级别）', () => {
      setup({ level: 'debug', file: testLogFile });
      logger.trace('trace-should-not-appear');
      if (!existsSync(testLogFile)) return;
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('trace-should-not-appear');
    });

    it('level=debug 时 debug 写入文件', () => {
      setup({ level: 'debug', file: testLogFile });
      logger.debug('debug-visible');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('debug-visible');
    });

    it('level=error 时 info 不写入文件', () => {
      setup({ level: 'error', file: testLogFile });
      logger.info('info-should-not-appear');
      if (!existsSync(testLogFile)) return;
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).not.toContain('info-should-not-appear');
    });
  });

  describe('消息原样输出', () => {
    it('含占位符的消息原样写入，不做替换', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('user ${name} logged in');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('user ${name} logged in');
    });
  });

  describe('setup', () => {
    it('首次写入日志后文件被创建', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('create-file');
      expect(existsSync(testLogFile)).toBe(true);
    });

    it('未调用 setup 时 logger 方法不输出（无异常）', () => {
      const freshLogger = new Logger();
      freshLogger.info('should-not-crash');
    });
  });

  describe('追加模式', () => {
    it('默认 setup 不覆盖已有日志文件内容', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('first-session-message');
      setup({ level: 'info', file: testLogFile });
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('first-session-message');
    });

    it('多次 setup 后新旧日志都保留', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('before-reinit');
      setup({ level: 'info', file: testLogFile });
      logger.info('after-reinit');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('before-reinit');
      expect(content).toContain('after-reinit');
    });
  });

  describe('日志格式', () => {
    it('日志包含级别标签', () => {
      setup({ level: 'debug', file: testLogFile });
      logger.info('format-test');
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content.toUpperCase()).toContain('INFO');
    });

    it('日志包含时间戳', () => {
      setup({ level: 'info', file: testLogFile });
      logger.info('timestamp-test');
      const content = readFileSync(testLogFile, 'utf-8');
      // 时间戳格式 [YYYY-MM-DD HH:MM:SS.mmm]
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}/);
    });
  });
});
