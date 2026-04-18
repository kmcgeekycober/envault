import { execSync } from 'child_process';
import * as fs from 'fs';

export interface VerifyResult {
  valid: boolean;
  signer?: string;
  fingerprint?: string;
  error?: string;
}

export function verifyEncryptedFile(filePath: string): VerifyResult {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: `File not found: ${filePath}` };
  }
  try {
    const output = execSync(`gpg --verify "${filePath}" 2>&1`, { encoding: 'utf8' });
    const signerMatch = output.match(/Good signature from "(.+?)"/);
    const fpMatch = output.match(/Primary key fingerprint:\s+([A-F0-9 ]+)/);
    return {
      valid: true,
      signer: signerMatch?.[1],
      fingerprint: fpMatch?.[1]?.replace(/\s+/g, ''),
    };
  } catch (err: any) {
    const msg: string = err.stdout ?? err.message ?? '';
    if (msg.includes('No public key')) {
      return { valid: false, error: 'Signer key not in keyring' };
    }
    if (msg.includes('BAD signature')) {
      return { valid: false, error: 'BAD signature — file may be tampered' };
    }
    return { valid: false, error: msg.trim() };
  }
}

export function formatVerifyResult(result: VerifyResult, filePath: string): string {
  if (result.valid) {
    const lines = [`✔  ${filePath} — signature valid`];
    if (result.signer) lines.push(`   Signed by : ${result.signer}`);
    if (result.fingerprint) lines.push(`   Fingerprint: ${result.fingerprint}`);
    return lines.join('\n');
  }
  return `✘  ${filePath} — ${result.error ?? 'unknown error'}`;
}
