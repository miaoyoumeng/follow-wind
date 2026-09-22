import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import * as barrel from '../../src/commander';
import * as agentModule from '../../src/commander/agent';
import * as agentsModule from '../../src/commander/agents';
import * as captureModule from '../../src/commander/capture';
import * as chatModule from '../../src/commander/chat';
import * as dashboardModule from '../../src/commander/dashboard';
import * as hookModule from '../../src/commander/hook';
import * as initModule from '../../src/commander/init';
import * as startModule from '../../src/commander/start';
import * as statusModule from '../../src/commander/status';
import * as stopModule from '../../src/commander/stop';
import * as usageModule from '../../src/commander/usage';
import * as versionModule from '../../src/commander/version';

type ModuleExports = Record<string, unknown>;

const barrelExports = barrel as unknown as ModuleExports;

/** [桶文件导出的函数名, 该函数定义所在的源模块] */
const RE_EXPORTED: Array<[string, ModuleExports]> = [
  ['runInit', initModule],
  ['runVersion', versionModule],
  ['runStatus', statusModule],
  ['validateWorkspace', statusModule],
  ['runStart', startModule],
  ['runStop', stopModule],
  ['runDashboard', dashboardModule],
  ['runAgents', agentsModule],
  ['registerAgentCommand', agentModule],
  ['runChat', chatModule],
  ['runHook', hookModule],
  ['runCapture', captureModule],
  ['runUsage', usageModule]
];

describe('src/commander 桶文件', () => {
  it.each(RE_EXPORTED)('导出 %s，且与源模块是同一个函数引用', (name, sourceModule) => {
    expect(typeof sourceModule[name]).toBe('function');
    expect(barrelExports[name]).toBe(sourceModule[name]);
  });
});

describe('src/bin/solo.ts', () => {
  it('commander 函数统一从 ../commander 桶文件引入，不再深层引用子模块', () => {
    const source = readFileSync('src/bin/solo.ts', 'utf-8');
    expect(source).toContain("from '../commander'");
    expect(source).not.toMatch(/from '\.\.\/commander\//);
  });

  it('可见命令通过 registerCommands 命令表注册；仅隐藏命令 _task-worker 允许直接使用 program.command()', () => {
    const source = readFileSync('src/bin/solo.ts', 'utf-8');
    expect(source).toContain('registerCommands(program, COMMANDS)');
    // registerCommands 函数体内的 program.command(spec.name) 是注册机制本身，不算直接调用
    const directCalls = source.match(/\bprogram[\s\n]*\.command\([^)]*\)/g) ?? [];
    const allowed = directCalls.filter(c => c.includes('_task-worker') || c.includes('spec.name'));
    expect(directCalls.filter(c => !allowed.includes(c))).toEqual([]);
  });
});
