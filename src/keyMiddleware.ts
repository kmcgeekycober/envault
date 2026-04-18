import { loadConfig } from './vault';
import { listPublicKeys } from './gpg';

export interface KeyValidationResult {
  valid: boolean;
  missing: string[];
  found: string[];
}

/**
 * Validates that all configured recipients have a corresponding
 * public key available in the local GPG keyring.
 */
export async function validateRecipientKeys(): Promise<KeyValidationResult> {
  const config = await loadConfig();
  const recipients: string[] = config.recipients ?? [];

  if (recipients.length === 0) {
    return { valid: true, missing: [], found: [] };
  }

  const availableKeys = await listPublicKeys();
  const availableFingerprints = new Set(availableKeys.map((k) => k.fingerprint));

  const found: string[] = [];
  const missing: string[] = [];

  for (const recipient of recipients) {
    if (availableFingerprints.has(recipient)) {
      found.push(recipient);
    } else {
      missing.push(recipient);
    }
  }

  return { valid: missing.length === 0, missing, found };
}

/**
 * Middleware guard: throws if any recipient key is missing from keyring.
 */
export async function assertRecipientsValid(): Promise<void> {
  const result = await validateRecipientKeys();
  if (!result.valid) {
    const list = result.missing.join(', ');
    throw new Error(
      `Missing GPG keys for recipients: ${list}\n` +
      `Import them with: gpg --recv-keys ${result.missing.join(' ')}`
    );
  }
}
