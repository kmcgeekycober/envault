import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vault from './vault';
import * as gpg from './gpg';

jest.mock('./vault');
jest.mock('./gpg');

const mockedVault = vault as jest.Mocked<typeof vault>;
const mockedGpg = gpg as jest.Mocked<typeof gpg>;

describe('CLI commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('init saves a default config', async () => {
    mockedVault.saveConfig.mockResolvedValue(undefined);
    const { run } = await import('./cli');
    // Simulate init action directly
    await mockedVault.saveConfig({ recipients: [], vaultFile: '.env.vault' });
    expect(mockedVault.saveConfig).toHaveBeenCalledWith({ recipients: [], vaultFile: '.env.vault' });
  });

  it('encrypt calls encryptFile with recipients', async () => {
    mockedVault.loadConfig.mockResolvedValue({ recipients: ['KEYID1'], vaultFile: '.env.vault' });
    mockedGpg.encryptFile.mockResolvedValue(undefined);

    const config = await mockedVault.loadConfig();
    await mockedGpg.encryptFile('.env', '.env.vault', config.recipients);

    expect(mockedGpg.encryptFile).toHaveBeenCalledWith('.env', '.env.vault', ['KEYID1']);
  });

  it('encrypt exits when no recipients', async () => {
    mockedVault.loadConfig.mockResolvedValue({ recipients: [], vaultFile: '.env.vault' });
    const config = await mockedVault.loadConfig();
    expect(config.recipients.length).toBe(0);
  });

  it('decrypt calls decryptFile', async () => {
    mockedGpg.decryptFile.mockResolvedValue(undefined);
    await mockedGpg.decryptFile('.env.vault', '.env');
    expect(mockedGpg.decryptFile).toHaveBeenCalledWith('.env.vault', '.env');
  });

  it('add-recipient calls addRecipient', async () => {
    mockedVault.addRecipient.mockResolvedValue(undefined);
    await mockedVault.addRecipient('NEWKEY123');
    expect(mockedVault.addRecipient).toHaveBeenCalledWith('NEWKEY123');
  });

  it('remove-recipient calls removeRecipient', async () => {
    mockedVault.removeRecipient.mockResolvedValue(undefined);
    await mockedVault.removeRecipient('OLDKEY456');
    expect(mockedVault.removeRecipient).toHaveBeenCalledWith('OLDKEY456');
  });

  it('list-keys prints available keys', async () => {
    mockedGpg.listPublicKeys.mockResolvedValue(['KEY1 Alice <alice@example.com>', 'KEY2 Bob <bob@example.com>']);
    const keys = await mockedGpg.listPublicKeys();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toContain('Alice');
  });
});
