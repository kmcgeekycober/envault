import * as path from "path";
import { promoteEnvFile, formatPromoteResult } from "./envPromote";

export interface PromoteMiddlewareOptions {
  source: string;
  target: string;
  keys: string[];
  overwrite?: boolean;
  silent?: boolean;
}

/**
 * Middleware that auto-promotes specified keys from a source env file
 * to a target env file before a command runs. Useful for CI pipelines
 * where staging values should flow into production automatically.
 */
export function withAutoPromote(
  options: PromoteMiddlewareOptions
): (next: () => Promise<void>) => Promise<void> {
  return async (next) => {
    const { source, target, keys, overwrite = false, silent = false } = options;

    const resolvedSource = path.resolve(source);
    const resolvedTarget = path.resolve(target);

    try {
      const result = promoteEnvFile(
        resolvedSource,
        resolvedTarget,
        keys,
        overwrite
      );
      if (!silent) {
        console.log(
          formatPromoteResult(result, resolvedSource, resolvedTarget)
        );
      }
    } catch (err: any) {
      if (!silent) {
        console.warn(`[envPromote] Warning: ${err.message}`);
      }
    }

    await next();
  };
}
