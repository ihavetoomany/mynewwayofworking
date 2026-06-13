import confetti from "canvas-confetti";

export function celebrateTaskDone() {
  const colors = ["#007a3d", "#34d399", "#ffffff", "#fbbf24", "#38bdf8"];

  confetti({
    particleCount: 70,
    spread: 65,
    startVelocity: 28,
    origin: { y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });

  confetti({
    particleCount: 30,
    angle: 60,
    spread: 45,
    origin: { x: 0, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });

  confetti({
    particleCount: 30,
    angle: 120,
    spread: 45,
    origin: { x: 1, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
}
