import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { projectsRouter } from './routes/projects.js';
import { recordingsRouter } from './routes/recordings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteDist = path.join(__dirname, '..', '..', 'website-dist');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use('/api/projects', projectsRouter);
app.use('/api/recordings', recordingsRouter);

app.use(express.static(websiteDist));

const port = process.env.PORT || 4025;
app.listen(port, () => {
  console.log(`tidalWaves server listening on port ${port}`);
});
