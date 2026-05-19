import confetti from 'canvas-confetti'

function completionKey(goalId) {
  return `atomquest:goal-completed:${goalId}`
}

export function shouldFireGoalCompletionConfetti({ goalId, previousProgress, nextProgress }) {
  if (!goalId || Number(previousProgress || 0) >= 100 || Number(nextProgress || 0) < 100) {
    return false
  }

  const key = completionKey(goalId)
  if (sessionStorage.getItem(key)) {
    return false
  }

  sessionStorage.setItem(key, 'true')
  return true
}

export function fireGoalCompletionConfetti() {
  const common = {
    particleCount: 24,
    spread: 42,
    ticks: 120,
    gravity: 0.9,
    scalar: 0.68,
    colors: ['#4f46e5', '#6366f1', '#94a3b8', '#e2e8f0'],
    disableForReducedMotion: true,
  }

  confetti({
    ...common,
    origin: { x: 0.42, y: 0.72 },
    angle: 58,
  })
  confetti({
    ...common,
    origin: { x: 0.58, y: 0.72 },
    angle: 122,
  })
}
