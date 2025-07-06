/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    chrome?: {
      send?: (channel: string, args: any[]) => void
    }
    aiwize_applications?: any
  }
}

import type { Axios } from 'axios';
import axios from 'axios';

const baseURL = 'http://localhost:22003';

const getInstanceApi = (url?: string): Axios => {
  if (!url) {
    throw new Error('API backend is not set');
  }

  const api = axios.create({
    baseURL: url,
    timeout: 4000,
    withCredentials: true,
  });

  return api;
};


export class BrowserBackend {

  openLink(url: string) {
    window?.chrome?.send?.("aiwize_applications.openLink", [url])
  }
}

export function useBackend() {
  return new BrowserBackend()
}

export const api = getInstanceApi(baseURL);
