import Store from 'store'
import { readable } from 'utils/state'
import { Component } from 'utils/jsx'
import { Noise } from 'noisejs'
import { ceilTo, floorTo, roundTo as roundToValue } from 'missing-math'
import noop from 'utils/noop'

const CACHE = new Map()
const ROUNDABLE_METHODS = [
  'arc',
  'translate',
  'drawImage',
  'fillRect',
  'fillText',
  'lineTo',
  'moveTo'
]

export default class Renderer extends Component {
  beforeRender (props) {
    this.state = {
      contexts: new Map(),
      cachedLayers: new Map(),
      noiseMap: new Noise()
    }
  }

  template (props, state) {
    return (
      <section
        id='Renderer'
        class='renderer'
        style={`--padding: ${props.padding ?? 0}px`}
      >
        {Object.entries(Store.renderer.layers.current).map(([name]) => (
          <canvas
            data-name={name}
            ref={this.refMap('canvas', name)}
          />
        ))}
      </section>
    )
  }

  afterMount () {
    this.base.style.width = this.props.width + 'px'
    this.base.style.height = this.props.height + 'px'

    this.#forEachLayers((canvas, context, { name, resolution, roundTo, style = {} }) => {
      canvas.width = this.props.width * resolution
      canvas.height = this.props.height * resolution
      canvas.style.width = this.props.width + 'px'
      canvas.style.height = this.props.height + 'px'
      canvas.resolution = 1 / resolution

      for (const [prop, value] of Object.entries(style)) {
        canvas.style[prop] = value
      }

      context = context || canvas.getContext('2d')
      context.imageSmoothingEnabled = false
      context.scale(resolution, resolution)
      context.ceil = v => context.NO_ROUND ? v : isNaN(v) ? v : ceilTo(v, roundTo)
      context.floor = v => context.NO_ROUND ? v : isNaN(v) ? v : floorTo(v, roundTo)
      context.round = v => context.NO_ROUND ? v : isNaN(v) ? v : roundToValue(v, roundTo)

      if (roundTo) {
        for (const method of ROUNDABLE_METHODS) {
          const origin = context[method]
          context[method] = (...args) => origin.call(context, ...args.map(context.round))
        }
      }
      this.state.contexts.set(name, context)
    })

    Store.renderer.instance = readable(this)
  }

  clear ({ force = false } = {}) {
    this.#forEachLayers((canvas, context, { name, clear }) => {
      if (!force && !clear) return
      context.clearRect(0, 0, canvas.width * canvas.resolution, canvas.height * canvas.resolution)
    })
  }

  cache (layerName) {
    const ctx = this.getContext(layerName)
    const canvas = document.createElement('canvas')
    canvas.width = ctx.canvas.width
    canvas.height = ctx.canvas.height
    canvas.getContext('2d').drawImage(ctx.canvas, 0, 0)
    this.state.cachedLayers.set(layerName, canvas)
  }

  getContext (layerName) {
    return this.state.contexts.get(layerName)
  }

  draw (layerName, callback) {
    const ctx = this.getContext(layerName)
    callback(ctx)
  }

  drawElement (layerName, el) {
    this.draw(layerName, ctx => {
      const style = window.getComputedStyle(el, null)
      ctx.fillStyle = style.getPropertyValue('color')
      ctx.textBaseline = 'ideographic'

      const fontSize = style.getPropertyValue('font-size')
      ctx.font = `${fontSize} Styrene`

      const { left, top } = el.getBoundingClientRect()
      ctx.fillText(el.innerText, left, top + parseInt(fontSize))
      ctx.restore()
    })
  }

  shape ({
    position,
    text = null,
    dimensions = [10, 10],
    strokeStyle = 'black',
    fillStyle = 'transparent',
    lineWidth = null,
    path
  } = {}) {
    return ctx => {
      ctx.strokeStyle = strokeStyle
      ctx.fillStyle = fillStyle
      ctx.lineWidth = lineWidth || ctx.canvas.resolution

      if (path) {
        ctx.save()
        ctx.translate(position[0], position[1])
        if (fillStyle !== 'transparent') ctx.fill(path)
        ctx.stroke(path)
        ctx.restore()
      } else {
        if (fillStyle !== 'transparent') ctx.fillRect(position[0], position[1], dimensions[0], dimensions[1])
        ctx.strokeRect(position[0], position[1], dimensions[0], dimensions[1])
      }

      if (text) {
        const padding = 5
        const fontSize = 12
        ctx.font = `${fontSize}px Styrene`

        const width = this.#measureText(text)
        const x = position[0] + padding - (ctx.lineWidth / 2)
        const y = position[1] - fontSize - padding

        ctx.fillStyle = 'black'
        ctx.fillRect(x - padding, y - padding, width + padding * 2, fontSize + padding * 2)

        ctx.fillStyle = 'white'
        ctx.fillText(text, x, y + fontSize - padding / 2)
      }
    }
  }

  noise (i, j, {
    noise = 'perlin',
    octaves = 8
  } = {}) {
    const res = 2 ** octaves
    if (!j && j !== 0) j = Store.raf.frameCount.current
    return this.state.noiseMap[noise + '2'](i / res, j / res)
  }

  #forEachLayers (callback = noop) {
    const layers = Store.renderer.layers.get()
    for (const name in layers) {
      const canvas = this.refs.canvas.get(name)
      const context = this.state.contexts.get(name)
      callback(canvas, context, { ...layers[name], name })
    }
  }

  #measureText (text, layerName = 'text') {
    const id = layerName + '__' + text
    if (CACHE.has(id)) return CACHE.get(id)

    const { width } = this.getContext(layerName).measureText(text)
    CACHE.set(id, width)
    return width
  }
}
