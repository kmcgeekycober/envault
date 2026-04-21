import { mergeEnvFiles, formatMergeResult, serializeMerged } from "./merge";

describe("mergeEnvFiles", () => {
  const base = { FOO: "1", BAR: "2", SHARED: "old" };
  const incoming = { BAZ: "3", SHARED: "new", EXTRA: "4" };

  it("adds keys from incoming not in base", () => {
    const result = mergeEnvFiles(base, incoming, "ours");
    expect(result.added).toContain("BAZ");
    expect(result.added).toContain("EXTRA");
    expect(result.merged["BAZ"]).toBe("3");
  });

  it("detects conflicts for keys with differing values", () => {
    const result = mergeEnvFiles(base, incoming, "ours");
    expect(result.conflicts).toContain("SHARED");
  });

  it("keeps base value on conflict with strategy 'ours'", () => {
    const result = mergeEnvFiles(base, incoming, "ours");
    expect(result.merged["SHARED"]).toBe("old");
    expect(result.overwritten).not.toContain("SHARED");
  });

  it("uses incoming value on conflict with strategy 'theirs'", () => {
    const result = mergeEnvFiles(base, incoming, "theirs");
    expect(result.merged["SHARED"]).toBe("new");
    expect(result.overwritten).toContain("SHARED");
  });

  it("returns no conflicts when files are identical", () => {
    const result = mergeEnvFiles(base, base, "ours");
    expect(result.conflicts).toHaveLength(0);
    expect(result.added).toHaveLength(0);
  });
});

describe("formatMergeResult", () => {
  it("reports added and conflicting keys", () => {
    const result = {
      merged: {},
      conflicts: ["SHARED"],
      added: ["BAZ"],
      overwritten: []
    };
    const output = formatMergeResult(result);
    expect(output).toContain("Added keys");
    expect(output).toContain("+ BAZ");
    expect(output).toContain("Conflicting keys");
    expect(output).toContain("~ SHARED [resolved:ours]");
  });

  it("reports clean merge when no conflicts", () => {
    const result = { merged: {}, conflicts: [], added: [], overwritten: [] };
    expect(formatMergeResult(result)).toContain("merged cleanly");
  });
});

describe("serializeMerged", () => {
  it("serializes a merged record to dotenv format", () => {
    const merged = { FOO: "bar", BAZ: "qux" };
    const output = serializeMerged(merged);
    expect(output).toContain("FOO=bar");
    expect(output).toContain("BAZ=qux");
    expect(output.endsWith("\n")).toBe(true);
  });
});
