import { Command } from 'commander';
import { registerVerifyCommands } from './verifyCommand';
import * as verify from './verify';
import * as vault from './vault';
import * as sync from './sync';
import * as audit from './audit';

jest.mock('./verify');
jest.mock('./vault');
jest.mock('./sync');
jest.mock('./audit');

function makeProgram() {
  const p = new Command();
  p.exitOverride();
  registerVerifyCommands(p);
  return p;
}

describe('verify command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vault.loadConfig as jest.Mock).mockReturnValue({ files: ['.env'] });
    (sync.getEncryptedFilePath as jest.Mock).mockImplementation((f: string) => `${f}.gpg`);
    (audit.createAuditEntry as jest.Mock).mockReturnValue({});
    (audit.logAuditEntry as jest.Mock).mockReturnValue(undefined);
  });

  it('verifies a single file and exits 0 on success', async () => {
    (verify.verifyEncryptedFile as jest.Mock).mockReturnValue({ valid: true, signer: 'Alice' });
    (verify.formatVerifyResult as jest.Mock).mockReturnValue('✔ ok');
    const p = makeProgram();
    await p.parseAsync(['node', 'envault', 'verify', '.env']);
    expect(verify.verifyEncryptedFile).toHaveBeenCalledWith('.env.gpg');
  });

  it('verifies all files when --all flag is set', async () => {
    (verify.verifyEncryptedFile as jest.Mock).mockReturnValue({ valid: true });
    (verify.formatVerifyResult as jest.Mock).mockReturnValue('✔ ok');
    const p = makeProgram();
    await p.parseAsync(['node', 'envault', 'verify', '--all']);
    expect(verify.verifyEncryptedFile).toHaveBeenCalledTimes(1);
  });

  it('calls process.exit(1) when verification fails', async () => {
    (verify.verifyEncryptedFile as jest.Mock).mockReturnValue({ valid: false, error: 'bad' });
    (verify.formatVerifyResult as jest.Mock).mockReturnValue('✘ bad');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const p = makeProgram();
    await expect(p.parseAsync(['node', 'envault', 'verify', '.env'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
