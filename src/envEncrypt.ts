import * as fs from "fs";
import * as path from "path";
import { encryptFile } from "./gpg";
import { loadConfig } from "./vault";

export interface EncryptResult {
  inputFile: string;
  outputFile: string;
  recipients: string[];
  success: boolean;
  error?: string;
}

export async function encryptEnvFile(
  envFile: string,
  outputFile?: string,
  extraRecipients: string[] = []
): Promise<EncryptResult> {
  const config = await loadConfig();
  const recipients = [
    ...(config.recipients ?? []),
    ...extraRecipients,
  ].filter((r, i, arr) => arr.indexOf(r) === i);

  if (recipients.length === 0) {
    return {
      inputFile: envFile,
      outputFile: outputFile ?? envFile + ".gpg",
      recipients,
      success: false,
      error: "No recipients configured. Add recipients with `envault key add`.",
    };
  }

  const resolvedOutput = outputFile ?? envFile + ".gpg";

  try {
    await encryptFile(envFile, resolvedOutput, recipients);
    return { inputFile: envFile, outputFile: resolvedOutput, recipients, success: true };
  } catch (err: any) {
    return {
      inputFile: envFile,
      outputFile: resolvedOutput,
      recipients,
      success: false,
      error: err?.message ?? String(err),
    };
  }
}

export function formatEncryptResult(result: EncryptResult): string {
  if (!result.success) {
    return `❌ Encryption failed for ${result.inputFile}: ${result.error}`;
  }
  const recipientList = result.recipients.join(", ");
  return [
    `✅ Encrypted: ${result.inputFile} → ${result.outputFile}`,
    `   Recipients: ${recipientList}`,
  ].join("\n");
}
