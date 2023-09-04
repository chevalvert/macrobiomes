/* global APP */
import Store from 'store'
import Emitter from 'tiny-emitter'

let index
const emitter = new Emitter()

export const INTERNAL_MAPPING = [
  'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right',
  'Start', 'Back', 'Axis-Left', 'Axis-Right',
  'LB', 'RB', 'Power', 'A', 'B', 'X', 'Y'
]

export const IGNORED = ['B']

const events = {}
function emitDebounced (name) {
  if (!events[name]) events[name] = { current: true, previous: undefined }

  events[name].current = true
  if (events[name].current !== events[name].previous) {
    if (APP.gamepad?.keyMapping?.debug) console.log('[GAMEPAD]', name)
    emitter.emit(name)
    emitter.emit('keypress')
  }
}

if (APP.gamepad?.keyMapping.debug) {
  window.addEventListener('keydown', e => {
    const arrow = ((e.key.match(/Arrow(.*)/) || [])[1] || '').toLowerCase()
    if (arrow !== '') return emitDebounced(arrow)

    for (const [key, btn] of Object.entries(APP.gamepad.keyMapping.debug)) {
      if (e.key === key) emitDebounced(btn)
    }
  })
}

function tick () {
  const gamepad = navigator.getGamepads()[index]
  if (!gamepad) return

  // Cleanup debounce
  for (const name in events) events[name].current = false

  // Try to emit events
  if (gamepad.axes[0] < -0.5) emitDebounced('left')
  if (gamepad.axes[0] > 0.5) emitDebounced('right')
  if (gamepad.axes[1] < -0.5) emitDebounced('up')
  if (gamepad.axes[1] > 0.5) emitDebounced('down')
  for (let index = 0; index < gamepad.buttons.length; index++) {
    if (IGNORED.includes(INTERNAL_MAPPING[index])) continue
    if (!gamepad.buttons[index].pressed) continue
    emitDebounced(INTERNAL_MAPPING[index])
  }

  // Store state for next debounce
  for (const name in events) events[name].previous = events[name].current
}

export default {
  on: emitter.on.bind(emitter),
  once: emitter.once.bind(emitter),
  off: emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter),
  bind: () => {
    Store.raf.frameCount.subscribe(tick)
    window.addEventListener('gamepadconnected', e => {
      index = e.gamepad.index
    })
  }
}
