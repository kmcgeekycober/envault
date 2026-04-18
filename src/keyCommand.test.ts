import { Command } from 'commander';
import { registerKeyCommands } from './keyCommand';
import * as gpg from './gpg';
import * as vault from './vault';

jest.mock('./gpg');
jest.mock('./vault');

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerKeyCommands(program);
  return program;
}

const mockKeys = [
  { keyId: 'ABCD1234', fingerprint: 'FINGERPRINT1', uid: 'Alice <alice@example.com>' },
];

beforeEach(() => jest.clearAllMocks());

test('key list prints recipients', async () => {
  (vault.loadConfig as jest.Mock).mockResolvedValue({ recipients: ['FINGERPRINT1'] });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['node', 'envault', 'key', 'list']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('FINGERPRINT1'));
  spy.mockRestore();
});

test('key list shows empty message when no recipients', async () => {
  (vault.loadConfig as jest.Mock).mockResolvedValue({ recipients: [] });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['node', 'envault', 'key', 'list']);
  expect(spy).toHaveBeenCalledWith('No recipients configured.');
  spy.mockRestore();
});

test('key add succeeds for known key', async () => {
  (gpg.listPublicKeys as jest.Mock).mockResolvedValue(mockKeys);
  (vault.addRecipient as jest.Mock).mockResolvedValue(undefined);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['node', 'envault', 'key', 'add', 'FINGERPRINT1']);
  expect(vault.addRecipient).toHaveBeenCalledWith('FINGERPRINT1');
  spy.mockRestore();
});

test('key add exits for unknown key', async () => {
  (gpg.listPublicKeys as jest.Mock).mockResolvedValue(mockKeys);
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  await expect(makeProgram().parseAsync(['node', 'envault', 'key', 'add', 'UNKNOWN'])).rejects.toThrow();
  expect(exitSpy).toHaveBeenCalledWith(1);
  spy.mockRestore();
  exitSpy.mockRestore();
});

test('key remove calls removeRecipient', async () => {
  (vault.removeRecipient as jest.Mock).mockResolvedValue(undefined);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['node', 'envault', 'key', 'remove', 'FINGERPRINT1']);
  expect(vault.removeRecipient).toHaveBeenCalledWith('FINGERPRINT1');
  spy.mockRestore();
});

test('key available lists keyring keys', async () => {
  (gpg.listPublicKeys as jest.Mock).mockResolvedValue(mockKeys);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['node', 'envault', 'key', 'available']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
  spy.mockRestore();
});
