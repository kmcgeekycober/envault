import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPinCommands } from './pinCommand';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pin-'));
}

function makeProgram(dir: string) {
  const program = new Command();
  program.exitOverride();
  registerPinCommands(program, dir);
  return program;
}

describe('pinCommand', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('adds a pin', async () => {
    const program = makeProgram(tmpDir);
    await program.parseAsync(['node', 'envault', 'pin', 'add', 'mykey', '--file', '.env']);
    const pinsFile = path.join(tmpDir, 'pins.json');
    expect(fs.existsSync(pinsFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(pinsFile, 'utf8'));
    expect(data.some((p: any) => p.key === 'mykey')).toBe(true);
  });

  it('lists pins', async () => {
    const program = makeProgram(tmpDir);
    await program.parseAsync(['node', 'envault', 'pin', 'add', 'mykey', '--file', '.env']);
    const logs: string[] = [];
    const spy = (msg: string) => logs.push(msg);
    const program2 = makeProgram(tmpDir);
    program2.configureOutput({ writeOut: spy });
    await program2.parseAsync(['node', 'envault', 'pin', 'list']);
    expect(logs.join('\n')).toMatch('mykey');
  });

  it('removes a pin', async () => {
    const program = makeProgram(tmpDir);
    await program.parseAsync(['node', 'envault', 'pin', 'add', 'mykey', '--file', '.env']);
    await program.parseAsync(['node', 'envault', 'pin', 'remove', 'mykey']);
    const pinsFile = path.join(tmpDir, 'pins.json');
    const data = JSON.parse(fs.readFileSync(pinsFile, 'utf8'));
    expect(data.some((p: any) => p.key === 'mykey')).toBe(false);
  });
});
