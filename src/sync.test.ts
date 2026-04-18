import * as fs from 'fs';
import * as path from 'path';
import { pushEnv, pullEnv, getEncryptedFilePath, getGitUser } from './sync';
import * as vault from './vault';
import * as gpg from './gpg';

jest.mock('./vault');
jest.mock('./gpg');
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue('user@example.com\n'),
}));
jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedVault = vault as jest.Mocked<typeof vault>;
const mockedGpg = gpg as jest.Mocked<typeof gpg>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedVault.loadConfig.mockReturnValue({ recipients: ['alice@example.com'], version: 1 });
  mockedGpg.encryptFile.mockResolvedValue(undefined);
  mockedGpg.decryptFile.mockResolvedValue(undefined);
});

describe('getEncryptedFilePath', () => {
  it('appends .gpg to the file path', () => {
    expect(getEncryptedFilePath('.env')).toBe('.env.gpg');
    expect(getEncryptedFilePath('.env.production')).toBe('.env.production.gpg');
  });
});

describe('pushEnv', () => {
  it('throws if no recipients configured', async () => {
    mockedVault.loadConfig.mockReturnValue({ recipients: [], version: 1 });
    mockedFs.existsSync.mockReturnValue(true);
    await expect(pushEnv()).rejects.toThrow('No recipients configured');
  });

  it('throws if env file does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await expect(pushEnv()).rejects.toThrow('File not found');
  });

  it('encrypts and writes meta on success', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.writeFileSync.mockImplementation(() => {});
    const result = await pushEnv('.env');
    expect(mockedGpg.encryptFile).toHaveBeenCalledWith('.env', '.env.gpg', ['alice@example.com']);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
    expect(result.status).toBe('pushed');
  });
});

describe('pullEnv', () => {
  it('throws if encrypted file does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await expect(pullEnv()).rejects.toThrow('Encrypted file not found');
  });

  it('returns up-to-date if local file is newer', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ timestamp: 1000 }));
    mockedFs.statSync.mockReturnValue({ mtimeMs: 2000 } as any);
    const result = await pullEnv('.env');
    expect(result.status).toBe('up-to-date');
    expect(mockedGpg.decryptFile).not.toHaveBeenCalled();
  });

  it('decrypts if encrypted file is newer', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ timestamp: 9999 }));
    mockedFs.statSync.mockReturnValue({ mtimeMs: 100 } as any);
    const result = await pullEnv('.env');
    expect(mockedGpg.decryptFile).toHaveBeenCalled();
    expect(result.status).toBe('pulled');
  });
});
