import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getCompressedPath,
  compressFile,
  decompressFile,
  getCompressedSize,
  formatCompressionResult,
} from './compress';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compress-'));
}

describe('getCompressedPath', () => {
  it('appends .gz to the file path', () => {
    expect(getCompressedPath('/tmp/test.env')).toBe('/tmp/test.env.gz');
  });
});

describe('compressFile / decompressFile', () => {
  it('compresses a file and decompresses it back to original content', async () => {
    const dir = makeTmpDir();
    const original = path.join(dir, 'test.env');
    const content = 'API_KEY=secret\nDB_URL=postgres://localhost/db\n';
    fs.writeFileSync(original, content, 'utf8');

    const compressed = await compressFile(original);
    expect(fs.existsSync(compressed)).toBe(true);
    expect(compressed).toBe(original + '.gz');

    const restored = path.join(dir, 'restored.env');
    await decompressFile(compressed, restored);
    expect(fs.readFileSync(restored, 'utf8')).toBe(content);
  });

  it('throws when decompressing a non-.gz file', async () => {
    await expect(decompressFile('/tmp/notgz.env')).rejects.toThrow('Expected a .gz file');
  });
});

describe('getCompressedSize', () => {
  it('returns 0 for a non-existent file', () => {
    expect(getCompressedSize('/nonexistent/file.gz')).toBe(0);
  });

  it('returns the file size for an existing file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, 'sample.gz');
    fs.writeFileSync(file, Buffer.from([0x1f, 0x8b]));
    expect(getCompressedSize(file)).toBe(2);
  });
});

describe('formatCompressionResult', () => {
  it('formats the compression result correctly', () => {
    const result = formatCompressionResult(1000, 400, '/tmp/test.env.gz');
    expect(result).toContain('test.env.gz');
    expect(result).toContain('1000 bytes');
    expect(result).toContain('400 bytes');
    expect(result).toContain('60.0% reduction');
  });

  it('handles zero original size without division error', () => {
    const result = formatCompressionResult(0, 0, '/tmp/empty.env.gz');
    expect(result).toContain('0.0% reduction');
  });
});
