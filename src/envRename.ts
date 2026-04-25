import * as fs from "fs";
import * as path from "path";

export interface RenameResult {
  oldKey: string;
  newKey: string;
  success: boolean;
  reason?: string;
}

export function renameEnvKey(
  entries: Record<string, string>,
  oldKey: string,
  newKey: string
): { entries: Record<string, string>; result: RenameResult } {
  if (!Object.prototype.hasOwnProperty.call(entries, oldKey)) {
    return {
      entries,
      result: { oldKey, newKey, success: false, reason: `Key "${oldKey}" not found` },
    };
  }
  if (Object.prototype.hasOwnProperty.call(entries, newKey)) {
    return {
      entries,
      result: { oldKey, newKey, success: false, reason: `Key "${newKey}" already exists` },
    };
  }
  const updated: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k === oldKey) {
      updated[newKey] = v;
    } else {
      updated[k] = v;
    }
  }
  return { entries: updated, result: { oldKey, newKey, success: true } };
}

export function renameEnvKeyInFile(
  filePath: string,
  oldKey: string,
  newKey: string
): RenameResult {
  if (!fs.existsSync(filePath)) {
    return { oldKey, newKey, success: false, reason: `File not found: ${filePath}` };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const entries: Record<string, string> = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    entries[k] = v;
  }
  const { entries: updated, result } = renameEnvKey(entries, oldKey, newKey);
  if (!result.success) return result;
  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return line;
    const k = trimmed.slice(0, eq).trim();
    if (k === oldKey) {
      return `${newKey}=${updated[newKey]}`;
    }
    return line;
  });
  fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
  return result;
}

export function formatRenameResult(result: RenameResult): string {
  if (result.success) {
    return `✔ Renamed "${result.oldKey}" → "${result.newKey}"`;
  }
  return `✖ Rename failed: ${result.reason}`;
}
