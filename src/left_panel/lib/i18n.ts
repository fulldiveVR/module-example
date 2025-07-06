declare const window: {
  loadTimeData?: {
    getString: (key: string) => string
  }
}

export function getLocalizedString(key: string, defaultText: string): string {
  return window.loadTimeData?.getString(key) ?? defaultText
}