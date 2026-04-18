import { formatShareResults, ShareResult } from './share';
import * as shareModule from './share';
import * as vaultModule from './vault';
import * as gpgModule from './gpg';

jest.mock('./vault');
jest.mock('./gpg');

const mockLoadConfig = vaultModule.loadConfig as jest.Mock;
const mockEncryptFile = gpgModule.encryptFile as jest.Mock;

describe('formatShareResults', () => {
  it('formats successful results', () => {
    const results: ShareResult[] = [
      { recipient: 'alice@example.com', outputPath: '.env.alice@example.com.gpg', success: true },
    ];
    const output = formatShareResults(results);
    expect(output).toContain('✓ alice@example.com');
    expect(output).toContain('1/1 recipients succeeded');
  });

  it('formats failed results', () => {
    const results: ShareResult[] = [
      { recipient: 'bob@example.com', outputPath: '', success: false, error: 'key not found' },
    ];
    const output = formatShareResults(results);
    expect(output).toContain('✗ bob@example.com: key not found');
    expect(output).toContain('0/1 recipients succeeded');
  });

  it('formats mixed results', () => {
    const results: ShareResult[] = [
      { recipient: 'alice@example.com', outputPath: 'out.gpg', success: true },
      { recipient: 'bob@example.com', outputPath: '', success: false, error: 'missing key' },
    ];
    const output = formatShareResults(results);
    expect(output).toContain('1/2 recipients succeeded');
  });
});

describe('shareEnvFile', () => {
  it('returns success result on encrypt success', async () => {
    mockEncryptFile.mockResolvedValue(undefined);
    const result = await shareModule.shareEnvFile('.env', 'alice@example.com', '.');
    expect(result.success).toBe(true);
    expect(result.recipient).toBe('alice@example.com');
  });

  it('returns failure result on encrypt error', async () => {
    mockEncryptFile.mockRejectedValue(new Error('gpg error'));
    const result = await shareModule.shareEnvFile('.env', 'bob@example.com', '.');
    expect(result.success).toBe(false);
    expect(result.error).toBe('gpg error');
  });
});

describe('shareWithAllRecipients', () => {
  it('throws if no recipients configured', async () => {
    mockLoadConfig.mockReturnValue({ recipients: [] });
    await expect(shareModule.shareWithAllRecipients('.env')).rejects.toThrow('No recipients configured');
  });

  it('shares with all configured recipients', async () => {
    mockLoadConfig.mockReturnValue({ recipients: ['alice@example.com', 'bob@example.com'] });
    mockEncryptFile.mockResolvedValue(undefined);
    const results = await shareModule.shareWithAllRecipients('.env', '.');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
  });
});
