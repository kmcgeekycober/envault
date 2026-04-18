import * as path from 'path';
import { getActiveProfile } from './profile';

export interface ResolvedProfile {
  envFile: string;
  profileName: string;
}

/**
 * Resolves which .env file to use based on active profile or explicit flag.
 * Falls back to '.env' if no profile is active.
 */
export function resolveEnvFile(explicitFile?: string, vaultDir = '.envault'): ResolvedProfile {
  if (explicitFile) {
    return { envFile: explicitFile, profileName: 'explicit' };
  }
  const active = getActiveProfile(vaultDir);
  if (active) {
    return { envFile: active.file, profileName: active.name };
  }
  return { envFile: '.env', profileName: 'default' };
}

/**
 * Middleware that injects resolved env file into commander action options.
 */
export function withProfile(vaultDir = '.envault') {
  return (opts: Record<string, unknown>): Record<string, unknown> => {
    if (opts.file) return opts;
    const { envFile, profileName } = resolveEnvFile(undefined, vaultDir);
    return { ...opts, file: envFile, _profile: profileName };
  };
}
