import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { applyKeyMiddleware } from './keyMiddleware';

// Mock dependencies
vi.mock('./vault', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('./gpg', () => ({
  listPublicKeys: vi.fn(),
}));

import { loadConfig } from './vault';
import { listPublicKeys } from './gpg';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  applyKeyMiddleware(program);
  return program;
}

describe('keyMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes through when config has recipients and keys exist', async () => {
    (loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
      recipients: ['alice@example.com'],
      files: ['.env'],
    });
    (listPublicKeys as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'ABC123', email: 'alice@example.com', name: 'Alice' },
    ]);

    const program = makeProgram();
    const action = vi.fn();
    program.command('test').action(action);

    await program.parseAsync(['node', 'envault', 'test']);
    expect(action).toHaveBeenCalled();
  });

  it('warns when a recipient has no matching public key', async () => {
    (loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
      recipients: ['bob@example.com'],
      files: ['.env'],
    });
    (listPublicKeys as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const program = makeProgram();
    const action = vi.fn();
    program.command('test').action(action);

    await program.parseAsync(['node', 'envault', 'test']);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('bob@example.com'),
    );
    warnSpy.mockRestore();
  });

  it('does not warn when there are no recipients configured', async () => {
    (loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
      recipients: [],
      files: ['.env'],
    });
    (listPublicKeys as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const program = makeProgram();
    const action = vi.fn();
    program.command('test').action(action);

    await program.parseAsync(['node', 'envault', 'test']);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('handles loadConfig failure gracefully', async () => {
    (loadConfig as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Config not found'),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = makeProgram();
    const action = vi.fn();
    program.command('test').action(action);

    await program.parseAsync(['node', 'envault', 'test']);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config not found'),
    );
    errorSpy.mockRestore();
  });
});
