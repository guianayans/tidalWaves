import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

export const projectsRouter = Router();

projectsRouter.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC')
    .all();
  res.json(rows);
});

projectsRouter.post('/', (req, res) => {
  const { name, code } = req.body;
  if (!name || typeof code !== 'string') {
    return res.status(400).json({ error: 'name and code are required' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO projects (id, name, code, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, name, code, now, now);
  res.status(201).json({ id, name, code, created_at: now, updated_at: now });
});

projectsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

projectsRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const name = req.body.name ?? existing.name;
  const code = typeof req.body.code === 'string' ? req.body.code : existing.code;
  const now = new Date().toISOString();
  db.prepare('UPDATE projects SET name = ?, code = ?, updated_at = ? WHERE id = ?').run(
    name,
    code,
    now,
    req.params.id,
  );
  res.json({ ...existing, name, code, updated_at: now });
});

projectsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});
