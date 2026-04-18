import { Command } from 'commander';
import { registerTemplateCommands } from './templateCommand';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommands(program);
  return program;
}

describe('template validate', () => {
  it('exits with error if template file not found', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const program = makeProgram();
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['node', 'envault', 'template', 'validate', '.env'])
    ).toThrow();
    spy.mockRestore();
  });

  it('reports success when all required keys present', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation((p: any) => {
      if (String(p).includes('template')) return 'API_KEY=\n';
      return 'API_KEY=secret\n';
    });
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'envault', 'template', 'validate', '.env', '-t', '.env.template']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    consoleSpy.mockRestore();
  });
});

describe('template generate', () => {
  it('writes template file', () => {
    mockedFs.readFileSync.mockReturnValue('FOO=bar\nBAR=baz\n' as any);
    mockedFs.writeFileSync.mockImplementation(() => {});
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'envault', 'template', 'generate', '.env', '-o', '.env.template']);
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      '.env.template',
      expect.stringContaining('FOO='),
      'utf-8'
    );
    consoleSpy.mockRestore();
  });
});
