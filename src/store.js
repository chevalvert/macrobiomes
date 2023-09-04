/* global APP */
import { localStored, readable, writable } from 'utils/state'

const Store = {
  renderer: {
    instance: undefined, // Will be set by <App> when mounted
    debug: localStored(false, 'debug'),

    layers: readable({
      trace: {
        resolution: 1 / APP.renderer.scale,
        roundTo: APP.renderer.scale,
        clear: false,
        style: {
          backgroundColor: 'black'
        }
      },

      creatures: {
        resolution: 1 / APP.renderer.scale,
        roundTo: APP.renderer.scale,
        clear: true
      },

      contours: {
        resolution: 1,
        roundTo: APP.renderer.scale,
        clear: true
      },

      text: {
        resolution: 1,
        clear: true
      }
    })
  },

  // Public store for the Population controller
  population: {
    maxLength: readable(APP.population.maxLength),
    initialTypeDistribution: readable(APP.population.initialTypeDistribution),
    initialSizeDistribution: readable(APP.population.initialSizeDistribution),
    content: writable([])
  },

  // Public store for the RAF controller
  raf: {
    fps: readable(APP.renderer.fps || 60),
    isRunning: writable(true),
    frameCount: writable(0)
  }
}

window.Store = Store
export default Store
