/* global APP */

// TODO creature builder for workshops

import Store from 'store'
import { render } from 'utils/jsx'
import { writable } from 'utils/state'

import { buildCache } from 'abstractions/Pattern'

import App from 'components/App'
import Splashscreen from 'components/Splashscreen'

import Gamepad from 'controllers/Gamepad'
import Ghost from 'controllers/Ghost'
import Hotkey from 'controllers/Hotkey'
import Population from 'controllers/Population'
import Raf from 'controllers/Raf'
import Scene from 'controllers/Scene'
import Stamp from 'controllers/Stamp'
import WebSocketServer from 'controllers/WebSocketServer'

/// #if DEVELOPMENT
require('webpack-hot-middleware/client?reload=true')
  .subscribe(({ reload }) => reload && window.location.reload())
/// #endif

;(async () => {
  Gamepad.bind()

  render(<App />, document.body)

  if (APP.prebuildPatternCache) {
    const progress = writable('0%')
    const splashscreen = render(<Splashscreen text={progress} />, document.body).components[0]
    const { target, generator } = buildCache(
      Store.renderer.instance.current.state.contexts.get('trace'),
      APP.scene.patterns,
      APP.scene.palettes
    )

    let i = 0
    while (!generator.next().done && i++ <= target) {
      progress.set((i / target * 100).toFixed(0) + '%')
      await new Promise(window.setTimeout)
    }

    splashscreen.destroy()
  }

  await Scene.setup()
  WebSocketServer.open(APP.remoteWebSocketServer)

  if (APP.gamepad.ghost) Ghost.start()
  Stamp.start()
  Raf.start()

  WebSocketServer.emitter.on('creature', Population.add)
  Store.raf.frameCount.subscribe(Scene.update)

  if (APP.ticksBeforeRefresh) {
    console.log(`Refreshing in ${APP.ticksBeforeRefresh} ticks !`)
    Store.raf.frameCount.subscribe(frameCount => {
      if (frameCount < APP.ticksBeforeRefresh) return
      window.location.reload()
    })
  }
})()

Gamepad.on(APP.gamepad.keyMapping.clear, () => {
  Population.clear()
  Scene.clear()
})

window.onresize = () => window.location.reload()

Hotkey('w', () => Store.renderer.debug.update(state => !state))
Hotkey('p', () => Store.raf.isRunning.update(state => !state))
