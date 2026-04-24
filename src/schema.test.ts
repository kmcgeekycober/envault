import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadSchema,
  saveSchema,
  addSchemaField,
  removeSchemaField,
  validateEnvAgainstSchema,
  formatSchemaViolations,
  EnvSchema,
} from './schema';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schema-'));
}

describe('schema', () => {
  it('returns null when no schema file exists', () => {
    const dir = makeTmpDir();
    expect(loadSchema(dir)).toBeNull();
  });

  it('saves and loads a schema', () => {
    const dir = makeTmpDir();
    const schema: EnvSchema = { version: 1, fields: [{ key: 'PORT', type: 'number', required: true }] };
    saveSchema(dir, schema);
    const loaded = loadSchema(dir);
    expect(loaded).not.toBeNull();
    expect(loaded!.fields[0].key).toBe('PORT');
  });

  it('adds a new field', () => {
    const schema: EnvSchema = { version: 1, fields: [] };
    const updated = addSchemaField(schema, { key: 'API_KEY', type: 'string', required: true });
    expect(updated.fields).toHaveLength(1);
    expect(updated.fields[0].key).toBe('API_KEY');
  });

  it('updates an existing field', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'PORT', type: 'string', required: false }] };
    addSchemaField(schema, { key: 'PORT', type: 'number', required: true });
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].type).toBe('number');
  });

  it('removes a field', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'PORT', type: 'number', required: true }] };
    const updated = removeSchemaField(schema, 'PORT');
    expect(updated.fields).toHaveLength(0);
  });

  it('reports missing required field', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'DB_URL', type: 'url', required: true }] };
    const violations = validateEnvAgainstSchema({}, schema);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/required/);
  });

  it('passes when optional field is absent', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'DEBUG', type: 'boolean', required: false }] };
    expect(validateEnvAgainstSchema({}, schema)).toHaveLength(0);
  });

  it('validates number type', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'PORT', type: 'number', required: true }] };
    expect(validateEnvAgainstSchema({ PORT: 'abc' }, schema)).toHaveLength(1);
    expect(validateEnvAgainstSchema({ PORT: '3000' }, schema)).toHaveLength(0);
  });

  it('validates url type', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'API', type: 'url', required: true }] };
    expect(validateEnvAgainstSchema({ API: 'not-a-url' }, schema)).toHaveLength(1);
    expect(validateEnvAgainstSchema({ API: 'https://example.com' }, schema)).toHaveLength(0);
  });

  it('validates pattern', () => {
    const schema: EnvSchema = { version: 1, fields: [{ key: 'CODE', type: 'string', required: true, pattern: '^[A-Z]{3}$' }] };
    expect(validateEnvAgainstSchema({ CODE: 'abc' }, schema)).toHaveLength(1);
    expect(validateEnvAgainstSchema({ CODE: 'ABC' }, schema)).toHaveLength(0);
  });

  it('formats violations', () => {
    const result = formatSchemaViolations([{ key: 'PORT', message: 'expected number' }]);
    expect(result).toContain('[PORT]');
  });

  it('returns pass message when no violations', () => {
    expect(formatSchemaViolations([])).toMatch(/passed/);
  });
});
