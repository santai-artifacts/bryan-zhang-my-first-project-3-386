import { Hono } from 'hono';
import db from './db';

const app = new Hono();

app.get('/', () =>
  new Response(Bun.file(`${import.meta.dir}/public/index.html`), {
    headers: { 'Content-Type': 'text/html' },
  })
);

app.get('/api/items', (c) => {
  const status = c.req.query('status');
  const category = c.req.query('category');

  let sql = 'SELECT * FROM items WHERE 1=1';
  const params: string[] = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY created_at DESC';

  return c.json(db.query(sql).all(...params));
});

app.get('/api/stats', (c) => {
  const byStatus = db.query('SELECT status, COUNT(*) as count FROM items GROUP BY status').all();
  const categories = db.query('SELECT DISTINCT category FROM items ORDER BY category').all();
  const total = (db.query('SELECT COUNT(*) as n FROM items').get() as any).n;
  const done = (db.query("SELECT COUNT(*) as n FROM items WHERE status='done'").get() as any).n;
  return c.json({ byStatus, categories, total, done });
});

app.post('/api/items', async (c) => {
  const body = await c.req.json();
  const { title, description, category, priority, status, due_date } = body;

  if (!title?.trim()) return c.json({ error: 'Title is required' }, 400);

  const result = db.query(`
    INSERT INTO items (title, description, category, priority, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    description?.trim() || '',
    category?.trim() || 'General',
    priority || 'medium',
    status || 'todo',
    due_date || null
  );

  return c.json(db.query('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid), 201);
});

app.put('/api/items/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const { title, description, category, priority, status, due_date } = body;

  if (!title?.trim()) return c.json({ error: 'Title is required' }, 400);

  db.query(`
    UPDATE items SET
      title = ?, description = ?, category = ?, priority = ?,
      status = ?, due_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title.trim(),
    description?.trim() || '',
    category?.trim() || 'General',
    priority || 'medium',
    status || 'todo',
    due_date || null,
    id
  );

  const item = db.query('SELECT * FROM items WHERE id = ?').get(id);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

app.delete('/api/items/:id', (c) => {
  db.query('DELETE FROM items WHERE id = ?').run(parseInt(c.req.param('id')));
  return c.json({ success: true });
});

export default { port: process.env.PORT || 3000, fetch: app.fetch };
