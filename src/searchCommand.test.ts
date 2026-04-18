import { Command } from 'commander';
import { registerSearchCommands } from './searchCommand';
import * as search from './search';
import * as vault from './vault';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSearchCommands(program);
  return program;
}

describe('searchCommand', () => {
  beforeEach(() => {
    jest.spyOn(vault, 'loadConfig').mockResolvedValue({
      recipients: [],
      encryptedFile: '.env.vault',
    } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints formatted results when matches found', async () => {
    jest.spyOn(search, 'searchEnvKeys').mockResolvedValue([
      { key: 'DATABASE_URL', line: 1 },
    ] as any);
    jest.spyOn(search, 'formatSearchResults').mockReturnValue('DATABASE_URL (line 1)');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await makeProgram().parseAsync(['node', 'envault', 'search', 'DATABASE']);

    expect(search.searchEnvKeys).toHaveBeenCalledWith('.env.vault', 'DATABASE', { ignoreCase: false });
    expect(consoleSpy).toHaveBeenCalledWith('DATABASE_URL (line 1)');
  });

  it('prints no-match message when results are empty', async () => {
    jest.spyOn(search, 'searchEnvKeys').mockResolvedValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await makeProgram().parseAsync(['node', 'envault', 'search', 'MISSING']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No keys matching'));
  });

  it('outputs JSON when --json flag is set', async () => {
    const results = [{ key: 'API_KEY', line: 3 }];
    jest.spyOn(search, 'searchEnvKeys').mockResolvedValue(results as any);
    jest.spyOn(search, 'formatSearchResults').mockReturnValue('');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await makeProgram().parseAsync(['node', 'envault', 'search', 'API', '--json']);
    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(results, null, 2));
  });

  it('exits with code 1 on error', async () => {
    jest.spyOn(search, 'searchEnvKeys').mockRejectedValue(new Error('decrypt failed'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation();

    await expect(makeProgram().parseAsync(['node', 'envault', 'search', 'KEY'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
