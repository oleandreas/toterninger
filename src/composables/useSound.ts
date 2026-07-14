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

export function playRobberSound() {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  // Ominous descending "dun-dun" brass stabs — the robber is coming
  const hits: Array<{ freq: number; offset: number }> = [
    { freq: 164.81, offset: 0 },    // E3
    { freq: 123.47, offset: 0.3 },  // B2
  ]
  for (const h of hits) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(h.freq, now + h.offset)
    osc.frequency.exponentialRampToValueAtTime(h.freq * 0.92, now + h.offset + 0.35)
    gain.gain.setValueAtTime(0.0001, now + h.offset)
    gain.gain.exponentialRampToValueAtTime(0.16, now + h.offset + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + h.offset + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + h.offset)
    osc.stop(now + h.offset + 0.45)
  }

  // Low rumble underneath for tension
  const rumble = ctx.createOscillator()
  const rumbleGain = ctx.createGain()
  rumble.type = 'triangle'
  rumble.frequency.setValueAtTime(55, now)
  rumbleGain.gain.setValueAtTime(0.0001, now)
  rumbleGain.gain.exponentialRampToValueAtTime(0.12, now + 0.05)
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
  rumble.connect(rumbleGain)
  rumbleGain.connect(ctx.destination)
  rumble.start(now)
  rumble.stop(now + 0.85)
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
