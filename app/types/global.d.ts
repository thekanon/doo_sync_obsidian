// JSDOM Window type extension for DOMPurify compatibility
declare module 'jsdom' {
  interface DOMWindow extends DOMPurify.WindowLike {
    trustedTypes?: unknown;
  }
}

// Type override for DOMPurify JSDOM compatibility
declare global {
  namespace DOMPurify {
    interface WindowLike {
      [key: string]: unknown;
      document?: Document;
      DocumentFragment?: typeof DocumentFragment;
      HTMLTemplateElement?: typeof HTMLTemplateElement;
      Node?: typeof Node;
      Element?: typeof Element;
      HTMLFormElement?: typeof HTMLFormElement;
      HTMLTemplateElement?: typeof HTMLTemplateElement;
      trustedTypes?: unknown;
    }
  }
}

export {};