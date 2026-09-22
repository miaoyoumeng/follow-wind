import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Logger } from '../../src/logging/logger';

describe('Logger isXxxEnabled 级别判断', () => {
  let testLogDir: string;
  let testLogFile: string;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `solo-logger-enabled-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testLogDir, { recursive: true });
    testLogFile = join(testLogDir, 'test.log');
  });

  afterEach(() => {
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('未 configure 时', () => {
    it('isTraceEnabled 返回 false', () => {
      const instance = new Logger();
      expect(instance.isTraceEnabled()).toBe(false);
    });

    it('isDebugEnabled 返回 false', () => {
      const instance = new Logger();
      expect(instance.isDebugEnabled()).toBe(false);
    });

    it('isInfoEnabled 返回 false', () => {
      const instance = new Logger();
      expect(instance.isInfoEnabled()).toBe(false);
    });
  });

  describe('configure 后按 minLevel 判定', () => {
    it('level=trace 时三个函数均返回 true', () => {
      const instance = new Logger();
      instance.configure({ level: 'trace', file: testLogFile });
      expect(instance.isTraceEnabled()).toBe(true);
      expect(instance.isDebugEnabled()).toBe(true);
      expect(instance.isInfoEnabled()).toBe(true);
    });

    it('level=debug 时 trace 关闭，debug/info 开启', () => {
      const instance = new Logger();
      instance.configure({ level: 'debug', file: testLogFile });
      expect(instance.isTraceEnabled()).toBe(false);
      expect(instance.isDebugEnabled()).toBe(true);
      expect(instance.isInfoEnabled()).toBe(true);
    });

    it('level=info 时 trace/debug 关闭，info 开启', () => {
      const instance = new Logger();
      instance.configure({ level: 'info', file: testLogFile });
      expect(instance.isTraceEnabled()).toBe(false);
      expect(instance.isDebugEnabled()).toBe(false);
      expect(instance.isInfoEnabled()).toBe(true);
    });

    it('level=warn 时三个函数均返回 false', () => {
      const instance = new Logger();
      instance.configure({ level: 'warn', file: testLogFile });
      expect(instance.isTraceEnabled()).toBe(false);
      expect(instance.isDebugEnabled()).toBe(false);
      expect(instance.isInfoEnabled()).toBe(false);
    });
  });
});
