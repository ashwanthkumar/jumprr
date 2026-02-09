import './ui/styles/main.css';
import { GameEngine } from './engine/GameEngine';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const engine = new GameEngine(canvas);
engine.start();
