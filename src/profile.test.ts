import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addProfile, removeProfile, setActiveProfile,
  getActiveProfile, listProfiles, loadProfiles
} from './profile';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-profile-'));
}

describe('profile', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true }); });

  it('starts with empty profiles', () => {
    expect(listProfiles(tmp)).toEqual([]);
  });

  it('adds a profile', () => {
    const p = addProfile('dev', '.env.dev', 'Development', tmp);
    expect(p.name).toBe('dev');
    expect(listProfiles(tmp)).toHaveLength(1);
  });

  it('throws on duplicate profile', () => {
    addProfile('dev', '.env.dev', undefined, tmp);
    expect(() => addProfile('dev', '.env.dev', undefined, tmp)).toThrow();
  });

  it('removes a profile', () => {
    addProfile('dev', '.env.dev', undefined, tmp);
    removeProfile('dev', tmp);
    expect(listProfiles(tmp)).toHaveLength(0);
  });

  it('throws removing nonexistent profile', () => {
    expect(() => removeProfile('ghost', tmp)).toThrow();
  });

  it('sets and gets active profile', () => {
    addProfile('prod', '.env.prod', undefined, tmp);
    setActiveProfile('prod', tmp);
    expect(getActiveProfile(tmp)?.name).toBe('prod');
  });

  it('clears active on removal', () => {
    addProfile('staging', '.env.staging', undefined, tmp);
    setActiveProfile('staging', tmp);
    removeProfile('staging', tmp);
    const cfg = loadProfiles(tmp);
    expect(cfg.active).toBeUndefined();
  });
});
