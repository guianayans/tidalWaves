import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import cx from '@src/cx.mjs';
import { autoEvaluateEnabled, isAutoEvaluateEnabled } from './store';

// How often we check the editor's current code for changes, and how long the
// code must stay unchanged before we auto-evaluate it. Polling the already
// up-to-date `editorRef.current.code` (kept in sync by Strudel on every
// keystroke) is simpler and less invasive than hooking into CodeMirror's
// internal change events, which aren't otherwise exposed to React here.
const POLL_MS = 150;
const DEBOUNCE_MS = 700;

export function AutoEvaluateToggle({ context }) {
  const enabledValue = useStore(autoEvaluateEnabled);
  const enabled = isAutoEvaluateEnabled(enabledValue);

  const lastSeenCode = useRef();
  const debounceTimer = useRef();

  useEffect(() => {
    if (!enabled) return;
    lastSeenCode.current = context.editorRef.current?.code;
    const interval = setInterval(() => {
      const code = context.editorRef.current?.code;
      if (code !== lastSeenCode.current) {
        lastSeenCode.current = code;
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          // Same evaluate path as clicking "update" — Strudel already handles
          // syntax errors gracefully there (shows them in the console tab)
          // instead of throwing, so no need to pre-validate here.
          context.handleEvaluate();
        }, DEBOUNCE_MS);
      }
    }, POLL_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(debounceTimer.current);
    };
  }, [enabled, context]);

  return (
    <label
      title="automatically update the pattern shortly after you stop typing"
      className={cx('px-2 flex items-center space-x-1 cursor-pointer hover:opacity-50', enabled && 'opacity-100')}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => autoEvaluateEnabled.set(e.target.checked ? 'true' : 'false')}
      />
      <span>auto</span>
    </label>
  );
}
