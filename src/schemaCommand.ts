import { Command } from 'commander';
import * as path from 'path';
import {
  loadSchema,
  saveSchema,
  addSchemaField,
  removeSchemaField,
  validateEnvAgainstSchema,
  formatSchemaViolations,
  SchemaField,
  EnvSchema,
} from './schema';
import * as fs from 'fs';

export function registerSchemaCommands(program: Command): void {
  const schema = program.command('schema').description('Manage .env schema validation');

  schema
    .command('add <key>')
    .description('Add or update a field in the schema')
    .option('--type <type>', 'Field type: string|number|boolean|url|email', 'string')
    .option('--required', 'Mark field as required', false)
    .option('--pattern <pattern>', 'Regex pattern the value must match')
    .option('--description <desc>', 'Human-readable description')
    .action((key: string, opts) => {
      const dir = process.cwd();
      const existing = loadSchema(dir) ?? { version: 1, fields: [] };
      const field: SchemaField = {
        key,
        type: opts.type,
        required: !!opts.required,
        pattern: opts.pattern,
        description: opts.description,
      };
      const updated = addSchemaField(existing, field);
      saveSchema(dir, updated);
      console.log(`Schema field "${key}" saved.`);
    });

  schema
    .command('remove <key>')
    .description('Remove a field from the schema')
    .action((key: string) => {
      const dir = process.cwd();
      const existing = loadSchema(dir);
      if (!existing) { console.error('No schema found.'); process.exit(1); }
      saveSchema(dir, removeSchemaField(existing, key));
      console.log(`Schema field "${key}" removed.`);
    });

  schema
    .command('list')
    .description('List all schema fields')
    .action(() => {
      const dir = process.cwd();
      const s = loadSchema(dir);
      if (!s || s.fields.length === 0) { console.log('No schema defined.'); return; }
      s.fields.forEach(f => {
        const req = f.required ? '(required)' : '(optional)';
        console.log(`  ${f.key} [${f.type}] ${req}${f.description ? ' — ' + f.description : ''}`);
      });
    });

  schema
    .command('validate [envFile]')
    .description('Validate a .env file against the schema')
    .action((envFile: string = '.env') => {
      const dir = process.cwd();
      const s = loadSchema(dir);
      if (!s) { console.error('No schema found. Run `envault schema add` first.'); process.exit(1); }
      const filePath = path.resolve(dir, envFile);
      if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const env: Record<string, string> = {};
      for (const line of raw.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim();
      }
      const violations = validateEnvAgainstSchema(env, s);
      console.log(formatSchemaViolations(violations));
      if (violations.length > 0) process.exit(1);
    });
}
