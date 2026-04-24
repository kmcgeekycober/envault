import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerSchemaCommands } from './schemaCommand';
import { loadSchema } from './schema';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schemacmd-'));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSchemaCommands(program);
  return program;
}

describe('registerSchemaCommands', () => {
  let tmpDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  it('adds a schema field', () => {
    const program = makeProgram();
    program.parse(['schema', 'add', 'PORT', '--type', 'number', '--required'], { from: 'user' });
    const schema = loadSchema(tmpDir);
    expect(schema).not.toBeNull();
    expect(schema!.fields[0].key).toBe('PORT');
    expect(schema!.fields[0].type).toBe('number');
    expect(schema!.fields[0].required).toBe(true);
  });

  it('removes a schema field', () => {
    const program = makeProgram();
    program.parse(['schema', 'add', 'PORT', '--type', 'number'], { from: 'user' });
    program.parse(['schema', 'remove', 'PORT'], { from: 'user' });
    const schema = loadSchema(tmpDir);
    expect(schema!.fields).toHaveLength(0);
  });

  it('validates a valid env file', () => {
    const program = makeProgram();
    program.parse(['schema', 'add', 'PORT', '--type', 'number', '--required'], { from: 'user' });
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=3000\n');
    expect(() =>
      program.parse(['schema', 'validate', '.env'], { from: 'user' })
    ).not.toThrow();
  });

  it('exits on validation failure', () => {
    const program = makeProgram();
    program.parse(['schema', 'add', 'PORT', '--type', 'number', '--required'], { from: 'user' });
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=notanumber\n');
    const mockExit = (code?: number) => { throw new Error(`exit:${code}`); };
    const origExit = process.exit;
    process.exit = mockExit as never;
    try {
      expect(() =>
        program.parse(['schema', 'validate', '.env'], { from: 'user' })
      ).toThrow('exit:1');
    } finally {
      process.exit = origExit;
      process.cwd = originalCwd;
    }
  });
});
