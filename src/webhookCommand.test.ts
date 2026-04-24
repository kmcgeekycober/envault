import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { registerWebhookCommands } from "./webhookCommand";
import { loadWebhooks } from "./webhook";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-wh-cmd-"));
}

function makeProgram(cwd: string): Command {
  const program = new Command();
  program.exitOverride();
  registerWebhookCommands(program, cwd);
  return program;
}

describe("webhookCommand", () => {
  it("adds a webhook", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    program.parse(["node", "test", "webhook", "add", "ci", "https://ci.example.com/hook"]);
    const data = loadWebhooks(dir);
    expect(data.webhooks["ci"]).toBeDefined();
    expect(data.webhooks["ci"].url).toBe("https://ci.example.com/hook");
    expect(data.webhooks["ci"].events).toContain("sync");
    expect(data.webhooks["ci"].enabled).toBe(true);
  });

  it("adds a disabled webhook with custom events", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    program.parse(["node", "test", "webhook", "add", "deploy", "https://deploy.io", "-e", "rotate,sync", "--disabled"]);
    const cfg = loadWebhooks(dir).webhooks["deploy"];
    expect(cfg.enabled).toBe(false);
    expect(cfg.events).toEqual(["rotate", "sync"]);
  });

  it("removes a webhook", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    program.parse(["node", "test", "webhook", "add", "ci", "https://ci.example.com/hook"]);
    program.parse(["node", "test", "webhook", "remove", "ci"]);
    expect(loadWebhooks(dir).webhooks["ci"]).toBeUndefined();
  });

  it("lists webhooks", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "webhook", "add", "ci", "https://ci.example.com/hook"]);
    program.parse(["node", "test", "webhook", "list"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("ci"));
    spy.mockRestore();
  });

  it("trigger exits with error for missing webhook", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      program.parse(["node", "test", "webhook", "trigger", "nonexistent", "sync"])
    ).toThrow();
    mockExit.mockRestore();
  });
});
