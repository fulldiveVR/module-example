let setter: ((msg: string | null) => void) | null = null;

export function registerErrorSetter(fn: ((msg: string | null) => void) | null) {
  setter = fn;
}

export function reportError(msg: string) {
  if (setter) {
    setter(msg);
  } else {
    console.error("Global error:", msg);
  }
} 