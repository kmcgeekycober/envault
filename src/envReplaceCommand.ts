import { Command } from "commander";
import { replaceEnvInFile, formatReplaceResult } from "./envReplace";

export function registerEnvReplaceCommands(program: Command): void {
  const cmd = program
    .command("replace")
    .description("Replace values for one or more keys in an env file")
    .argument("<file>", ".env file to modify")
    .option(
      "-s, --set <assignments...>",
      "Key=value pairs to replace (e.g. KEY=newval)"
    )
    .option("--json", "Output result as JSON")
    .action((file: string, opts: { set?: string[]; json?: boolean }) => {
      if (!opts.set || opts.set.length === 0) {
        console.error("Error: at least one --set KEY=VALUE assignment is required.");
        process.exit(1);
      }

      const replacements: Record<string, string> = {};
      for (const assignment of opts.set) {
        const idx = assignment.indexOf("=");
        if (idx === -1) {
          console.error(`Error: invalid assignment "${assignment}", expected KEY=VALUE`);
          process.exit(1);
        }
        const key = assignment.slice(0, idx).trim();
        const value = assignment.slice(idx + 1);
        replacements[key] = value;
      }

      try {
        const result = replaceEnvInFile(file, replacements);
        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatReplaceResult(result));
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return;
}
