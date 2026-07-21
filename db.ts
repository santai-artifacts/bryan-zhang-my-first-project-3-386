import Database from 'bun:sqlite';
import { mkdirSync } from 'fs';

const dataDir = `${import.meta.dir}/data`;
mkdirSync(dataDir, { recursive: true });

const db = new Database(process.env.DATABASE_URL || `${dataDir}/tracker.db`);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

const count = (db.query('SELECT COUNT(*) as n FROM items').get() as any).n;
if (count === 0) {
  const ins = db.prepare(
    `INSERT INTO items (title, description, category, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)`
  );
  ins.run('Set up project roadmap', 'Define milestones and deliverables for Q3', 'Work', 'todo', 'high', null);
  ins.run('Weekly team standup', 'Prepare agenda and action items', 'Work', 'in-progress', 'medium', null);
  ins.run('Read Atomic Habits', 'Focus on chapters 3–5 this week', 'Learning', 'in-progress', 'low', null);
  ins.run('Monthly budget review', 'Track expenses and savings goals', 'Finance', 'todo', 'high', null);
  ins.run('Gym session', '3x per week — legs, push, pull split', 'Health', 'done', 'medium', null);
  ins.run('Update portfolio site', 'Add recent projects and refresh bio', 'Personal', 'done', 'low', null);
}

export default db;
