/* What every khabo mini game gets and gives back. The frame (host.tsx) owns the canvas size, the start and
   game-over cards, the score, the best score, pausing and input; a game only draws and plays.

   Games are built with three.js (3D, low-poly, flat solid colours: no glow, no shiny gradients). Each game module
   default-exports a GameFactory. Keep them self-contained: no network requests except the brand logo (a same-site
   image), so they also work offline. */

/** whose colours and logo the game wears. On the table menu this is that restaurant only, never another one.
    With no logo, draw `mono` (the restaurant's initials) or, with neither, khabo's own plate mark */
export type Brand = {
  deep: string;      // main dark colour (e.g. '#123B28' for khabo green)
  accent: string;    // bright colour (e.g. '#E0A42E' marigold)
  logo?: string | null; // same-site image URL (svg or png) of the restaurant's logo
  mono?: string;     // initials when there is no logo
  name?: string;     // the restaurant's name, for a sign
};

export type GameOpts = {
  canvas: HTMLCanvasElement;
  brand: Brand;
  /** the page is in dark mode: pick a night palette (the game may also read this only at start) */
  dark: boolean;
  /** the person asked for less motion: no camera shake, gentler effects (the game still plays) */
  reduced: boolean;
  /** call whenever the score changes */
  onScore: (n: number) => void;
  /** call once when the run ends, with the final score */
  onOver: (score: number) => void;
};

export type GameApi = {
  /** a new run from zero (also after game over) */
  start: () => void;
  /** stop the loop (tab hidden, card shown, scrolled away) and carry on later */
  pause: () => void;
  resume: () => void;
  /** css pixel size of the canvas box; the game sets the renderer size and pixel ratio (cap it at 2) */
  resize: (w: number, h: number) => void;
  /** pointer and keys, already translated by the frame. x and y are 0..1 across the canvas.
      'press' = tap / click / Space / Up / Enter; 'move' = finger or mouse position (drag);
      'left' / 'right' = arrow keys held down (down = true) or let go (down = false) */
  input: (e: { type: 'press' } | { type: 'move'; x: number; y: number } | { type: 'left' | 'right'; down: boolean }) => void;
  /** free the GPU and stop everything */
  destroy: () => void;
};

export type GameFactory = (o: GameOpts) => GameApi;

export type GameId = 'rickshaw' | 'fuchka' | 'cha';
