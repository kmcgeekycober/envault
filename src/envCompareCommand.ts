import { Command } from "commander";
import { compareEnvFiles, formatCompareResult } from "./envCompare";

export function registerEnvCompareCommands(program: Command): void {
  program
    .command("compare <left> <right>")
    .description("Compare two .env files side by side")
    .option("-l, --left-label <label>", "Label for the left file", "left")
    .option("-r, --right-label <label>", "Label for the right file", "right")
    .option("--only-diff", "Show only mismatched or missing keys", false)
    .action(
      (
        left: string,
        right: string,
        opts: { leftLabel: string; rightLabel: string; onlyDiff: boolean }
      ) => {
        const result = compareEnvFiles(left, right);

        if (opts.onlyDiff) {
          result.entries = result.entries.filter(
            (e) => e.status !== "match"
          ) as typeof result.entries;
        }

        const output = formatCompareResult(
          result,
          opts.leftLabel,
          opts.rightLabel
        );
        console.log(output);

        if (result.mismatchCount > 0 || result.leftOnlyCount > 0 || result.rightOnlyCount > 0) {
          process.exitCode = 1;
        }
      }
    );
}
