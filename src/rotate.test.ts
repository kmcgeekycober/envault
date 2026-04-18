import { rotateEncryption, rotateAll } from './rotate';
import * as vault from './vault';
import * as gpg from './gpg';
import * as sync from './sync';
import * as audit from './audit';
import * as fs from 'fs/promises';

jest.mock('./vault');
jest.mock('./gpg');
jest.mock('./sync');
jest.mock('./audit');
jest.mock('fs/promises');

const mockConfig = { recipients: ['alice@example.com', 'bob@example.com'], envFiles: ['.env', '.env.staging'] };

beforeEach(() => {
  jest.clearAllMocks();
  (vault.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
  (sync.getEncryptedFilePath as jest.Mock).mockImplementation((f: string) => `${f}.gpg`);
  (gpg.decryptFile as jest.Mock).mockResolvedValue(undefined);
  (gpg.encryptFile as jest.Mock).mockResolvedValue(undefined);
  (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  (fs.copyFile as jest.Mock).mockResolvedValue(undefined);
  (audit.createAuditEntry as jest.Mock).mockReturnValue({ action: 'rotate' });
  (audit.logAuditEntry as jest.Mock).mockResolvedValue(undefined);
});

describe('rotateEncryption', () => {
  it('decrypts then re-encrypts with current recipients', async () => {
    const result = await rotateEncryption('.env', '.envault.json');
    expect(gpg.decryptFile).toHaveBeenCalledWith('.env.gpg', '.env.rotate.tmp');
    expect(gpg.encryptFile).toHaveBeenCalledWith('.env.rotate.tmp', '.env.gpg', mockConfig.recipients);
    expect(fs.unlink).toHaveBeenCalledWith('.env.rotate.tmp');
    expect(result.recipients).toEqual(mockConfig.recipients);
    expect(result.encryptedFile).toBe('.env.gpg');
  });

  it('falls back to plaintext if no encrypted file exists', async () => {
    (gpg.decryptFile as jest.Mock).mockRejectedValue(new Error('not found'));
    await rotateEncryption('.env', '.envault.json');
    expect(fs.copyFile).toHaveBeenCalledWith('.env', '.env.rotate.tmp');
    expect(gpg.encryptFile).toHaveBeenCalled();
  });

  it('throws when no recipients configured', async () => {
    (vault.loadConfig as jest.Mock).mockResolvedValue({ recipients: [] });
    await expect(rotateEncryption('.env', '.envault.json')).rejects.toThrow('No recipients');
  });

  it('logs an audit entry after rotation', async () => {
    await rotateEncryption('.env', '.envault.json');
    expect(audit.logAuditEntry).toHaveBeenCalled();
  });
});

describe('rotateAll', () => {
  it('rotates all configured env files', async () => {
    const results = await rotateAll('.envault.json');
    expect(results).toHaveLength(2);
    expect(gpg.encryptFile).toHaveBeenCalledTimes(2);
  });
});
