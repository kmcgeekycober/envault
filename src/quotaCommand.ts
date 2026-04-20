import { Command } from "commander";
import * as path from "path";
import { loadQuotaConfig, saveQuotaConfig, checkEnvQuota, formatQuotaResult } from "./quota";

export function registerQuotaCommands(program: Command): void {
  const quota = program.command("quota").description("Manage env file quotas");

  quota
    .command("check [envFile]")
    .description("Check env file against quota limits")
    .action((envFile = ".env") => {
      const dir = process.cwd();
      const config = loadQuotaConfig(dir);
      const result = checkEnvQuota(path.resolve(dir, envFile), config);
      console.log(formatQuotaResult(result));
      if (!result.passed) process.exit(1);
    });

  quota
    .command("set")
    .description("Set quota limits")
    .option("--max-keys <n>", "Maximum number of keys")
    .option("--max-file-size <n>", "Maximum file size in bytes")
    .option("--max-value-length <n>", "Maximum value length")
    .action((opts) => {
      const dir = process.cwd();
      const config = loadQuotaConfig(dir);
      if (opts.maxKeys) config.maxKeys = parseInt(opts.maxKeys, 10);
      if (opts.maxFileSize) config.maxFileSize = parseInt(opts.maxFileSize, 10);
      if (opts.maxValueLength) config.maxValueLength = parseInt(opts.maxValueLength, 10);
      saveQuotaConfig(dir, config);
      console.log("Quota config updated.");
    });

  quota
    .command("show")
    .description("Show current quota configuration")
    .action(() => {
      const dir = process.cwd();
      const config = loadQuotaConfig(dir);
      console.log(JSON.stringify(config, null, 2));
    });
}
