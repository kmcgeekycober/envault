import * as fs from 'fs';
import * as path from 'path';

export interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email';
  required: boolean;
  pattern?: string;
  description?: string;
}

export interface EnvSchema {
  version: number;
  fields: SchemaField[];
}

export function getSchemaPath(dir: string): string {
  return path.join(dir, '.envault-schema.json');
}

export function loadSchema(dir: string): EnvSchema | null {
  const schemaPath = getSchemaPath(dir);
  if (!fs.existsSync(schemaPath)) return null;
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) as EnvSchema;
}

export function saveSchema(dir: string, schema: EnvSchema): void {
  const schemaPath = getSchemaPath(dir);
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');
}

export function addSchemaField(schema: EnvSchema, field: SchemaField): EnvSchema {
  const existing = schema.fields.findIndex(f => f.key === field.key);
  if (existing >= 0) {
    schema.fields[existing] = field;
  } else {
    schema.fields.push(field);
  }
  return schema;
}

export function removeSchemaField(schema: EnvSchema, key: string): EnvSchema {
  schema.fields = schema.fields.filter(f => f.key !== key);
  return schema;
}

export interface SchemaViolation {
  key: string;
  message: string;
}

export function validateEnvAgainstSchema(
  env: Record<string, string>,
  schema: EnvSchema
): SchemaViolation[] {
  const violations: SchemaViolation[] = [];
  for (const field of schema.fields) {
    const value = env[field.key];
    if (value === undefined || value === '') {
      if (field.required) {
        violations.push({ key: field.key, message: `required field is missing` });
      }
      continue;
    }
    if (field.type === 'number' && isNaN(Number(value))) {
      violations.push({ key: field.key, message: `expected number, got "${value}"` });
    } else if (field.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      violations.push({ key: field.key, message: `expected boolean, got "${value}"` });
    } else if (field.type === 'url') {
      try { new URL(value); } catch {
        violations.push({ key: field.key, message: `expected valid URL, got "${value}"` });
      }
    } else if (field.type === 'email' && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
      violations.push({ key: field.key, message: `expected valid email, got "${value}"` });
    }
    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      violations.push({ key: field.key, message: `value does not match pattern /${field.pattern}/` });
    }
  }
  return violations;
}

export function formatSchemaViolations(violations: SchemaViolation[]): string {
  if (violations.length === 0) return 'Schema validation passed.';
  return violations.map(v => `  [${v.key}] ${v.message}`).join('\n');
}
