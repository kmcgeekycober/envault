import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getRemindersPath,
  loadReminders,
  saveReminders,
  addReminder,
  removeReminder,
} from './remind';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-remind-'));
}

describe('remind', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('getRemindersPath returns path under dir', () => {
    const p = getRemindersPath(tmpDir);
    expect(p).toContain('reminders.json');
  });

  it('loadReminders returns empty array when file missing', () => {
    const reminders = loadReminders(tmpDir);
    expect(reminders).toEqual([]);
  });

  it('saveReminders and loadReminders round-trip', () => {
    const entries = [{ id: '1', message: 'Rotate keys', dueDate: '2024-12-01', file: '.env' }];
    saveReminders(tmpDir, entries);
    expect(loadReminders(tmpDir)).toEqual(entries);
  });

  it('addReminder appends entry', () => {
    addReminder(tmpDir, { id: 'a', message: 'Check expiry', dueDate: '2024-11-01', file: '.env' });
    const reminders = loadReminders(tmpDir);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].message).toBe('Check expiry');
  });

  it('removeReminder deletes by id', () => {
    addReminder(tmpDir, { id: 'x', message: 'Test', dueDate: '2024-10-01', file: '.env' });
    addReminder(tmpDir, { id: 'y', message: 'Other', dueDate: '2024-10-02', file: '.env' });
    removeReminder(tmpDir, 'x');
    const reminders = loadReminders(tmpDir);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].id).toBe('y');
  });
});
