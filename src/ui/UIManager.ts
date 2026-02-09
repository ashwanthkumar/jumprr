import { GameScreen } from '../types';

export class UIManager {
  private overlay: HTMLDivElement;
  private screens = new Map<GameScreen, HTMLElement>();
  private currentScreen: GameScreen | null = null;

  constructor() {
    this.overlay = document.getElementById('ui-overlay') as HTMLDivElement;
  }

  registerScreen(id: GameScreen, element: HTMLElement): void {
    this.screens.set(id, element);
    this.overlay.appendChild(element);
  }

  showScreen(screen: GameScreen): void {
    // Hide current
    if (this.currentScreen !== null) {
      const current = this.screens.get(this.currentScreen);
      if (current) {
        current.classList.remove('active');
      }
    }

    // Show new
    const next = this.screens.get(screen);
    if (next) {
      next.classList.add('active');
    }

    this.currentScreen = screen;
  }

  hideAll(): void {
    this.screens.forEach(el => el.classList.remove('active'));
    this.currentScreen = null;
  }

  getScreen(screen: GameScreen): HTMLElement | undefined {
    return this.screens.get(screen);
  }

  shakeScreen(): void {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.classList.add('shake');
      setTimeout(() => canvas.classList.remove('shake'), 300);
    }
  }
}
