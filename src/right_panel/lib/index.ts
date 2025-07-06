/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    chrome?: {
      send?: (channel: string, args: any[]) => void
    }
    aiwize_applications?: {
      onPageScreenshotsReceived?: (items: string[]) => void
      onPageContentReceived?: (success: boolean, content: string) => void
      onPageInfoReceived?: (link: string, title: string) => void
    }
  }
}

export const normalizeUrl = (url: string) => {
  if (!url.endsWith("/")) {
    return url + "/"
  }

  return url
}

export class BrowserBackend {

  async getPageContent(): Promise<any> {
    return new Promise(resolve => {
      window.aiwize_applications ??= {}
      window.aiwize_applications.onPageContentReceived = (success, content) => {
        console.log("Callback onPageContentReceived called", success, content)
        resolve(content)
      }
      window?.chrome?.send?.("aiwize_applications.getPageContent", [])
    })
  }
  async getPageInfo(): Promise<any> {
    return new Promise(resolve => {
      window.aiwize_applications ??= {}
      window.aiwize_applications.onPageInfoReceived = (url, title) => {
        console.log("Callback onPageContentReceived called", url, title)
        resolve([url, title])
      }
      window?.chrome?.send?.("aiwize_applications.getPageInfo", [])
    })
  }
  async getPageScreenshots(): Promise<string[]> {
    return new Promise(resolve => {
      window.aiwize_applications ??= {}
      window.aiwize_applications.onPageScreenshotsReceived = (items) => {
        console.log("Callback onPageScreenshotsReceived called", items)
        resolve(items)
      }
      window?.chrome?.send?.("aiwize_applications.getPageScreenshots", [])
    })
  }
}

export function useBackend() {
  return new BrowserBackend()
}