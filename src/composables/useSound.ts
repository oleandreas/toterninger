let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function playDiceSound() {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  // Soft marimba-like "tock tock" — gentle wooden taps
  const notes = [520, 620, 490, 580]
  for (let i = 0; i < notes.length; i++) {
    const offset = i * 0.09
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(notes[i], now + offset)
    osc.frequency.exponentialRampToValueAtTime(notes[i] * 0.8, now + offset + 0.12)

    gain.gain.setValueAtTime(0.06, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.16)
  }

  // Soft chime at the end
  const chime = ctx.createOscillator()
  const chimeGain = ctx.createGain()
  chime.type = 'sine'
  chime.frequency.setValueAtTime(880, now + 0.4)
  chime.frequency.exponentialRampToValueAtTime(660, now + 0.7)
  chimeGain.gain.setValueAtTime(0.04, now + 0.4)
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
  chime.connect(chimeGain)
  chimeGain.connect(ctx.destination)
  chime.start(now + 0.4)
  chime.stop(now + 0.8)
}

export function playTurnSound() {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  // Two-tone bell — friendly "your turn" announcement (E5 then A5)
  const tones: Array<{ freq: number; offset: number }> = [
    { freq: 660, offset: 0 },
    { freq: 880, offset: 0.18 },
  ]
  for (const t of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(t.freq, now + t.offset)
    gain.gain.setValueAtTime(0.0001, now + t.offset)
    gain.gain.exponentialRampToValueAtTime(0.18, now + t.offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.offset + 0.55)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + t.offset)
    osc.stop(now + t.offset + 0.6)
  }
}
