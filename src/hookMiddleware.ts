import { loadHooks, runHook } from './hook';

export type HookEvent = 'pre-encrypt' | 'post-encrypt' | 'pre-decrypt' | 'post-decrypt';

export async function withHook<T>(
  event: HookEvent,
  fn: () => Promise<T>,
  envFile?: string
): Promise<T> {
  const hooks = loadHooks();

  const preEvent = event.startsWith('pre-') ? event : null;
  const postEvent = event.startsWith('post-') ? event : null;

  if (preEvent && hooks[preEvent]) {
    await runHook(hooks[preEvent]!, envFile);
  }

  const result = await fn();

  if (postEvent && hooks[postEvent]) {
    await runHook(hooks[postEvent]!, envFile);
  }

  return result;
}

export async function runPreEncrypt(envFile: string, fn: () => Promise<void>): Promise<void> {
  const hooks = loadHooks();
  if (hooks['pre-encrypt']) await runHook(hooks['pre-encrypt']!, envFile);
  await fn();
  if (hooks['post-encrypt']) await runHook(hooks['post-encrypt']!, envFile);
}

export async function runPreDecrypt(envFile: string, fn: () => Promise<void>): Promise<void> {
  const hooks = loadHooks();
  if (hooks['pre-decrypt']) await runHook(hooks['pre-decrypt']!, envFile);
  await fn();
  if (hooks['post-decrypt']) await runHook(hooks['post-decrypt']!, envFile);
}
