import { Command } from 'commander';
import { registerDiffCommands } from './diffCommand';
import * as gpg from './gpg';
import * as fs from 'fs';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDiffCommands(program);
  return program;
}

describe('registerDiffCommands', () => {
  let decryptSpy: jest.SpyInstance;
  let readSpy: jest.SpyInstance;
  let existsSpy: jest.SpyInstance;
  let unlinkSpy: jest.SpyInstance;

  beforeEach(() => {
    decryptSpy = jest.spyOn(gpg, 'decryptFile').mockResolvedValue(undefined as any);
    readSpy = jest.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('A=1\nB=2')
      .mockReturnValueOnce('A=1\nC=3');
    existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('calls decryptFile for both inputs', async () => {
    const program = makeProgram();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'diff', 'a.env.gpg', 'b.env.gpg']);
    expect(decryptSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });

  it('prints formatted diff', async () => {
    const program = makeProgram();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'diff', 'a.env.gpg', 'b.env.gpg']);
    const output = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('+ C=3');
    expect(output).toContain('- B=2');
    logSpy.mockRestore();
  });

  it('cleans up temp files after diff', async () => {
    const program = makeProgram();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'diff', 'a.env.gpg', 'b.env.gpg']);
    expect(unlinkSpy).toHaveBeenCalledTimes(2);
  });
});
