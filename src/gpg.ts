import { execSync } from "child_process";

export interface GPGKey {
  fingerprint: string;
  email: string;
  name: string;
}

export function listPublicKeys(): GPGKey[] {
  try {
    const output = execSync(
      "gpg --list-keys --with-colons",
      { encoding: "utf-8" }
    );
    const keys: GPGKey[] = [];
    const lines = output.split("\n");
    let currentName = "";
    let currentEmail = "";
    let currentFingerprint = "";

    for (const line of lines) {
      const parts = line.split(":");
      if (parts[0] === "uid") {
        const match = parts[9]?.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
          currentName = match[1].trim();
          currentEmail = match[2].trim();
        }
      } else if (parts[0] === "fpr") {
        currentFingerprint = parts[9];
        if (currentFingerprint && currentEmail) {
          keys.push({
            fingerprint: currentFingerprint,
            email: currentEmail,
            name: currentName,
          });
          currentName = "";
          currentEmail = "";
          currentFingerprint = "";
        }
      }
    }
    return keys;
  } catch {
    throw new Error("Failed to list GPG keys. Ensure GPG is installed and configured.");
  }
}

export function encryptFile(inputPath: string, outputPath: string, recipients: string[]): void {
  if (recipients.length === 0) {
    throw new Error("At least one recipient fingerprint is required.");
  }
  const recipientArgs = recipients.map((r) => `-r ${r}`).join(" ");
  try {
    execSync(
      `gpg --yes --output ${outputPath} --encrypt ${recipientArgs} ${inputPath}`,
      { stdio: "inherit" }
    );
  } catch {
    throw new Error(`Failed to encrypt file "${inputPath}". Ensure the recipient keys are trusted and available.`);
  }
}

export function decryptFile(inputPath: string, outputPath: string): void {
  try {
    execSync(
      `gpg --yes --output ${outputPath} --decrypt ${inputPath}`,
      { stdio: "inherit" }
    );
  } catch {
    throw new Error(`Failed to decrypt file "${inputPath}". Ensure you have the correct private key available.`);
  }
}
