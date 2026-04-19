import { Command } from 'commander';
import { registerLockCommands } from './lockCommand';
import * as lock from './lock';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerLockCommands(program);
  return program;
}

jest.mock('./lock');

const mockedLock = lock as jest.Mocked<typeof lock>;

describe('lock command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('acquires a lock', async () => {
    mockedLock.acquireLock.mockResolvedValue({ file: '.env', lockedBy: 'alice', lockedAt: new Date().toISOString(), pid: 123 });
    mockedLock.formatLock.mockReturnValue('Locked by alice');
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'lock', 'acquire', '.env', '--user', 'alice']);
    expect(mockedLock.acquireLock).toHaveBeenCalledWith('.env', 'alice');
  });

  it('releases a lock', async () => {
    mockedLock.releaseLock.mockResolvedValue(undefined);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'lock', 'release', '.env']);
    expect(mockedLock.releaseLock).toHaveBeenCalledWith('.env');
  });

  it('reads a lock', async () => {
    mockedLock.readLock.mockResolvedValue({ file: '.env', lockedBy: 'alice', lockedAt: new Date().toISOString(), pid: 123 });
    mockedLock.formatLock.mockReturnValue('Locked by alice');
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'lock', 'status', '.env']);
    expect(mockedLock.readLock).toHaveBeenCalledWith('.env');
  });

  it('shows no lock when status returns null', async () => {
    mockedLock.readLock.mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'lock', 'status', '.env']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not locked'));
    consoleSpy.mockRestore();
  });
});
