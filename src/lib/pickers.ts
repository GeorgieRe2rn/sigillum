import { suppressAutoLock } from './lockGate';

let inFlight = false;

export function isPickerInProgressError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error ?? '');
  return /PickingInProgress|picking in progress|already in progress/i.test(text);
}

/** iOS only allows one native picker at a time. */
export async function withPickerLock<T>(fn: () => Promise<T>): Promise<T | null> {
  if (inFlight) return null;
  inFlight = true;
  try {
    return await suppressAutoLock(fn);
  } catch (error) {
    if (isPickerInProgressError(error)) return null;
    throw error;
  } finally {
    inFlight = false;
  }
}
