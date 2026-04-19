import * as fs from 'fs';
import * as path from 'path';

export interface Reminder {
  id: string;
  message: string;
  dueDate: string;
  file: string;
}

export function getRemindersPath(dir: string): string {
  return path.join(dir, '.envault', 'reminders.json');
}

export function loadReminders(dir: string): Reminder[] {
  const p = getRemindersPath(dir);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveReminders(dir: string, reminders: Reminder[]): void {
  const p = getRemindersPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(reminders, null, 2));
}

export function addReminder(dir: string, reminder: Reminder): void {
  const reminders = loadReminders(dir);
  reminders.push(reminder);
  saveReminders(dir, reminders);
}

export function removeReminder(dir: string, id: string): void {
  const reminders = loadReminders(dir).filter((r) => r.id !== id);
  saveReminders(dir, reminders);
}

export function getDueReminders(dir: string, asOf: Date = new Date()): Reminder[] {
  return loadReminders(dir).filter((r) => new Date(r.dueDate) <= asOf);
}

export function formatReminders(reminders: Reminder[]): string {
  if (reminders.length === 0) return 'No reminders.';
  return reminders
    .map((r) => `[${r.id}] ${r.message} — due ${r.dueDate} (${r.file})`)
    .join('\n');
}
