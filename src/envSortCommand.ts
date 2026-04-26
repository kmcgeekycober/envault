import { Command } from "commander";
import * as fs from "fs";
import { sortEnvFile, formatSortResult, SortBy, SortOrder } from "./envSort";
import { serializeEnvEntries } from "./env";

export function registerEnvSortCommands(program: Command): void {
  program
    .command("sort")
    .description("Sort keys in a .env file alphabetically or by other criteria")
    .argument("<file>", ".env file to sort")
    .option("-b, --by <field>", "sort by: key, value, length", "key")
    .option("-o, --order <order>", "sort order: asc, desc", "asc")
    .option("--no-group-comments", "do not group comments at top")
    .option("-w, --write", "write sorted output back to file")
    .option("-d, --dry-run", "show what would change without writing")
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const result = sortEnvFile(file, {
        by: opts.by as SortBy,
        order: opts.order as SortOrder,
        groupComments: opts.groupComments !== false,
      });

      console.log(formatSortResult(result));

      if (result.changed && opts.write && !opts.dryRun) {
        const output = serializeEnvEntries(result.sorted);
        fs.writeFileSync(file, output, "utf8");
        console.log(`Written to ${file}`);
      } else if (result.changed && opts.dryRun) {
        console.log("\nDry run — no changes written.");
      }
    });
}
