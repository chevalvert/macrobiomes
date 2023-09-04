/* global APP */

import { Howl } from 'howler'
import Prng from 'controllers/Prng'

let loaded = false
let sounds = []
let sound = null

export function random () {
  sound = Prng.randomOf(sounds)
}

export function play () {
  if (!sound) return
  sound.stop()
  sound.play()
}

export function stop () {
  if (sound) sound.stop()
}

export async function load (sources = APP.gamepad.sounds) {
  if (loaded) return

  sounds = []
  for (const src of sources) {
    const h = new Howl({ src: [src] })
    await h.load()
    sounds.push(h)
  }

  loaded = true
}

export default { random, play, stop, load }
