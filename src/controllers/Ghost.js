/* global APP */

import Population from 'controllers/Population'
import { randomInt } from 'missing-math'
import WebSocketServer from 'controllers/WebSocketServer'

let timer
let isRunning = false

WebSocketServer.content.subscribe(reset)

function tick () {
  if (!APP.gamepad.ghost) return

  const next = randomInt(APP.gamepad.ghost[0], APP.gamepad.ghost[1])
  timer = window.setTimeout(() => {
    const data = {
      from: 'ghost',
      creature: Population.createRandomCreature()
    }

    WebSocketServer.send('creature', data)
    Population.add(data)

    tick()
  }, next)
}

export function start () {
  if (isRunning) return
  isRunning = true
  tick()
}

export function reset () {
  if (!isRunning) return
  stop()
  start()
}

export function stop () {
  isRunning = false
  window.clearTimeout(timer)
}

export default { start, reset, stop }
