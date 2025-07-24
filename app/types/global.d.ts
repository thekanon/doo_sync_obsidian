// JSDOM Window type extension for DOMPurify compatibility
declare module 'jsdom' {
  interface DOMWindow {
    trustedTypes?: unknown;
  }
}

// Type override for DOMPurify JSDOM compatibility
declare global {
  namespace DOMPurify {
    interface WindowLike {
      [key: string]: unknown;
    }
  }
}

export {};