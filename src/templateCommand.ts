import { Command } from 'commander';
import * as fs from 'fs';
import { loadTemplate, validateEnvAgainstTemplate, generateTemplateFromEnv } from './template';
import { parseEnvFile } from './diff';

export function registerTemplateCommands(program: Command): void {
  const tmpl = program.command('template').description('Manage .env templates');

  tmpl
    .command('validate <envFile>')
    .option('-t, --template <path>', 'Template file', '.env.template')
    .description('Validate a .env file against a template')
    .action((envFile: string, opts: { template: string }) => {
      if (!fs.existsSync(opts.template)) {
        console.error(`Template not found: ${opts.template}`);
        process.exit(1);
      }
      const template = loadTemplate(opts.template);
      const content = fs.readFileSync(envFile, 'utf-8');
      const env = parseEnvFile(content);
      const missing = validateEnvAgainstTemplate(env, template);
      if (missing.length === 0) {
        console.log('✓ All required keys are present.');
      } else {
        console.error('✗ Missing required keys:');
        missing.forEach((k) => console.error(`  - ${k}`));
        process.exit(1);
      }
    });

  tmpl
    .command('generate <envFile>')
    .option('-o, --output <path>', 'Output path', '.env.template')
    .description('Generate a template from an existing .env file')
    .action((envFile: string, opts: { output: string }) => {
      const content = fs.readFileSync(envFile, 'utf-8');
      const env = parseEnvFile(content);
      const tmplContent = generateTemplateFromEnv(env);
      fs.writeFileSync(opts.output, tmplContent, 'utf-8');
      console.log(`Template written to ${opts.output}`);
    });
}
