import * as fs from "fs";
import { parseEnvEntries } from "./env";
import { loadSchema, SchemaField } from "./schema";

export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateValue(key: string, value: string, field: SchemaField): ValidationError[] {
  const errors: ValidationError[] = [];

  if (field.type === "number" && isNaN(Number(value))) {
    errors.push({ key, message: `Expected number, got "${value}"` });
  }

  if (field.type === "boolean" && !/^(true|false|1|0)$/i.test(value)) {
    errors.push({ key, message: `Expected boolean, got "${value}"` });
  }

  if (field.type === "url") {
    try {
      new URL(value);
    } catch {
      errors.push({ key, message: `Expected valid URL, got "${value}"` });
    }
  }

  if (field.pattern) {
    const regex = new RegExp(field.pattern);
    if (!regex.test(value)) {
      errors.push({ key, message: `Value does not match pattern ${field.pattern}` });
    }
  }

  if (field.enum && !field.enum.includes(value)) {
    errors.push({ key, message: `Value must be one of: ${field.enum.join(", ")}` });
  }

  return errors;
}

export function validateEnvFile(envPath: string, schemaDir: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  if (!fs.existsSync(envPath)) {
    result.valid = false;
    result.errors.push({ key: "__file__", message: `File not found: ${envPath}` });
    return result;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  const entries = parseEnvEntries(content);
  const entryMap = new Map(entries.map((e) => [e.key, e.value]));

  const schema = loadSchema(schemaDir);

  for (const [fieldKey, field] of Object.entries(schema.fields)) {
    if (field.required && !entryMap.has(fieldKey)) {
      result.errors.push({ key: fieldKey, message: `Required key "${fieldKey}" is missing` });
    } else if (entryMap.has(fieldKey)) {
      const valErrors = validateValue(fieldKey, entryMap.get(fieldKey)!, field);
      result.errors.push(...valErrors);
    } else if (field.default !== undefined) {
      result.warnings.push({ key: fieldKey, message: `Key "${fieldKey}" missing; default is "${field.default}"` });
    }
  }

  result.valid = result.errors.length === 0;
  return result;
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  if (result.valid) {
    lines.push("✔ Validation passed");
  } else {
    lines.push("✘ Validation failed");
  }
  for (const err of result.errors) {
    lines.push(`  [ERROR] ${err.key}: ${err.message}`);
  }
  for (const warn of result.warnings) {
    lines.push(`  [WARN]  ${warn.key}: ${warn.message}`);
  }
  return lines.join("\n");
}
