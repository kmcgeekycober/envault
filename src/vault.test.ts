import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig, addRecipient, removeRecipient, lockVault, unlockVault, VaultConfig } from './vault';
import * as gpg from './gpg';

jest.mock('./gpg');
jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedGpg = gpg as jest.Mocked<typeof gpg>;

const BASE_CONFIG: VaultConfig = {
  recipients: ['AABBCCDD'],
  envFile: '.env',
  encryptedFile: '.env.vault',
};

describe('loadConfig', () => {
  it('returns default config when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const config = loadConfig();
    expect(config.envFile).toBe('.env');
    expect(config.recipients).toEqual([]);
  });

  it('merges file config with defaults', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ recipients: ['AABB'] }));
    const config = loadConfig();
    expect(config.recipients).toEqual(['AABB']);
    expect(config.envFile).toBe('.env');
  });

  it('throws on invalid JSON', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('not json');
    expect(() => loadConfig()).toThrow('Failed to parse config');
  });
});

describe('addRecipient', () => {
  it('adds a normalized fingerprint', () => {
    const updated = addRecipient(BASE_CONFIG, 'aa bb cc ee');
    expect(updated.recipients).toContain('AABBCCEE');
  });

  it('throws if recipient already exists', () => {
    expect(() => addRecipient(BASE_CONFIG, 'aabbccdd')).toThrow('already in the config');
  });
});

describe('removeRecipient', () => {
  it('removes a recipient', () => {
    const updated = removeRecipient(BASE_CONFIG, 'aabbccdd');
    expect(updated.recipients).not.toContain('AABBCCDD');
  });

  it('throws if recipient not found', () => {
    expect(() => removeRecipient(BASE_CONFIG, 'FFFFFFFF')).toThrow('not found in config');
  });
});

describe('lockVault', () => {
  it('throws when env file is missing', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await expect(lockVault(BASE_CONFIG)).rejects.toThrow('Env file not found');
  });

  it('throws when no recipients configured', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    await expect(lockVault({ ...BASE_CONFIG, recipients: [] })).rejects.toThrow('No recipients');
  });

  it('calls encryptFile with correct args', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedGpg.encryptFile.mockResolvedValue(undefined);
    await lockVault(BASE_CONFIG);
    expect(mockedGpg.encryptFile).toHaveBeenCalledWith('.env', '.env.vault', ['AABBCCDD']);
  });
});
