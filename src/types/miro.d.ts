declare global {
  interface MiroSDK {
    board: {
      ui: {
        on: (event: string, callback: () => void) => Promise<void>;
      };
      viewport: {
        get: () => Promise<{ x: number; y: number; width: number; height: number }>;
      };
      experimental: {
        createMindmapNode: (options: unknown) => Promise<void>;
      };
    };
    onReady: (callback: () => void) => void;
  }

  interface Window {
    miro: MiroSDK;
  }
}

export {};
