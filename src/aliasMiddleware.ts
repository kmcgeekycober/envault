import { resolveAlias } from './alias';

/**
 * Resolves an env file argument that may be an alias.
 * Falls back to the original value if no alias is found.
 */
export function resolveEnvAlias(input: string): string {
  const resolved = resolveAlias(input);
  return resolved ?? input;
}

/**
 * Middleware wrapper: resolves alias in options.file before passing to action.
 */
export function withAlias(
  action: (file: string, ...args: any[]) => void | Promise<void>
): (file: string, ...args: any[]) => void | Promise<void> {
  return (file: string, ...args: any[]) => {
    const resolved = resolveEnvAlias(file);
    return action(resolved, ...args);
  };
}
