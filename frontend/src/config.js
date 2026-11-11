// Dynamic API and Asset Configuration
// In development: defaults to 'http://localhost:5000'
// In production (e.g. datayugsociety.org/interns): defaults to '/interns' or ''
export const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : (import.meta.env.DEV ? 'http://localhost:5000' : '/interns');

/**
 * Returns the full or relative URL for uploaded files/documents/images.
 * Ensures compatibility across both local dev and subpath production hosting.
 */
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE) {
    return `http://localhost:5000${cleanPath}`;
  }
  
  return `${API_BASE}${cleanPath}`;
};
