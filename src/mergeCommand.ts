import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { mergeEnvFilePaths, formatMergeResult, serializeMerged } from "./merge";

/**
 * Registers the `merge` command onto the given Commander program.
 *
 * Usage:
 *   envault merge <base> <override> [output]
 *
 * Merges two .env files, with keys in <override> taking precedence over <base>.
 * If [output] is omitted the merged result is printed to stdout.
 */
export function registerMergeCommands(program: Command): void {
  program
    .command("merge <base> <override> [output]")
    .description(
      "Merge two .env files. Keys in <override> take precedence over <base>."
    )
    .option(
      "-s, --strategy <strategy>",
      "Conflict resolution strategy: override (default) | preserve | error",
      "override"
    )
    .option("--dry-run", "Preview the merged result without writing to disk")
    .option("--show-diff", "Print a summary of added, changed and removed keys")
    .action(
      async (
        baseFile: string,
        overrideFile: string,
        outputFile: string | undefined,
        opts: {
          strategy: "override" | "preserve" | "error";
          dryRun?: boolean;
          showDiff?: boolean;
        }
      ) => {
        const basePath = path.resolve(baseFile);
        const overridePath = path.resolve(overrideFile);

        if (!fs.existsSync(basePath)) {
          console.error(`Error: base file not found: ${basePath}`);
          process.exit(1);
        }

        if (!fs.existsSync(overridePath)) {
          console.error(`Error: override file not found: ${overridePath}`);
          process.exit(1);
        }

        let result;
        try {
          result = mergeEnvFilePaths(basePath, overridePath, opts.strategy);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Merge failed: ${message}`);
          process.exit(1);
        }

        if (opts.showDiff) {
          console.log(formatMergeResult(result));
        }

        const serialized = serializeMerged(result.merged);

        if (opts.dryRun) {
          console.log("--- dry run: merged output ---");
          console.log(serialized);
          return;
        }

        if (outputFile) {
          const outPath = path.resolve(outputFile);
          fs.writeFileSync(outPath, serialized, "utf-8");
          console.log(`Merged env written to ${outPath}`);
        } else {
          process.stdout.write(serialized);
        }
      }
    );
}
