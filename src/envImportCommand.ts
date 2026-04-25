import { Command } from "commander";
import * as fs from "fs";
import {
  parseImportSource,
  importEnvKeys,
  serializeEnv,
  formatImportResult,
} from "./envImport";
import { parseEnvEntries, serializeEnvEntries } from "./env";

export function registerEnvImportCommands(program: Command): void {
  const imp = program
    .command("import")
    .description("Import keys from another .env file into the current one");

  imp
    .command("run <source>")
    .description("Import env keys from <source> into target env file")
    .option("-t, --target <file>", "Target .env file", ".env")
    .option(
      "-s, --strategy <strategy>",
      "Import strategy: overwrite | skip | merge",
      "skip"
    )
    .option("-d, --dry-run", "Preview changes without writing", false)
    .action((source: string, opts) => {
      if (!fs.existsSync(source)) {
        console.error(`Source file not found: ${source}`);
        process.exit(1);
      }

      const sourceContent = fs.readFileSync(source, "utf-8");
      const incoming = parseImportSource(sourceContent);

      const targetContent = fs.existsSync(opts.target)
        ? fs.readFileSync(opts.target, "utf-8")
        : "";
      const existing = parseImportSource(targetContent);

      const strategy = opts.strategy as "overwrite" | "skip" | "merge";
      const { merged, result } = importEnvKeys(existing, incoming, strategy);

      console.log(formatImportResult(result));

      if (!opts.dryRun) {
        fs.writeFileSync(opts.target, serializeEnv(merged), "utf-8");
        console.log(`Written to ${opts.target}`);
      } else {
        console.log("(dry-run: no changes written)");
      }
    });
}
