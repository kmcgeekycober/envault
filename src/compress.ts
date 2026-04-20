import * as fs from "fs";
import * as zlib from "zlib";
import * as path from "path";

export function getCompressedPath(filePath: string): string {
  return filePath + ".gz";
}

export function getCompressedSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

export interface CompressionResult {
  originalPath: string;
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export function formatCompressionResult(result: CompressionResult): string {
  const saved = result.originalSize - result.compressedSize;
  const pct = result.originalSize > 0
    ? ((saved / result.originalSize) * 100).toFixed(1)
    : "0.0";
  return [
    `Original:   ${result.originalPath} (${result.originalSize} bytes)`,
    `Compressed: ${result.compressedPath} (${result.compressedSize} bytes)`,
    `Saved: ${saved} bytes (${pct}%)`,
  ].join("\n");
}

export async function compressFile(filePath: string): Promise<CompressionResult> {
  const originalSize = getCompressedSize(filePath);
  const compressedPath = getCompressedPath(filePath);
  const input = fs.readFileSync(filePath);
  const compressed = zlib.gzipSync(input);
  fs.writeFileSync(compressedPath, compressed);
  const compressedSize = getCompressedSize(compressedPath);
  const ratio = originalSize > 0 ? compressedSize / originalSize : 1;
  return { originalPath: filePath, compressedPath, originalSize, compressedSize, ratio };
}

export async function decompressFile(compressedPath: string, outputPath?: string): Promise<string> {
  const destPath = outputPath ?? compressedPath.replace(/\.gz$/, "");
  const input = fs.readFileSync(compressedPath);
  const decompressed = zlib.gunzipSync(input);
  fs.writeFileSync(destPath, decompressed);
  return destPath;
}
