import * as fs from 'fs';
import { parseEnvEntries, serializeEnvEntries } from './env';

export interface MaskOptions {
  pattern?: RegExp;
  keys?: string[];
  maskChar?: string;
  visibleChars?: number;
}

const DEFAULT_SENSITIVE_PATTERN = /(?:password|secret|token|key|auth|api_key|private|credential)/i;
const DEFAULT_MASK_CHAR = '*';
const DEFAULT_VISIBLE_CHARS = 4;

export function maskValue(value: string, maskChar = DEFAULT_MASK_CHAR, visibleChars = DEFAULT_VISIBLE_CHARS): string {
  if (value.length <= visibleChars) {
    return maskChar.repeat(value.length);
  }
  const visible = value.slice(-visibleChars);
  return maskChar.repeat(value.length - visibleChars) + visible;
}

export function isSensitiveKey(key: string, options: MaskOptions = {}): boolean {
  const pattern = options.pattern ?? DEFAULT_SENSITIVE_PATTERN;
  if (options.keys && options.keys.includes(key)) return true;
  return pattern.test(key);
}

export function maskEnvEntries(
  entries: Record<string, string>,
  options: MaskOptions = {}
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (isSensitiveKey(key, options)) {
      result[key] = maskValue(value, options.maskChar, options.visibleChars);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function maskEnvContent(content: string, options: MaskOptions = {}): string {
  const entries = parseEnvEntries(content);
  const masked = maskEnvEntries(entries, options);
  return serializeEnvEntries(masked);
}

export function maskEnvFile(filePath: string, options: MaskOptions = {}): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return maskEnvContent(content, options);
}

export function formatMaskedOutput(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}
