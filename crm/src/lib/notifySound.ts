// Short two-tone chime, synthesized with the Web Audio API so no audio
// asset needs to be shipped/hosted. Browsers block audio until the page has
// had some user interaction — in practice that's already happened by the
// time a lead comes in, since the user is logged in and clicking around.

let audioCtx: AudioContext | null = null
let lastPlayedAt = 0

export function playLeadChime() {
  // Debounce so a bulk CSV import (many INSERTs in a burst) doesn't fire a
  // storm of dings — at most one chime per 1.5s.
  const now = Date.now()
  if (now - lastPlayedAt < 1500) return
  lastPlayedAt = now

  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const ctx = audioCtx
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.setValueAtTime(1108, t + 0.12)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  } catch (err) {
    console.error('Failed to play lead chime:', err)
  }
}
