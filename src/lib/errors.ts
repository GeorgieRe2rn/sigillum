export function describeError(error: unknown, fallback = 'Algo salió mal.'): string {
  const text = flattenError(error);
  if (/PickingInProgress|picking in progress/i.test(text)) {
    return 'Ya hay un selector abierto. Ciérralo y vuelve a intentar.';
  }
  if (/TypedArray|digest/i.test(text)) {
    return 'No se pudo calcular la huella del archivo. Elige la foto otra vez.';
  }
  if (/origen|no está disponible|copy|Unable to copy|not readable|permission/i.test(text)) {
    return 'El archivo ya no está accesible. Vuelve a seleccionarlo.';
  }
  if (/sellado|llave|catalog/i.test(text)) {
    return 'El archivo está sellado o la llave no está en memoria. Ciérralo y ábrelo de nuevo.';
  }
  if (error instanceof Error && error.message && error.message.length < 180 && !error.message.includes('Exception')) {
    return error.message;
  }
  return fallback;
}

function flattenError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(' ');
}
