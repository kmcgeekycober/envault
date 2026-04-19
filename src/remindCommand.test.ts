import { Command } from 'commander';
import { registerRemindCommands } from './remindCommand';
import * as remind from './remind';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerRemindCommands(program);
  return program;
}

describe('remindCommand', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('add calls addReminder and prints message', async () => {
    const spy = jest.spyOn(remind, 'addReminder').mockReturnValue({
      file: '.env', message: 'rotate keys', createdAt: '2024-01-01T00:00:00.000Z'
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['remind', 'add', '.env', 'rotate keys'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('.env', 'rotate keys', undefined);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('rotate keys'));
  });

  it('list prints all reminders', async () => {
    jest.spyOn(remind, 'loadReminders').mockReturnValue({
      reminders: [{ file: '.env', message: 'check keys', createdAt: '2024-01-01T00:00:00.000Z' }]
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['remind', 'list'], { from: 'user' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('check keys'));
  });

  it('due prints due reminders', async () => {
    jest.spyOn(remind, 'getDueReminders').mockReturnValue([
      { file: '.env', message: 'urgent', createdAt: '2024-01-01T00:00:00.000Z' }
    ]);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['remind', 'due'], { from: 'user' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('urgent'));
  });

  it('remove calls removeReminder', async () => {
    const spy = jest.spyOn(remind, 'removeReminder').mockReturnValue(true);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['remind', 'remove', '.env', '0'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('.env', 0);
    expect(log).toHaveBeenCalledWith('Reminder removed.');
  });
});
