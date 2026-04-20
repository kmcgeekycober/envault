import * as path from "path";
import { loadQuotaConfig, checkEnvQuota } from "./quota";

export interface QuotaMiddlewareOptions {
  envFile?: string;
  warnOnly?: boolean;
}

export function withQuotaCheck(
  fn: (...args: unknown[]) => void | Promise<void>,
  options: QuotaMiddlewareOptions = {}
): (...args: unknown[]) => void | Promise<void> {
  return async (...args: unknown[]) => {
    const dir = process.cwd();
    const envFile = options.envFile ?? ".env";
    const envPath = path.resolve(dir, envFile);
    const config = loadQuotaConfig(dir);
    const result = checkEnvQuota(envPath, config);
    if (!result.passed) {
      const msg = `Quota violations in ${envFile}:\n` + result.violations.map((v) => `  - ${v}`).join("\n");
      if (options.warnOnly) {
        console.warn(msg);
      } else {
        console.error(msg);
        process.exit(1);
      }
    }
    return fn(...args);
  };
}
