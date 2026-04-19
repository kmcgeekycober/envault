import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addSecret, removeSecret, loadManifest, checkMissingSecrets, formatManifest } from './secret';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-secret-'));
}

describe('secret manifest', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => fs.rmSync(dir, { recursive: true }));

  it('loads empty manifest when file missing', () => {
    const m = loadManifest(dir);
    expect(m.secrets).toHaveLength(0);
  });

  it('adds a secret', () => {
    addSecret('DB_URL', { description: 'Database URL', required: true }, dir);
    const m = loadManifest(dir);
    expect(m.secrets).toHaveLength(1);
    expect(m.secrets[0].key).toBe('DB_URL');
    expect(m.secrets[0].required).toBe(true);
  });

  it('updates existing secret', () => {
    addSecret('DB_URL', { required: true }, dir);
    addSecret('DB_URL', { description: 'Updated', required: false }, dir);
    const m = loadManifest(dir);
    expect(m.secrets).toHaveLength(1);
    expect(m.secrets[0].required).toBe(false);
  });

  it('removes a secret', () => {
    addSecret('API_KEY', { required: true }, dir);
    removeSecret('API_KEY', dir);
    const m = loadManifest(dir);
    expect(m.secrets).toHaveLength(0);
  });

  it('checks missing required secrets', () => {
    addSecret('DB_URL', { required: true }, dir);
    addSecret('API_KEY', { required: true }, dir);
    addSecret('DEBUG', { required: false }, dir);
    const missing = checkMissingSecrets(['DB_URL'], dir);
    expect(missing).toContain('API_KEY');
    expect(missing).not.toContain('DB_URL');
    expect(missing).not.toContain('DEBUG');
  });

  it('formats manifest', () => {
    addSecret('DB_URL', { description: 'Database', required: true }, dir);
    const out = formatManifest(loadManifest(dir));
    expect(out).toContain('[required]');
    expect(out).toContain('DB_URL');
    expect(out).toContain('Database');
  });

  it('returns message for empty manifest', () => {
    expect(formatManifest(loadManifest(dir))).toBe('No secrets registered.');
  });
});
