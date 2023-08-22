import { localStored, readable, writable } from 'utils/state'

const Store = {
  renderer: {
    instance: undefined, // Will be set by <App> when mounted
    debug: localStored(false, 'debug'),

    layers: readable({
      trace: {
        resolution: 1 / window.ENV.renderer.scale,
        roundTo: window.ENV.renderer.scale,
        clear: false,
        style: {
          backgroundColor: 'black'
        }
      },
      creatures: {
        resolution: 1 / window.ENV.renderer.scale,
        roundTo: window.ENV.renderer.scale,
        clear: true,
        style: {
          mixBlendMode: 'color'
        }
      },
      debug: {
        resolution: 1,
        roundTo: window.ENV.renderer.scale,
        clear: true
      }
    })
  },

  // Public store for the Population controller
  population: {
    maxLength: readable(window.ENV.population.maxLength),
    initialTypeDistribution: readable(window.ENV.population.initialTypeDistribution),
    initialSizeDistribution: readable(window.ENV.population.initialSizeDistribution),
    content: writable([])
  },

  creatures: {
    types: readable({
      builder: 'Builder',
      shifter: 'Shifter',
      restorer: 'Restorer'
    }),
    behaviors: readable({
      shifter: {
        small: { speed: 1, size: [5, 10, 10, 20, 20] },
        medium: { speed: 2, size: [30, 50, 50, 60, 70] },
        large: { speed: 4, size: [80, 100, 125] }
      },
      restorer: {
        small: { speed: 1, size: [5, 10, 10, 20, 20] },
        medium: { speed: 2, size: [50, 30, 50, 60, 70, 70] },
        large: { speed: 4, size: [80, 100, 125] }
      },
      builder: {
        small: { speed: 1, size: [5, 10, 10, 20, 20] },
        medium: { speed: 2, size: [50, 30, 50, 60, 70, 70] },
        large: { speed: 4, size: [80, 100, 125] }
      }
    })
  },

  // Public store for the RAF controller
  raf: {
    fps: readable(window.ENV.renderer.fps || 60),
    isRunning: writable(true),
    frameCount: writable(0)
  }
}

window.Store = Store
export default Store
