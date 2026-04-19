import { Command } from 'commander';
import { registerWatchCommands } from './watchCommand';
import { watchEnvFile } from './watch';

jest.mock('./watch');

const mockWatchEnvFile = watchEnvFile as jest.MockedFunction<typeof watchEnvFile>;

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerWatchCommands(program);
  return program;
}

describe('registerWatchCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWatchEnvFile.mockResolvedValue({ stop: jest.fn() });
    jest.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin);
    jest.spyOn(process, 'on').mockImplementation((() => process) as any);
  });

  it('registers watch command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('calls watchEnvFile with defaults', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'watch'], { from: 'user' });
    expect(mockWatchEnvFile).toHaveBeenCalledWith(
      expect.objectContaining({
        vaultDir: expect.stringContaining('.envault'),
        onEncrypt: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('calls watchEnvFile with custom envFile and vault-dir', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'watch', 'prod.env', '--vault-dir', '.vault'], { from: 'user' });
    expect(mockWatchEnvFile).toHaveBeenCalledWith(
      expect.objectContaining({
        envFile: expect.stringContaining('prod.env'),
        vaultDir: expect.stringContaining('.vault'),
      })
    );
  });
});
