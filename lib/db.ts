import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'todos.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  created_at: string;
}

export function getAllTodos(): Todo[] {
  const rows = getDb().prepare('SELECT * FROM todos ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({ ...r, completed: r.completed === 1 }));
}

export function createTodo(text: string): Todo {
  const stmt = getDb().prepare('INSERT INTO todos (text) VALUES (?)');
  const result = stmt.run(text);
  return getTodo(result.lastInsertRowid as number)!;
}

export function getTodo(id: number): Todo | undefined {
  const row = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return { ...row, completed: row.completed === 1 };
}

export function updateTodo(id: number, completed: boolean): Todo | undefined {
  getDb().prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
  return getTodo(id);
}

export function deleteTodo(id: number): boolean {
  const result = getDb().prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}
