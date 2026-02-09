# Jumprr

A web-based fitness infinite runner game that uses your webcam and MediaPipe pose detection to track real jumps. Jump straight, left, or right to control a low-poly character running through an endless procedural track.

[**Play Now**](https://ashwanthkumar.github.io/jumprr/)

## How It Works

- Stand in front of your webcam with your full body visible
- Physically jump to make the character jump over barriers
- Jump left or right to switch lanes and dodge walls
- Session timer, rest breaks, and health recommendations keep your workout safe

## Tech Stack

- **Three.js** - 3D rendering with low-poly procedural character
- **MediaPipe Pose Landmarker** - Webcam-based body tracking (33 landmarks)
- **Vite + TypeScript** - Build tooling

## Running Locally

```bash
npm install
npm run dev
```

## License

[MIT](LICENSE)
