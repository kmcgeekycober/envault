import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addTag, removeTag, getTag, loadTags, formatTags } from './tag';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-'));
}

describe('tag', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true }); });

  it('starts with empty tag store', () => {
    const store = loadTags(tmp);
    expect(store.tags).toHaveLength(0);
  });

  it('adds a tag', () => {
    const tag = addTag('production', ['.env.production'], tmp);
    expect(tag.name).toBe('production');
    expect(tag.files).toContain('.env.production');
    const store = loadTags(tmp);
    expect(store.tags).toHaveLength(1);
  });

  it('overwrites existing tag with same name', () => {
    addTag('staging', ['.env.staging'], tmp);
    addTag('staging', ['.env.staging', '.env.extra'], tmp);
    const store = loadTags(tmp);
    expect(store.tags).toHaveLength(1);
    expect(store.tags[0].files).toHaveLength(2);
  });

  it('removes a tag', () => {
    addTag('dev', ['.env'], tmp);
    const removed = removeTag('dev', tmp);
    expect(removed).toBe(true);
    expect(loadTags(tmp).tags).toHaveLength(0);
  });

  it('returns false when removing nonexistent tag', () => {
    expect(removeTag('ghost', tmp)).toBe(false);
  });

  it('gets a tag by name', () => {
    addTag('ci', ['.env.ci'], tmp);
    const tag = getTag('ci', tmp);
    expect(tag).toBeDefined();
    expect(tag!.name).toBe('ci');
  });

  it('formats tags', () => {
    addTag('prod', ['.env.prod'], tmp);
    const out = formatTags(loadTags(tmp));
    expect(out).toContain('[prod]');
    expect(out).toContain('.env.prod');
  });

  it('formats empty store', () => {
    expect(formatTags({ tags: [] })).toBe('No tags defined.');
  });
});
