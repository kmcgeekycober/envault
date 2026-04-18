import { Command } from 'commander';
import { addProfile, removeProfile, setActiveProfile, getActiveProfile, listProfiles } from './profile';

export function registerProfileCommands(program: Command): void {
  const profile = program.command('profile').description('Manage env profiles');

  profile
    .command('add <name> <file>')
    .description('Add a new profile')
    .option('-d, --description <desc>', 'Profile description')
    .action((name, file, opts) => {
      const p = addProfile(name, file, opts.description);
      console.log(`Profile '${p.name}' added (${p.file})`);
    });

  profile
    .command('remove <name>')
    .description('Remove a profile')
    .action((name) => {
      removeProfile(name);
      console.log(`Profile '${name}' removed`);
    });

  profile
    .command('use <name>')
    .description('Set the active profile')
    .action((name) => {
      setActiveProfile(name);
      console.log(`Active profile set to '${name}'`);
    });

  profile
    .command('current')
    .description('Show the active profile')
    .action(() => {
      const p = getActiveProfile();
      if (!p) { console.log('No active profile'); return; }
      console.log(`Active: ${p.name} -> ${p.file}${p.description ? ` (${p.description})` : ''}`);
    });

  profile
    .command('list')
    .description('List all profiles')
    .action(() => {
      const profiles = listProfiles();
      if (!profiles.length) { console.log('No profiles defined'); return; }
      profiles.forEach(p => {
        console.log(`  ${p.name}: ${p.file}${p.description ? ` — ${p.description}` : ''}`);
      });
    });
}
