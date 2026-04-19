import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addPin, removePin, listPins, formatPins, loadPins } from './pin';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pin-'));
}

describe('pin', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  test('loadPins returns empty store when no file', () => {
    const store = loadPins(dir);
    expect(store.pins).toEqual([]);
  });

  test('addPin adds a new pin', () => {
    const entry = addPin('.env', 'main', dir);
    expect(entry.file).toBe('.env');
    expect(entry.label).toBe('main');
    const pins = listPins(dir);
    expect(pins).toHaveLength(1);
  });

  test('addPin updates existing pin', () => {
    addPin('.env', 'old', dir);
    addPin('.env', 'new', dir);
    const pins = listPins(dir);
    expect(pins).toHaveLength(1);
    expect(pins[0].label).toBe('new');
  });

  test('removePin removes existing pin', () => {
    addPin('.env', undefined, dir);
    const result = removePin('.env', dir);
    expect(result).toBe(true);
    expect(listPins(dir)).toHaveLength(0);
  });

  test('removePin returns false for missing pin', () => {
    const result = removePin('.env.missing', dir);
    expect(result).toBe(false);
  });

  test('formatPins returns message when empty', () => {
    expect(formatPins([])).toBe('No pinned files.');
  });

  test('formatPins lists pins', () => {
    addPin('.env', 'prod', dir);
    const pins = listPins(dir);
    const output = formatPins(pins);
    expect(output).toContain('.env');
    expect(output).toContain('prod');
  });
});
