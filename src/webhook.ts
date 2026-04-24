import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

export interface WebhooksFile {
  webhooks: Record<string, WebhookConfig>;
}

export function getWebhooksPath(dir: string): string {
  return path.join(dir, ".envault", "webhooks.json");
}

export function loadWebhooks(dir: string): WebhooksFile {
  const filePath = getWebhooksPath(dir);
  if (!fs.existsSync(filePath)) return { webhooks: {} };
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function saveWebhooks(dir: string, data: WebhooksFile): void {
  const filePath = getWebhooksPath(dir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function addWebhook(
  dir: string,
  name: string,
  config: WebhookConfig
): WebhooksFile {
  const data = loadWebhooks(dir);
  data.webhooks[name] = config;
  saveWebhooks(dir, data);
  return data;
}

export function removeWebhook(dir: string, name: string): WebhooksFile {
  const data = loadWebhooks(dir);
  delete data.webhooks[name];
  saveWebhooks(dir, data);
  return data;
}

export function getWebhook(dir: string, name: string): WebhookConfig | undefined {
  return loadWebhooks(dir).webhooks[name];
}

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(
  config: WebhookConfig,
  event: string,
  payload: Record<string, unknown>
): Promise<{ status: number; ok: boolean }> {
  if (!config.enabled || !config.events.includes(event)) {
    return { status: 0, ok: false };
  }
  const body = JSON.stringify({ event, ...payload });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.secret) {
    headers["X-Envault-Signature"] = signPayload(body, config.secret);
  }
  const res = await fetch(config.url, { method: "POST", headers, body });
  return { status: res.status, ok: res.ok };
}

export function formatWebhookList(data: WebhooksFile): string {
  const entries = Object.entries(data.webhooks);
  if (entries.length === 0) return "No webhooks configured.";
  return entries
    .map(
      ([name, cfg]) =>
        `${name}: ${cfg.url} [${cfg.events.join(", ")}] ${cfg.enabled ? "enabled" : "disabled"}`
    )
    .join("\n");
}
