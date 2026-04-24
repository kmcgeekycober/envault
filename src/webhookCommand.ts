import { Command } from "commander";
import {
  addWebhook,
  removeWebhook,
  loadWebhooks,
  formatWebhookList,
  dispatchWebhook,
  getWebhook,
} from "./webhook";

export function registerWebhookCommands(program: Command, cwd = process.cwd()): void {
  const webhook = program.command("webhook").description("Manage webhooks for vault events");

  webhook
    .command("add <name> <url>")
    .description("Register a webhook endpoint")
    .option("-e, --events <events>", "Comma-separated list of events", "sync")
    .option("-s, --secret <secret>", "HMAC signing secret")
    .option("--disabled", "Add webhook in disabled state", false)
    .action((name: string, url: string, opts) => {
      const events = (opts.events as string).split(",").map((e: string) => e.trim());
      addWebhook(cwd, name, {
        url,
        events,
        secret: opts.secret,
        enabled: !opts.disabled,
      });
      console.log(`Webhook "${name}" added for events: ${events.join(", ")}`);
    });

  webhook
    .command("remove <name>")
    .description("Remove a registered webhook")
    .action((name: string) => {
      removeWebhook(cwd, name);
      console.log(`Webhook "${name}" removed.`);
    });

  webhook
    .command("list")
    .description("List all registered webhooks")
    .action(() => {
      console.log(formatWebhookList(loadWebhooks(cwd)));
    });

  webhook
    .command("trigger <name> <event>")
    .description("Manually trigger a webhook")
    .action(async (name: string, event: string) => {
      const config = getWebhook(cwd, name);
      if (!config) {
        console.error(`Webhook "${name}" not found.`);
        process.exit(1);
      }
      const result = await dispatchWebhook(config, event, { manual: true, triggeredAt: new Date().toISOString() });
      if (result.ok) {
        console.log(`Webhook "${name}" triggered successfully (HTTP ${result.status}).`);
      } else {
        console.error(`Webhook "${name}" dispatch failed (HTTP ${result.status}).`);
        process.exit(1);
      }
    });
}
