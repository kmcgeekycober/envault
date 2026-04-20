import { Command } from "commander";
import { compressFile, decompressFile, formatCompressionResult } from "./compress";

export function registerCompressCommands(program: Command): void {
  const compress = program
    .command("compress")
    .description("Compress or decompress encrypted env files");

  compress
    .command("pack <file>")
    .description("Compress an encrypted env file with gzip")
    .action(async (file: string) => {
      try {
        const result = await compressFile(file);
        console.log("Compressed successfully.");
        console.log(formatCompressionResult(result));
      } catch (err: any) {
        console.error(`Error compressing file: ${err.message}`);
        process.exit(1);
      }
    });

  compress
    .command("unpack <file>")
    .description("Decompress a gzip-compressed env file")
    .option("-o, --output <path>", "Output file path")
    .action(async (file: string, opts: { output?: string }) => {
      try {
        const dest = await decompressFile(file, opts.output);
        console.log(`Decompressed to: ${dest}`);
      } catch (err: any) {
        console.error(`Error decompressing file: ${err.message}`);
        process.exit(1);
      }
    });
}
