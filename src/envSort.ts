import * as fs from "fs";
import { parseEnvEntries, serializeEnvEntries, EnvEntry } from "./env";

export type SortOrder = "asc" | "desc";
export type SortBy = "key" | "value" | "length";

export interface SortOptions {
  by?: SortBy;
  order?: SortOrder;
  groupComments?: boolean;
}

export interface SortResult {
  original: EnvEntry[];
  sorted: EnvEntry[];
  changed: boolean;
  movedKeys: string[];
}

export function sortEnvEntries(
  entries: EnvEntry[],
  options: SortOptions = {}
): EnvEntry[] {
  const { by = "key", order = "asc", groupComments = true } = options;

  const pairs = entries.filter((e) => e.key !== undefined);
  const comments = entries.filter((e) => e.key === undefined);

  const sorted = [...pairs].sort((a, b) => {
    let cmp = 0;
    if (by === "key") {
      cmp = (a.key ?? "").localeCompare(b.key ?? "");
    } else if (by === "value") {
      cmp = (a.value ?? "").localeCompare(b.value ?? "");
    } else if (by === "length") {
      cmp = (a.key ?? "").length - (b.key ?? "").length;
    }
    return order === "desc" ? -cmp : cmp;
  });

  return groupComments ? [...comments, ...sorted] : sorted;
}

export function sortEnvFile(
  filePath: string,
  options: SortOptions = {}
): SortResult {
  const raw = fs.readFileSync(filePath, "utf8");
  const original = parseEnvEntries(raw);
  const sorted = sortEnvEntries(original, options);

  const originalKeys = original.filter((e) => e.key).map((e) => e.key!);
  const sortedKeys = sorted.filter((e) => e.key).map((e) => e.key!);

  const movedKeys = originalKeys.filter(
    (k, i) => sortedKeys[i] !== k
  );

  const changed = movedKeys.length > 0;

  return { original, sorted, changed, movedKeys };
}

export function formatSortResult(result: SortResult): string {
  if (!result.changed) return "Already sorted. No changes made.";
  const lines = [`Sorted ${result.movedKeys.length} key(s):`];
  for (const key of result.movedKeys) {
    lines.push(`  ~ ${key}`);
  }
  return lines.join("\n");
}
