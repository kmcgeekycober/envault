import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getCompressedPath,
  getCompressedSize,
  formatCompressionResult,
  compressFile,
  decompressFile,
  CompressionResult,
} from "./compress";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-compress-"));
}

describe("getCompressedPath", () => {
  it("appends .gz to the file path", () => {
    expect(getCompressedPath("/tmp/test.env.gpg")).toBe("/tmp/test.env.gpg.gz");
  });
});

describe("getCompressedSize", () => {
  it("returns 0 for non-existent file", () => {
    expect(getCompressedSize("/nonexistent/file.txt")).toBe(0);
  });

  it("returns correct size for existing file", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "test.txt");
    fs.writeFileSync(file, "hello world");
    expect(getCompressedSize(file)).toBe(11);
    fs.rmSync(dir, { recursive: true });
  });
});

describe("formatCompressionResult", () => {
  it("formats result with percentage saved", () => {
    const result: CompressionResult = {
      originalPath: "/tmp/a.env",
      compressedPath: "/tmp/a.env.gz",
      originalSize: 1000,
      compressedSize: 400,
      ratio: 0.4,
    };
    const output = formatCompressionResult(result);
    expect(output).toContain("1000 bytes");
    expect(output).toContain("400 bytes");
    expect(output).toContain("60.0%");
  });

  it("handles zero original size gracefully", () => {
    const result: CompressionResult = {
      originalPath: "/tmp/empty.env",
      compressedPath: "/tmp/empty.env.gz",
      originalSize: 0,
      compressedSize: 0,
      ratio: 1,
    };
    const output = formatCompressionResult(result);
    expect(output).toContain("0.0%");
  });
});

describe("compressFile / decompressFile", () => {
  it("round-trips a file through compress and decompress", async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "test.env.gpg");
    const content = "API_KEY=secret123\nDB_URL=postgres://localhost/db\n";
    fs.writeFileSync(file, content);

    const result = await compressFile(file);
    expect(fs.existsSync(result.compressedPath)).toBe(true);
    expect(result.compressedSize).toBeGreaterThan(0);
    expect(result.originalSize).toBe(Buffer.byteLength(content));

    const restored = path.join(dir, "restored.env.gpg");
    const dest = await decompressFile(result.compressedPath, restored);
    expect(dest).toBe(restored);
    expect(fs.readFileSync(restored, "utf8")).toBe(content);

    fs.rmSync(dir, { recursive: true });
  });
});
