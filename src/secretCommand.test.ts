import { Command } from 'commander';
import { registerSecretCommands } from './secretCommand';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerSecretCommands(p);
  return p;
}

describe('secretCommand', () => {
  let dir: string;
  let origCwd: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-scmd-'));
    origCwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.rmSync(dir, { recursive: true });
  });

  it('adds a secret and lists it', () => {
    const p = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['node', 'cli', 'secret', 'add', 'MY_KEY', '--description', 'test key']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('MY_KEY'));
    spy.mockRestore();
  });

  it('lists secrets', () => {
    const p = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['node', 'cli', 'secret', 'list']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('check passes when all required keys present', () => {
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'DB_URL=postgres://localhost\nAPI_KEY=abc\n');
    const p = makeProgram();
    p.parse(['node', 'cli', 'secret', 'add', 'DB_URL']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['node', 'cli', 'secret', 'check', envFile]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('present'));
    spy.mockRestore();
  });
});
