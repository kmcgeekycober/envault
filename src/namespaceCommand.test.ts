import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerNamespaceCommands } from './namespaceCommand';
import { loadNamespaces } from './namespace';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-nscmd-'));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNamespaceCommands(program);
  return program;
}

describe('namespaceCommand', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('namespace add creates a namespace entry', () => {
    const program = makeProgram();
    program.parse(['namespace', 'add', 'prod', '.env.prod'], { from: 'user' });
    const config = loadNamespaces(tmpDir);
    expect(config.namespaces['prod']).toBe('.env.prod');
  });

  test('namespace list outputs namespaces', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['namespace', 'add', 'dev', '.env.dev'], { from: 'user' });
    program.parse(['namespace', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('.env.dev'));
    spy.mockRestore();
  });

  test('namespace use sets active namespace', () => {
    const program = makeProgram();
    program.parse(['namespace', 'add', 'staging', '.env.staging'], { from: 'user' });
    program.parse(['namespace', 'use', 'staging'], { from: 'user' });
    const config = loadNamespaces(tmpDir);
    expect(config.active).toBe('staging');
  });

  test('namespace remove deletes entry', () => {
    const program = makeProgram();
    program.parse(['namespace', 'add', 'test', '.env.test'], { from: 'user' });
    program.parse(['namespace', 'remove', 'test'], { from: 'user' });
    const config = loadNamespaces(tmpDir);
    expect(config.namespaces['test']).toBeUndefined();
  });

  test('namespace remove unknown prints error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = makeProgram();
    program.parse(['namespace', 'remove', 'nonexistent'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});
