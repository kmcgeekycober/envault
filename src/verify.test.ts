import { verifyEncryptedFile, formatVerifyResult, VerifyResult } from './verify';
import { execSync } from 'child_process';
import * as fs from 'fs';

jest.mock('child_process');
jest.mock('fs');

const mockedExec = execSync as jest.MockedFunction<typeof execSync>;
const mockedExists = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('verifyEncryptedFile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns invalid when file does not exist', () => {
    mockedExists.mockReturnValue(false);
    const r = verifyEncryptedFile('/tmp/missing.env.gpg');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/);
  });

  it('parses a valid signature', () => {
    mockedExists.mockReturnValue(true);
    mockedExec.mockReturnValue(
      'Good signature from "Alice <alice@example.com>"\nPrimary key fingerprint: ABCD 1234 EF56 7890' as any
    );
    const r = verifyEncryptedFile('/tmp/test.env.gpg');
    expect(r.valid).toBe(true);
    expect(r.signer).toBe('Alice <alice@example.com>');
    expect(r.fingerprint).toBe('ABCD1234EF567890');
  });

  it('returns invalid on BAD signature', () => {
    mockedExists.mockReturnValue(true);
    mockedExec.mockImplementation(() => { throw { stdout: 'BAD signature detected' }; });
    const r = verifyEncryptedFile('/tmp/bad.env.gpg');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/tampered/);
  });

  it('returns invalid when key not in keyring', () => {
    mockedExists.mockReturnValue(true);
    mockedExec.mockImplementation(() => { throw { stdout: 'No public key' }; });
    const r = verifyEncryptedFile('/tmp/unknown.env.gpg');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/keyring/);
  });
});

describe('formatVerifyResult', () => {
  it('formats a valid result', () => {
    const r: VerifyResult = { valid: true, signer: 'Bob <bob@x.com>', fingerprint: 'DEAD' };
    const out = formatVerifyResult(r, '.env.gpg');
    expect(out).toContain('✔');
    expect(out).toContain('Bob <bob@x.com>');
  });

  it('formats an invalid result', () => {
    const r: VerifyResult = { valid: false, error: 'BAD signature' };
    const out = formatVerifyResult(r, '.env.gpg');
    expect(out).toContain('✘');
    expect(out).toContain('BAD signature');
  });
});
