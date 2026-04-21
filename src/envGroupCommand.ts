import { Command } from "commander";
import { addGroup, removeGroup, listGroups, getGroup, formatGroups } from "./envGroup";

export function registerEnvGroupCommands(program: Command): void {
  const group = program.command("group").description("Manage env key groups");

  group
    .command("add <name> <keys...>")
    .description("Add or update a group with the given keys")
    .option("-d, --description <desc>", "Optional description for the group")
    .action((name: string, keys: string[], opts: { description?: string }) => {
      const result = addGroup(name, keys, opts.description);
      console.log(`Group '${result.name}' saved with keys: ${result.keys.join(", ")}`);
    });

  group
    .command("remove <name>")
    .description("Remove a group by name")
    .action((name: string) => {
      const removed = removeGroup(name);
      if (removed) {
        console.log(`Group '${name}' removed.`);
      } else {
        console.error(`Group '${name}' not found.`);
        process.exit(1);
      }
    });

  group
    .command("list")
    .description("List all groups")
    .action(() => {
      const groups = listGroups();
      console.log(formatGroups(groups));
    });

  group
    .command("show <name>")
    .description("Show details of a specific group")
    .action((name: string) => {
      const found = getGroup(name);
      if (!found) {
        console.error(`Group '${name}' not found.`);
        process.exit(1);
      }
      console.log(formatGroups([found]));
    });
}
