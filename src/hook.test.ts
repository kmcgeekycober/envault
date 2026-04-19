import fs from 'fs';
import os from 'os';
import path from 'path';
import { addHook, removeHook, loadHooks, getHooksForEvent, formatHooks } from './hook';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-hook-'));
}

describe('hook', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it('loads empty hooks when file missing', () => {
    const config = loadHooks(dir);
    expect(config.hooks).toEqual([]);
  });

  it('adds a hook', () => {
    const config = addHook('pre-encrypt', 'echo hello', dir);
    expect(config.hooks).toHaveLength(1);
    expect(config.hooks[0]).toEqual({ event: 'pre-encrypt', command: 'echo hello' });
  });

  it('removes a hook', () => {
    addHook('post-decrypt', 'echo done', dir);
    const config = removeHook('post-decrypt', 'echo done', dir);
    expect(config.hooks).toHaveLength(0);
  });

  it('gets hooks for specific event', () => {
    addHook('pre-encrypt', 'echo a', dir);
    addHook('post-encrypt', 'echo b', dir);
    const hooks = getHooksForEvent('pre-encrypt', dir);
    expect(hooks).toHaveLength(1);
    expect(hooks[0].command).toBe('echo a');
  });

  it('formats hooks', () => {
    addHook('pre-encrypt', 'echo a', dir);
    const config = loadHooks(dir);
    expect(formatHooks(config)).toContain('[pre-encrypt] echo a');
  });

  it('formats empty hooks', () => {
    expect(formatHooks({ hooks: [] })).toBe('No hooks configured.');
  });
});
