import * as fs from 'fs';
import * as zlib from 'zlib';
import * as path from 'path';

export function getCompressedPath(filePath: string): string {
  return filePath + '.gz';
}

export async function compressFile(filePath: string): Promise<string> {
  const outPath = getCompressedPath(filePath);
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(outPath);
  const gzip = zlib.createGzip();

  await new Promise<void>((resolve, reject) => {
    input.pipe(gzip).pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
    input.on('error', reject);
  });

  return outPath;
}

export async function decompressFile(compressedPath: string, outPath?: string): Promise<string> {
  if (!compressedPath.endsWith('.gz')) {
    throw new Error('Expected a .gz file');
  }
  const destination = outPath ?? compressedPath.slice(0, -3);
  const input = fs.createReadStream(compressedPath);
  const output = fs.createWriteStream(destination);
  const gunzip = zlib.createGunzip();

  await new Promise<void>((resolve, reject) => {
    input.pipe(gunzip).pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
    input.on('error', reject);
  });

  return destination;
}

export function getCompressedSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}

export function formatCompressionResult(originalSize: number, compressedSize: number, filePath: string): string {
  const ratio = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : '0.0';
  return [
    `Compressed: ${path.basename(filePath)}`,
    `  Original : ${originalSize} bytes`,
    `  Compressed: ${compressedSize} bytes`,
    `  Ratio    : ${ratio}% reduction`,
  ].join('\n');
}
