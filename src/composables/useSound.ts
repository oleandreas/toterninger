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

  // Route everything through a soft limiter so the layered hits stay punchy
  // without clipping.
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.9, now)
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.setValueAtTime(-10, now)
  comp.ratio.setValueAtTime(12, now)
  master.connect(comp)
  comp.connect(ctx.destination)

  // 1) Deep cinematic impact — a low tone that slams down in pitch...
  const boom = ctx.createOscillator()
  const boomGain = ctx.createGain()
  boom.type = 'sine'
  boom.frequency.setValueAtTime(150, now)
  boom.frequency.exponentialRampToValueAtTime(38, now + 0.5)
  boomGain.gain.setValueAtTime(0.0001, now)
  boomGain.gain.exponentialRampToValueAtTime(0.55, now + 0.02)
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95)
  boom.connect(boomGain)
  boomGain.connect(master)
  boom.start(now)
  boom.stop(now + 1)

  // ...reinforced by a filtered noise "thud"
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.setValueAtTime(500, now)
  noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.35)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.4, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(master)
  noise.start(now)
  noise.stop(now + 0.4)

  // 2) Three ominous descending brass stabs — "dun … dun … DUN" — each
  // louder and lower than the last, doubled with detuned saws for weight.
  const stabs = [
    { freq: 196.0, offset: 0.32 },  // G3
    { freq: 155.56, offset: 0.66 }, // D#3
    { freq: 116.54, offset: 1.0 },  // A#2 — the final blow
  ]
  for (let i = 0; i < stabs.length; i++) {
    const s = stabs[i]
    const isFinal = i === stabs.length - 1
    const vol = 0.14 + i * 0.06
    const tail = isFinal ? 0.9 : 0.4
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(s.freq, now + s.offset)
      osc.frequency.exponentialRampToValueAtTime(s.freq * 0.94, now + s.offset + tail)
      osc.detune.setValueAtTime(detune, now + s.offset)
      g.gain.setValueAtTime(0.0001, now + s.offset)
      g.gain.exponentialRampToValueAtTime(vol, now + s.offset + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, now + s.offset + tail)
      osc.connect(g)
      g.connect(master)
      osc.start(now + s.offset)
      osc.stop(now + s.offset + tail + 0.05)
    }
  }

  // 3) A sustained low drone of dread under the final blow
  const drone = ctx.createOscillator()
  const droneGain = ctx.createGain()
  drone.type = 'triangle'
  drone.frequency.setValueAtTime(58, now + 1.0)
  droneGain.gain.setValueAtTime(0.0001, now + 1.0)
  droneGain.gain.exponentialRampToValueAtTime(0.22, now + 1.12)
  droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1)
  drone.connect(droneGain)
  droneGain.connect(master)
  drone.start(now + 1.0)
  drone.stop(now + 2.15)
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
