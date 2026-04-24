import { Command } from "commander";
import * as fs from "fs";
import {
  loadEnvDocs,
  saveEnvDocs,
  addEnvDoc,
  removeEnvDoc,
  getEnvDocsPath,
} from "./envDocs";

/**
 * Registers the `docs` subcommands onto the given Commander program.
 *
 * Commands:
 *   docs add <key> <description>  — attach documentation to an env key
 *   docs remove <key>             — remove documentation for an env key
 *   docs list                     — list all documented keys
 *   docs show <key>               — show full documentation for a key
 */
export function registerEnvDocsCommands(program: Command): void {
  const docs = program
    .command("docs")
    .description("Manage inline documentation for env keys");

  // ── docs add ────────────────────────────────────────────────────────────────
  docs
    .command("add <key> <description>")
    .description("Add or update documentation for an env key")
    .option("-f, --file <path>", "Path to the vault config", ".envault.json")
    .option("--example <value>", "An example value for the key")
    .option("--required", "Mark the key as required", false)
    .action(
      async (
        key: string,
        description: string,
        opts: { file: string; example?: string; required: boolean }
      ) => {
        try {
          const docsPath = getEnvDocsPath(opts.file);
          const current = fs.existsSync(docsPath) ? loadEnvDocs(docsPath) : {};
          const updated = addEnvDoc(current, key, {
            description,
            example: opts.example,
            required: opts.required,
          });
          saveEnvDocs(docsPath, updated);
          console.log(`✔ Documentation added for key: ${key}`);
        } catch (err: any) {
          console.error(`Error: ${err.message}`);
          process.exit(1);
        }
      }
    );

  // ── docs remove ─────────────────────────────────────────────────────────────
  docs
    .command("remove <key>")
    .description("Remove documentation for an env key")
    .option("-f, --file <path>", "Path to the vault config", ".envault.json")
    .action(async (key: string, opts: { file: string }) => {
      try {
        const docsPath = getEnvDocsPath(opts.file);
        if (!fs.existsSync(docsPath)) {
          console.error("No docs file found.");
          process.exit(1);
        }
        const current = loadEnvDocs(docsPath);
        if (!current[key]) {
          console.error(`No documentation found for key: ${key}`);
          process.exit(1);
        }
        const updated = removeEnvDoc(current, key);
        saveEnvDocs(docsPath, updated);
        console.log(`✔ Documentation removed for key: ${key}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  // ── docs list ───────────────────────────────────────────────────────────────
  docs
    .command("list")
    .description("List all documented env keys")
    .option("-f, --file <path>", "Path to the vault config", ".envault.json")
    .option("--required-only", "Show only keys marked as required", false)
    .action(async (opts: { file: string; requiredOnly: boolean }) => {
      try {
        const docsPath = getEnvDocsPath(opts.file);
        if (!fs.existsSync(docsPath)) {
          console.log("No documentation found.");
          return;
        }
        const current = loadEnvDocs(docsPath);
        const entries = Object.entries(current).filter(
          ([, doc]) => !opts.requiredOnly || doc.required
        );
        if (entries.length === 0) {
          console.log("No documented keys found.");
          return;
        }
        console.log(`\nDocumented env keys (${entries.length}):`);
        for (const [k, doc] of entries) {
          const req = doc.required ? " [required]" : "";
          console.log(`  ${k}${req}`);
          console.log(`    ${doc.description}`);
          if (doc.example !== undefined) {
            console.log(`    example: ${doc.example}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  // ── docs show ───────────────────────────────────────────────────────────────
  docs
    .command("show <key>")
    .description("Show full documentation for a specific env key")
    .option("-f, --file <path>", "Path to the vault config", ".envault.json")
    .action(async (key: string, opts: { file: string }) => {
      try {
        const docsPath = getEnvDocsPath(opts.file);
        if (!fs.existsSync(docsPath)) {
          console.error("No docs file found.");
          process.exit(1);
        }
        const current = loadEnvDocs(docsPath);
        const doc = current[key];
        if (!doc) {
          console.error(`No documentation found for key: ${key}`);
          process.exit(1);
        }
        console.log(`\nKey:         ${key}`);
        console.log(`Description: ${doc.description}`);
        console.log(`Required:    ${doc.required ? "yes" : "no"}`);
        if (doc.example !== undefined) {
          console.log(`Example:     ${doc.example}`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
