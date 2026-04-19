import { Command } from 'commander';
import { addHook, removeHook, loadHooks, formatHooks, HookEvent } from './hook';

const VALID_EVENTS: HookEvent[] = ['pre-encrypt', 'post-encrypt', 'pre-decrypt', 'post-decrypt'];

export function registerHookCommands(program: Command): void {
  const hook = program.command('hook').description('Manage lifecycle hooks');

  hook
    .command('add <event> <command>')
    .description('Add a hook for a lifecycle event')
    .action((event: string, command: string) => {
      if (!VALID_EVENTS.includes(event as HookEvent)) {
        console.error(`Invalid event. Valid events: ${VALID_EVENTS.join(', ')}`);
        process.exit(1);
      }
      addHook(event as HookEvent, command);
      console.log(`Hook added: [${event}] ${command}`);
    });

  hook
    .command('remove <event> <command>')
    .description('Remove a hook')
    .action((event: string, command: string) => {
      removeHook(event as HookEvent, command);
      console.log(`Hook removed: [${event}] ${command}`);
    });

  hook
    .command('list')
    .description('List all configured hooks')
    .action(() => {
      const config = loadHooks();
      console.log(formatHooks(config));
    });
}
