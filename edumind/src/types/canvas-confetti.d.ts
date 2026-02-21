declare module "canvas-confetti" {
  namespace confetti {
    interface Options {
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      particleCount?: number;
      origin?: { x?: number; y?: number };
      zIndex?: number;
      colors?: string[];
      [key: string]: unknown;
    }
  }
  function confetti(options?: confetti.Options): Promise<void> | null;
  export = confetti;
}
