import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerCompressCommands } from "./compressCommand";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-compresscmd-"));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCompressCommands(program);
  return program;
}

describe("compress pack", () => {
  it("compresses a file and prints result", async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "test.env.gpg");
    fs.writeFileSync(file, "SECRET=abc\nFOO=bar\n");

    const program = makeProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "compress", "pack", file]);

    expect(spy).toHaveBeenCalledWith("Compressed successfully.");
    expect(fs.existsSync(file + ".gz")).toBe(true);

    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });

  it("exits with error for missing file", async () => {
    const program = makeProgram();
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as any);

    await program.parseAsync(["node", "envault", "compress", "pack", "/nonexistent/file.gpg"]);

    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe("compress unpack", () => {
  it("decompresses a .gz file to specified output", async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "test.env.gpg");
    const content = "SECRET=xyz\n";
    fs.writeFileSync(file, content);

    const zlib = require("zlib");
    const gz = path.join(dir, "test.env.gpg.gz");
    fs.writeFileSync(gz, zlib.gzipSync(Buffer.from(content)));

    const out = path.join(dir, "restored.env.gpg");
    const program = makeProgram();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "compress", "unpack", gz, "-o", out]);

    expect(spy).toHaveBeenCalledWith(`Decompressed to: ${out}`);
    expect(fs.readFileSync(out, "utf8")).toBe(content);

    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });
});
