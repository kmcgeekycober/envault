import fs from "fs";
import os from "os";
import path from "path";
import {
  getWebhooksPath,
  loadWebhooks,
  addWebhook,
  removeWebhook,
  getWebhook,
  signPayload,
  formatWebhookList,
} from "./webhook";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-webhook-"));
}

describe("webhook", () => {
  it("returns empty webhooks when file missing", () => {
    const dir = makeTmpDir();
    expect(loadWebhooks(dir)).toEqual({ webhooks: {} });
  });

  it("getWebhooksPath returns correct path", () => {
    expect(getWebhooksPath("/project")).toBe("/project/.envault/webhooks.json");
  });

  it("addWebhook persists a webhook", () => {
    const dir = makeTmpDir();
    addWebhook(dir, "ci", { url: "https://example.com/hook", events: ["sync"], enabled: true });
    const data = loadWebhooks(dir);
    expect(data.webhooks["ci"]).toBeDefined();
    expect(data.webhooks["ci"].url).toBe("https://example.com/hook");
  });

  it("removeWebhook deletes a webhook", () => {
    const dir = makeTmpDir();
    addWebhook(dir, "ci", { url: "https://example.com/hook", events: ["sync"], enabled: true });
    removeWebhook(dir, "ci");
    expect(loadWebhooks(dir).webhooks["ci"]).toBeUndefined();
  });

  it("getWebhook returns undefined for missing name", () => {
    const dir = makeTmpDir();
    expect(getWebhook(dir, "missing")).toBeUndefined();
  });

  it("signPayload produces consistent hmac", () => {
    const sig1 = signPayload("hello", "secret");
    const sig2 = signPayload("hello", "secret");
    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64);
  });

  it("formatWebhookList shows message when empty", () => {
    const dir = makeTmpDir();
    expect(formatWebhookList(loadWebhooks(dir))).toBe("No webhooks configured.");
  });

  it("formatWebhookList lists webhooks", () => {
    const dir = makeTmpDir();
    addWebhook(dir, "deploy", { url: "https://deploy.io/hook", events: ["rotate", "sync"], enabled: true });
    const result = formatWebhookList(loadWebhooks(dir));
    expect(result).toContain("deploy");
    expect(result).toContain("rotate, sync");
    expect(result).toContain("enabled");
  });
});
