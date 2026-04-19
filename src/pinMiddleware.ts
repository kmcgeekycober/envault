import { loadPins, Pin } from './pin';
import * as path from 'path';

export interface PinCheckResult {
  key: string;
  pinned: boolean;
  file?: string;
  note?: string;
}

export function checkPinnedKeys(
  envKeys: string[],
  vaultDir: string
): PinCheckResult[] {
  const pins = loadPins(vaultDir);
  return envKeys.map((key) => {
    const pin = pins.find((p: Pin) => p.key === key);
    return pin
      ? { key, pinned: true, file: pin.file, note: pin.note }
      : { key, pinned: false };
  });
}

export function warnOnMissingPins(
  envKeys: string[],
  vaultDir: string
): string[] {
  const pins = loadPins(vaultDir);
  const pinnedKeys = new Set(pins.map((p: Pin) => p.key));
  return pins
    .map((p: Pin) => p.key)
    .filter((key: string) => !envKeys.includes(key));
}

export function withPinCheck(
  envKeys: string[],
  vaultDir: string,
  onMissing: (missing: string[]) => void
): void {
  const missing = warnOnMissingPins(envKeys, vaultDir);
  if (missing.length > 0) {
    onMissing(missing);
  }
}
