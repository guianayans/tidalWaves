import path from 'node:path';
import { recordingsDir } from './db.js';

export function recordingPath(id, ext) {
  return path.join(recordingsDir, `${id}.${ext}`);
}
