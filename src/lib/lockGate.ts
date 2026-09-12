type Listener = () => void;

let depth = 0;
const listeners = new Set<Listener>();

export function isLockSuppressed(): boolean {
  return depth > 0;
}

export function onLockSuppressChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Native sheets (Face ID, PIN, galería, compartir) ponen la app en inactive. No hay que sellar el archivo entonces. */
export async function suppressAutoLock<T>(fn: () => Promise<T>): Promise<T> {
  depth += 1;
  listeners.forEach((listener) => listener());
  try {
    return await fn();
  } finally {
    depth = Math.max(0, depth - 1);
    listeners.forEach((listener) => listener());
  }
}
