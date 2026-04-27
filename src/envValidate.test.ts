import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { validateValue, validateEnvFile, formatValidationResult } from "./envValidate";
import { SchemaField } from "./schema";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-validate-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("validateValue", () => {
  it("accepts valid number", () => {
    const field: SchemaField = { type: "number", required: true };
    expect(validateValue("PORT", "3000", field)).toHaveLength(0);
  });

  it("rejects invalid number", () => {
    const field: SchemaField = { type: "number", required: true };
    const errors = validateValue("PORT", "abc", field);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/number/);
  });

  it("accepts valid boolean", () => {
    const field: SchemaField = { type: "boolean", required: false };
    expect(validateValue("DEBUG", "true", field)).toHaveLength(0);
    expect(validateValue("DEBUG", "0", field)).toHaveLength(0);
  });

  it("rejects invalid boolean", () => {
    const field: SchemaField = { type: "boolean", required: false };
    const errors = validateValue("DEBUG", "yes", field);
    expect(errors[0].message).toMatch(/boolean/);
  });

  it("rejects invalid URL", () => {
    const field: SchemaField = { type: "url", required: true };
    const errors = validateValue("API_URL", "not-a-url", field);
    expect(errors[0].message).toMatch(/URL/);
  });

  it("validates enum constraint", () => {
    const field: SchemaField = { type: "string", required: true, enum: ["dev", "prod"] };
    expect(validateValue("ENV", "dev", field)).toHaveLength(0);
    expect(validateValue("ENV", "staging", field)[0].message).toMatch(/one of/);
  });

  it("validates pattern constraint", () => {
    const field: SchemaField = { type: "string", required: true, pattern: "^v\\d+$" };
    expect(validateValue("VERSION", "v3", field)).toHaveLength(0);
    expect(validateValue("VERSION", "3", field)[0].message).toMatch(/pattern/);
  });
});

describe("validateEnvFile", () => {
  it("returns error when file does not exist", () => {
    const dir = makeTmpDir();
    const result = validateEnvFile(path.join(dir, "missing.env"), dir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe("__file__");
  });

  it("passes when all required keys present and valid", () => {
    const dir = makeTmpDir();
    writeFile(dir, "schema.json", JSON.stringify({
      fields: { PORT: { type: "number", required: true } }
    }));
    const envPath = writeFile(dir, ".env", "PORT=8080\n");
    const result = validateEnvFile(envPath, dir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports missing required key", () => {
    const dir = makeTmpDir();
    writeFile(dir, "schema.json", JSON.stringify({
      fields: { SECRET: { type: "string", required: true } }
    }));
    const envPath = writeFile(dir, ".env", "PORT=3000\n");
    const result = validateEnvFile(envPath, dir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "SECRET")).toBe(true);
  });
});

describe("formatValidationResult", () => {
  it("shows passed message when valid", () => {
    const out = formatValidationResult({ valid: true, errors: [], warnings: [] });
    expect(out).toMatch(/passed/);
  });

  it("shows failed message with errors", () => {
    const out = formatValidationResult({
      valid: false,
      errors: [{ key: "FOO", message: "is missing" }],
      warnings: []
    });
    expect(out).toMatch(/failed/);
    expect(out).toMatch(/FOO/);
    expect(out).toMatch(/ERROR/);
  });
});
