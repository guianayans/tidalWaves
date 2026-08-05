import { persistentAtom } from '@nanostores/persistent';

// Tracks which saved tidalWaves project (if any) is currently loaded in the editor,
// so the Save/Record buttons (toolbar) and the ProjectsPanel (side tab) stay in sync
// even though they're far apart in the component tree.
export const currentProjectId = persistentAtom('tidalwaves-current-project-id', '');
export const currentProjectName = persistentAtom('tidalwaves-current-project-name', '');

export function setCurrentProject(id, name) {
  currentProjectId.set(id || '');
  currentProjectName.set(name || '');
}
