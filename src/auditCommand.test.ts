import { Command } from 'commander';
import { registerAuditCommands } from './auditCommand';
import * as audit from './audit';

jest.mock('./audit');

const mockedReadAuditLog = audit.readAuditLog as jest.MockedFunction<typeof audit.readAuditLog>;
const mockedFormatAuditLog = audit.formatAuditLog as jest.MockedFunction<typeof audit.formatAuditLog>;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerAuditCommands(program);
  return program;
}

describe('audit show command', () => {
  beforeEach(() => {
    mockedReadAuditLog.mockReturnValue([
      { timestamp: '2024-01-01T00:00:00Z', action: 'encrypt', user: 'alice', file: '.env' },
      { timestamp: '2024-01-02T00:00:00Z', action: 'decrypt', user: 'bob', file: '.env' },
    ]);
    mockedFormatAuditLog.mockReturnValue('formatted log');
  });

  afterEach(() => jest.clearAllMocks());

  it('shows all entries by default', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    makeProgram().parse(['node', 'envault', 'audit', 'show']);
    expect(mockedReadAuditLog).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('formatted log');
    spy.mockRestore();
  });

  it('filters by action', () => {
    makeProgram().parse(['node', 'envault', 'audit', 'show', '--action', 'encrypt']);
    const passedEntries = mockedFormatAuditLog.mock.calls[0][0];
    expect(passedEntries.every((e) => e.action === 'encrypt')).toBe(true);
  });

  it('filters by user', () => {
    makeProgram().parse(['node', 'envault', 'audit', 'show', '--user', 'alice']);
    const passedEntries = mockedFormatAuditLog.mock.calls[0][0];
    expect(passedEntries.every((e) => e.user === 'alice')).toBe(true);
  });
});

describe('audit clear command', () => {
  it('exits with error if --confirm not passed', () => {
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => makeProgram().parse(['node', 'envault', 'audit', 'clear'])).toThrow('exit');
    expect(spy).toHaveBeenCalledWith(1);
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
