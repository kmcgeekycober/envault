import { Command } from "commander";
import { addScope, removeScope, getScope, listScopes } from "./scope";

export function registerScopeCommands(program: Command): void {
  const scope = program
    .command("scope")
    .description("Manage env key scopes for selective encryption/export");

  scope
    .command("add <name> <keys...>")
    .description("Add keys to a named scope")
    .action((name: string, keys: string[]) => {
      try {
        addScope(name, keys);
        console.log(`Scope "${name}" updated with keys: ${keys.join(", ")}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  scope
    .command("remove <name>")
    .description("Remove a scope")
    .action((name: string) => {
      try {
        removeScope(name);
        console.log(`Scope "${name}" removed.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  scope
    .command("list")
    .description("List all scopes")
    .action(() => {
      const scopes = listScopes();
      if (scopes.length === 0) {
        console.log("No scopes defined.");
      } else {
        console.log("Scopes:");
        scopes.forEach((s) => console.log(`  - ${s}`));
      }
    });

  scope
    .command("show <name>")
    .description("Show keys in a scope")
    .action((name: string) => {
      try {
        const keys = getScope(name);
        console.log(`Scope "${name}" keys:`);
        keys.forEach((k) => console.log(`  - ${k}`));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
