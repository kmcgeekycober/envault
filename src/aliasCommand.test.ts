import { Command } from 'commander';
import * as aliasModule from './alias';
import { registerAliasCommands } from './aliasCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAliasCommands(program);
  return program;
}

describe('aliasCommand', () => {
  let addAlias: jest.SpyInstance;
  let removeAlias: jest.SpyInstance;
  let loadAliases: jest.SpyInstance;
  let formatAliases: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    addAlias = jest.spyOn(aliasModule, 'addAlias').mockReturnValue({});
    removeAlias = jest.spyOn(aliasModule, 'removeAlias').mockReturnValue({});
    loadAliases = jest.spyOn(aliasModule, 'loadAliases').mockReturnValue({ prod: '.env.production' });
    formatAliases = jest.spyOn(aliasModule, 'formatAliases').mockReturnValue('  prod -> .env.production');
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('alias add calls addAlias', () => {
    makeProgram().parse(['alias', 'add', 'prod', '.env.production'], { from: 'user' });
    expect(addAlias).toHaveBeenCalledWith('prod', '.env.production');
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('prod'));
  });

  it('alias remove calls removeAlias', () => {
    makeProgram().parse(['alias', 'remove', 'prod'], { from: 'user' });
    expect(removeAlias).toHaveBeenCalledWith('prod');
  });

  it('alias remove prints error on failure', () => {
    removeAlias.mockImplementation(() => { throw new Error('Alias not found'); });
    const prog = makeProgram();
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => prog.parse(['alias', 'remove', 'ghost'], { from: 'user' })).toThrow('exit');
    expect(consoleError).toHaveBeenCalled();
    exit.mockRestore();
  });

  it('alias list calls formatAliases', () => {
    makeProgram().parse(['alias', 'list'], { from: 'user' });
    expect(loadAliases).toHaveBeenCalled();
    expect(formatAliases).toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith('  prod -> .env.production');
  });
});
