export type GameState = 'intro' | 'playing' | 'gameover' | 'cleared';

export interface GameCallbacks {
  onStateChange: (state: GameState) => void;
  onHpUpdate: (playerHpPct: number, bossHpPct: number) => void;
}

export interface Point {
  x: number;
  y: number;
}
