const base = '/api';

async function request(path, options) {
  const res = await fetch(`${base}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const listProjects = () => request('/projects');

export const getProject = (id) => request(`/projects/${id}`);

export const createProject = (name, code) =>
  request('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code }),
  });

export const updateProject = (id, patch) =>
  request(`/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' });

export const listRecordings = (projectId) =>
  request(`/recordings${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''}`);

export const deleteRecording = (id) => request(`/recordings/${id}`, { method: 'DELETE' });

export async function uploadRecording(blob, { projectId, durationSec }) {
  const form = new FormData();
  form.append('audio', blob, 'recording.wav');
  if (projectId) form.append('project_id', projectId);
  if (durationSec) form.append('duration_sec', String(durationSec));
  const res = await fetch(`${base}/recordings`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export const recordingDownloadUrl = (id) => `${base}/recordings/${id}/download`;
