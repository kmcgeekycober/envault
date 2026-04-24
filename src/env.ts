import * as fs from "fs";
import * as path from "path";

export interface EnvEntry {
  key: string;
  value: string;
  comment?: string;
}

export interface EnvFile {
  entries: EnvEntry[];
  path: string;
}

export function parseEnvEntries(content: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  let pendingComment: string | undefined;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes("=")) {
      pendingComment = undefined;
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.push({ key, value, comment: pendingComment });
    pendingComment = undefined;
  }
  return entries;
}

export function serializeEnvEntries(entries: EnvEntry[]): string {
  return entries
    .map((e) => {
      const commentLine = e.comment ? `# ${e.comment}\n` : "";
      const needsQuotes = e.value.includes(" ") || e.value.includes("#");
      const val = needsQuotes ? `"${e.value}"` : e.value;
      return `${commentLine}${e.key}=${val}`;
    })
    .join("\n");
}

export function readEnvFile(filePath: string): EnvFile {
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
    : "";
  return { entries: parseEnvEntries(content), path: filePath };
}

export function writeEnvFile(envFile: EnvFile): void {
  fs.mkdirSync(path.dirname(envFile.path), { recursive: true });
  fs.writeFileSync(envFile.path, serializeEnvEntries(envFile.entries), "utf-8");
}

export function getEnvValue(envFile: EnvFile, key: string): string | undefined {
  return envFile.entries.find((e) => e.key === key)?.value;
}

export function setEnvValue(
  envFile: EnvFile,
  key: string,
  value: string,
  comment?: string
): EnvFile {
  const existing = envFile.entries.findIndex((e) => e.key === key);
  const entry: EnvEntry = { key, value, comment };
  if (existing >= 0) {
    const updated = [...envFile.entries];
    updated[existing] = { ...updated[existing], value, ...(comment !== undefined ? { comment } : {}) };
    return { ...envFile, entries: updated };
  }
  return { ...envFile, entries: [...envFile.entries, entry] };
}

export function deleteEnvKey(envFile: EnvFile, key: string): EnvFile {
  return { ...envFile, entries: envFile.entries.filter((e) => e.key !== key) };
}
