import * as fs from "fs";
import { sortEnvFile } from "./envSort";
import { serializeEnvEntries } from "./env";

export interface SortMiddlewareOptions {
  by?: "key" | "value" | "length";
  order?: "asc" | "desc";
  autoWrite?: boolean;
  silent?: boolean;
}

/**
 * Middleware that auto-sorts a .env file before further processing.
 * Returns true if the file was changed (and written), false otherwise.
 */
export function withAutoSort(
  filePath: string,
  options: SortMiddlewareOptions = {}
): boolean {
  if (!fs.existsSync(filePath)) return false;

  const { by = "key", order = "asc", autoWrite = false, silent = false } = options;

  const result = sortEnvFile(filePath, { by, order });

  if (!result.changed) return false;

  if (!silent) {
    console.log(
      `[envault] Auto-sort: ${result.movedKeys.length} key(s) reordered in ${filePath}`
    );
  }

  if (autoWrite) {
    const output = serializeEnvEntries(result.sorted);
    fs.writeFileSync(filePath, output, "utf8");
  }

  return result.changed;
}
