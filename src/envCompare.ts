import * as fs from "fs";
import { parseEnvEntries } from "./env";

export interface EnvCompareEntry {
  key: string;
  leftValue: string | undefined;
  rightValue: string | undefined;
  status: "match" | "mismatch" | "left-only" | "right-only";
}

export interface EnvCompareResult {
  entries: EnvCompareEntry[];
  matchCount: number;
  mismatchCount: number;
  leftOnlyCount: number;
  rightOnlyCount: number;
}

export function compareEnvFiles(
  leftPath: string,
  rightPath: string
): EnvCompareResult {
  const leftContent = fs.existsSync(leftPath)
    ? fs.readFileSync(leftPath, "utf8")
    : "";
  const rightContent = fs.existsSync(rightPath)
    ? fs.readFileSync(rightPath, "utf8")
    : "";

  const leftEntries = parseEnvEntries(leftContent);
  const rightEntries = parseEnvEntries(rightContent);

  const leftMap = new Map(leftEntries.map((e) => [e.key, e.value]));
  const rightMap = new Map(rightEntries.map((e) => [e.key, e.value]));
  const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()]);

  const entries: EnvCompareEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const leftValue = leftMap.get(key);
    const rightValue = rightMap.get(key);

    let status: EnvCompareEntry["status"];
    if (leftValue !== undefined && rightValue !== undefined) {
      status = leftValue === rightValue ? "match" : "mismatch";
    } else if (leftValue !== undefined) {
      status = "left-only";
    } else {
      status = "right-only";
    }

    entries.push({ key, leftValue, rightValue, status });
  }

  return {
    entries,
    matchCount: entries.filter((e) => e.status === "match").length,
    mismatchCount: entries.filter((e) => e.status === "mismatch").length,
    leftOnlyCount: entries.filter((e) => e.status === "left-only").length,
    rightOnlyCount: entries.filter((e) => e.status === "right-only").length,
  };
}

export function formatCompareResult(
  result: EnvCompareResult,
  leftLabel = "left",
  rightLabel = "right"
): string {
  const lines: string[] = [];

  lines.push(
    `Comparing [${leftLabel}] vs [${rightLabel}]: ` +
      `${result.matchCount} match, ${result.mismatchCount} mismatch, ` +
      `${result.leftOnlyCount} only in left, ${result.rightOnlyCount} only in right`
  );
  lines.push("");

  for (const entry of result.entries) {
    if (entry.status === "match") {
      lines.push(`  = ${entry.key}`);
    } else if (entry.status === "mismatch") {
      lines.push(`  ~ ${entry.key}`);
      lines.push(`      [${leftLabel}]: ${entry.leftValue}`);
      lines.push(`      [${rightLabel}]: ${entry.rightValue}`);
    } else if (entry.status === "left-only") {
      lines.push(`  < ${entry.key}  (only in ${leftLabel})`);
    } else {
      lines.push(`  > ${entry.key}  (only in ${rightLabel})`);
    }
  }

  return lines.join("\n");
}
