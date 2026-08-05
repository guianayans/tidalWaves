import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { db, recordingsDir } from '../db.js';
import { recordingPath } from '../storage.js';
import { webmToWav } from '../transcode.js';

const upload = multer({ dest: recordingsDir });

export const recordingsRouter = Router();

recordingsRouter.get('/', (req, res) => {
  const { project_id } = req.query;
  const rows = project_id
    ? db
        .prepare('SELECT * FROM recordings WHERE project_id = ? ORDER BY created_at DESC')
        .all(project_id)
    : db.prepare('SELECT * FROM recordings ORDER BY created_at DESC').all();
  res.json(rows);
});

recordingsRouter.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'audio file is required' });

  const id = randomUUID();
  const projectId = req.body.project_id || null;
  const durationSec = req.body.duration_sec ? Number(req.body.duration_sec) : null;
  const now = new Date().toISOString();

  const webmPath = recordingPath(id, 'webm');
  fs.renameSync(req.file.path, webmPath);

  let format = 'webm';
  let sizeBytes = fs.statSync(webmPath).size;

  try {
    const wavPath = recordingPath(id, 'wav');
    await webmToWav(webmPath, wavPath);
    format = 'wav';
    sizeBytes = fs.statSync(wavPath).size;
  } catch (err) {
    console.error('ffmpeg transcode failed, keeping webm only:', err.message);
  }

  db.prepare(
    `INSERT INTO recordings (id, project_id, filename, format, duration_sec, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, projectId, id, format, durationSec, sizeBytes, now);

  res.status(201).json({
    id,
    project_id: projectId,
    format,
    duration_sec: durationSec,
    size_bytes: sizeBytes,
    created_at: now,
  });
});

recordingsRouter.get('/:id/download', (req, res) => {
  const row = db.prepare('SELECT * FROM recordings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const filePath = recordingPath(row.id, row.format);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file missing' });
  res.type(row.format === 'wav' ? 'audio/wav' : 'audio/webm');
  fs.createReadStream(filePath).pipe(res);
});

recordingsRouter.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recordings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  for (const ext of ['webm', 'wav']) {
    const filePath = recordingPath(row.id, ext);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM recordings WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
