import { execSync } from "child_process";
import { listPublicKeys, encryptFile, decryptFile } from "./gpg";

jest.mock("child_process");
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe("gpg", () => {
  afterEach(() => jest.clearAllMocks());

  describe("listPublicKeys", () => {
    it("parses gpg key output into structured keys", () => {
      mockExecSync.mockReturnValue(
        "fpr:::::::::ABCD1234EFGH5678::\nuid:-::::Alice Example <alice@example.com>::"
          .split("\n")
          .reverse()
          .join("\n") as any
      );
      // Provide realistic colon-delimited output
      mockExecSync.mockReturnValue(
        "uid:o::::1700000000::HASH::Alice Example <alice@example.com>:::::::::0:\nfpr:::::::::ABCD1234EFGH5678::" as any
      );
      const keys = listPublicKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toEqual({
        fingerprint: "ABCD1234EFGH5678",
        email: "alice@example.com",
        name: "Alice Example",
      });
    });

    it("throws when gpg command fails", () => {
      mockExecSync.mockImplementation(() => { throw new Error("gpg not found"); });
      expect(() => listPublicKeys()).toThrow(
        "Failed to list GPG keys. Ensure GPG is installed and configured."
      );
    });
  });

  describe("encryptFile", () => {
    it("calls gpg encrypt with all recipients", () => {
      mockExecSync.mockReturnValue("" as any);
      encryptFile(".env", ".env.gpg", ["FINGERPRINT1", "FINGERPRINT2"]);
      expect(mockExecSync).toHaveBeenCalledWith(
        "gpg --yes --output .env.gpg --encrypt -r FINGERPRINT1 -r FINGERPRINT2 .env",
        { stdio: "inherit" }
      );
    });

    it("throws when no recipients provided", () => {
      expect(() => encryptFile(".env", ".env.gpg", [])).toThrow(
        "At least one recipient fingerprint is required."
      );
    });
  });

  describe("decryptFile", () => {
    it("calls gpg decrypt with correct args", () => {
      mockExecSync.mockReturnValue("" as any);
      decryptFile(".env.gpg", ".env");
      expect(mockExecSync).toHaveBeenCalledWith(
        "gpg --yes --output .env --decrypt .env.gpg",
        { stdio: "inherit" }
      );
    });
  });
});
