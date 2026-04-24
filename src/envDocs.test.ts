import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getEnvDocsPath,
  loadEnvDocs,
  saveEnvDocs,
  addEnvDoc,
  removeEnvDoc,
  getEnvDoc,
  formatEnvDocs,
  generateDocsFromEnv,
} from './envDocs';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envdocs-test-'));
}

describe('envDocs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty docs when file does not exist', () => {
    expect(loadEnvDocs(tmpDir)).toEqual({});
  });

  it('saves and loads docs', () => {
    const docs = { API_KEY: { key: 'API_KEY', description: 'API key', required: true } };
    saveEnvDocs(docs, tmpDir);
    expect(loadEnvDocs(tmpDir)).toEqual(docs);
  });

  it('adds a doc entry', () => {
    const result = addEnvDoc('DB_URL', { description: 'Database URL', example: 'postgres://localhost/db' }, tmpDir);
    expect(result['DB_URL']).toMatchObject({ key: 'DB_URL', description: 'Database URL' });
  });

  it('removes a doc entry', () => {
    addEnvDoc('DB_URL', { description: 'Database URL' }, tmpDir);
    const result = removeEnvDoc('DB_URL', tmpDir);
    expect(result['DB_URL']).toBeUndefined();
  });

  it('gets a specific doc entry', () => {
    addEnvDoc('SECRET', { description: 'A secret', required: true }, tmpDir);
    const entry = getEnvDoc('SECRET', tmpDir);
    expect(entry?.description).toBe('A secret');
    expect(entry?.required).toBe(true);
  });

  it('formats docs as string', () => {
    addEnvDoc('API_KEY', { description: 'API key', example: 'abc123', required: true }, tmpDir);
    const output = formatEnvDocs(loadEnvDocs(tmpDir));
    expect(output).toContain('API_KEY (required)');
    expect(output).toContain('Example: abc123');
  });

  it('returns message when no docs', () => {
    expect(formatEnvDocs({})).toContain('No documentation');
  });

  it('generates docs from env content', () => {
    const content = 'API_KEY=abc\nDB_URL=postgres://localhost\n';
    const docs = generateDocsFromEnv(content, tmpDir);
    expect(docs['API_KEY']).toBeDefined();
    expect(docs['DB_URL']).toBeDefined();
  });

  it('does not overwrite existing entries when generating', () => {
    addEnvDoc('API_KEY', { description: 'Existing desc' }, tmpDir);
    const docs = generateDocsFromEnv('API_KEY=val\n', tmpDir);
    expect(docs['API_KEY'].description).toBe('Existing desc');
  });

  it('getEnvDocsPath returns correct path', () => {
    expect(getEnvDocsPath('/some/dir')).toBe('/some/dir/.envdocs.json');
  });
});
