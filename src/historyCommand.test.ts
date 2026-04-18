import { Command } from 'commander';
import { registerHistoryCommands } from './historyCommand';
import * as history from './history';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommands(program);
  return program;
}

describe('historyCommand', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists all history', () => {
    jest.spyOn(history, 'loadHistory').mockReturnValue([
      { timestamp: '2024-01-01T00:00:00Z', file: '.env', action: 'encrypt', user: 'alice', checksum: 'abc12345' }
    ]);
    jest.spyOn(history, 'formatHistory').mockReturnValue('formatted output');
    makeProgram().parse(['history', 'list'], { from: 'user' });
    expect(logSpy).toHaveBeenCalledWith('formatted output');
  });

  it('filters by file', () => {
    const spy = jest.spyOn(history, 'getFileHistory').mockReturnValue([]);
    jest.spyOn(history, 'formatHistory').mockReturnValue('No history found.');
    makeProgram().parse(['history', 'list', '--file', '.env.prod'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('.env.prod');
  });

  it('shows no history message', () => {
    jest.spyOn(history, 'loadHistory').mockReturnValue([]);
    jest.spyOn(history, 'formatHistory').mockReturnValue('No history found.');
    makeProgram().parse(['history', 'list'], { from: 'user' });
    expect(logSpy).toHaveBeenCalledWith('No history found.');
  });
});
