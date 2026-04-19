import * as fs from 'fs';
import * as path from 'path';

export interface ReminderEntry {
  file: string;
  message: string;
  createdAt: string;
  dueAt?: string;
}

export interface RemindersConfig {
  reminders: ReminderEntry[];
}

export function getRemindersPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envault', 'reminders.json');
}

export function loadReminders(dir?: string): RemindersConfig {
  const p = getRemindersPath(dir);
  if (!fs.existsSync(p)) return { reminders: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveReminders(config: RemindersConfig, dir?: string): void {
  const p = getRemindersPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function addReminder(file: string, message: string, dueAt?: string, dir?: string): ReminderEntry {
  const config = loadReminders(dir);
  const entry: ReminderEntry = { file, message, createdAt: new Date().toISOString(), dueAt };
  config.reminders.push(entry);
  saveReminders(config, dir);
  return entry;
}

export function removeReminder(file: string, index: number, dir?: string): boolean {
  const config = loadReminders(dir);
  const fileReminders = config.reminders.filter(r => r.file === file);
  if (index < 0 || index >= fileReminders.length) return false;
  const target = fileReminders[index];
  config.reminders = config.reminders.filter(r => r !== target);
  saveReminders(config, dir);
  return true;
}

export function getDueReminders(dir?: string): ReminderEntry[] {
  const config = loadReminders(dir);
  const now = new Date();
  return config.reminders.filter(r => !r.dueAt || new Date(r.dueAt) <= now);
}

export function formatReminders(reminders: ReminderEntry[]): string {
  if (reminders.length === 0) return 'No reminders.';
  return reminders.map((r, i) =>
    `[${i}] ${r.file}: ${r.message}${r.dueAt ? ` (due: ${r.dueAt})` : ''}`
  ).join('\n');
}
