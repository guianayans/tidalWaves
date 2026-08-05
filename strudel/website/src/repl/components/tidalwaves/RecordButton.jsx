import { useState } from 'react';
import { useStore } from '@nanostores/react';
import cx from '@src/cx.mjs';
import { uploadRecording } from './api-client';
import { currentProjectId } from './store';

const SAMPLE_RATE = 48000;
const MAX_POLYPHONY = 1024;
const CYCLES_TO_RECORD = 8;

export function RecordButton({ context }) {
  const projectId = useStore(currentProjectId);
  const [recording, setRecording] = useState(false);

  const handleRecord = async () => {
    if (!context.started) {
      window.alert('Press play first, then record.');
      return;
    }
    setRecording(true);
    try {
      const cps = context.editorRef.current?.repl?.scheduler?.cps || 0.5;
      const durationSec = CYCLES_TO_RECORD / cps;
      const blob = await context.handleRecord(0, CYCLES_TO_RECORD, SAMPLE_RATE, MAX_POLYPHONY, true);
      await uploadRecording(blob, { projectId: projectId || undefined, durationSec });
    } catch (err) {
      console.error('[tidalwaves] recording failed', err);
      window.alert(`Recording failed: ${err.message}`);
    } finally {
      setRecording(false);
    }
  };

  return (
    <button
      onClick={handleRecord}
      disabled={recording}
      title="record to server"
      className={cx('px-2 hover:opacity-50 flex items-center space-x-1', recording && 'opacity-50 animate-pulse')}
    >
      <span>{recording ? 'recording…' : 'record'}</span>
    </button>
  );
}
