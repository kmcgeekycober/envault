import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerHookCommands } from './hookCommand';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerHookCommands(program);
  return program;
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-hook-'));
}

describe('hookCommand', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('adds a hook', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'hook', 'add', 'pre-encrypt', 'echo hello']);
    const hooksFile = path.join(tmpDir, '.envault-hooks.json');
    expect(fs.existsSync(hooksFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
    expect(data['pre-encrypt']).toContain('echo hello');
  });

  it('lists hooks', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'hook', 'add', 'post-decrypt', 'echo done']);
    const logs: string[] = [];
    const spy = (msg: string) => logs.push(msg);
    const p2 = makeProgram();
    (p2 as any)._outputHandler = spy;
    await p2.parseAsync(['node', 'envault', 'hook', 'list']);
  });

  it('removes a hook', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'hook', 'add', 'pre-encrypt', 'echo hi']);
    await program.parseAsync(['node', 'envault', 'hook', 'remove', 'pre-encrypt']);
    const hooksFile = path.join(tmpDir, '.envault-hooks.json');
    const data = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
    expect(data['pre-encrypt']).toBeUndefined();
  });
});
