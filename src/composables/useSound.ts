let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function playDiceSound() {
  const ctx = getAudioContext()
  const duration = 0.4
  const now = ctx.currentTime

  // Create a burst of noise that sounds like dice rattling
  for (let i = 0; i < 6; i++) {
    const offset = i * 0.06
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(200 + Math.random() * 400, now + offset)
    osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 100, now + offset + 0.05)

    gain.gain.setValueAtTime(0.08, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.07)
  }

  // Final impact sound
  const noise = ctx.createOscillator()
  const noiseGain = ctx.createGain()
  noise.type = 'triangle'
  noise.frequency.setValueAtTime(150, now + duration - 0.08)
  noiseGain.gain.setValueAtTime(0.12, now + duration - 0.08)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  noise.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now + duration - 0.08)
  noise.stop(now + duration + 0.05)
}
