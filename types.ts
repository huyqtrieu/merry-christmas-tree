
export interface AsciiConfig {
  density: 'low' | 'medium' | 'high';
  cellSize: number;
  useColor: boolean;
}

export interface TreeState {
  lightsOn: boolean;
  autoRotate: boolean;
  celebrationMode: boolean;
  reducedMotion: boolean;
}

export interface AsciiResult {
  text: string;
  canvas: HTMLCanvasElement;
}
