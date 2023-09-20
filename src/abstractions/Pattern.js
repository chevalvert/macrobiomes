import { randomOf } from 'controllers/Prng'

const CACHE = new Map()

// Helper to preload all patterns at launch, avoiding temporary freezes during runtime
export function buildCache (ctx, patterns, palettes) {
  return {
    target: patterns.length * palettes.length + 1 + Pattern.restorer.patterns.length,
    generator: (function * () {
      yield new Pattern(ctx)
      for (const pattern of patterns) {
        for (const palette of palettes) {
          yield new Pattern(ctx, pattern, palette)
        }
      }

      for (const pattern of Pattern.restorer.patterns) {
        yield new Pattern(ctx, pattern, Pattern.restorer.palette)
      }
    })()
  }
}

export default class Pattern {
  static get restorer () {
    return {
      patterns: ['R', 'RR', 'RRR', 'RRRR'],
      palette: [
        ...new Array(90).fill('black'),
        ...new Array(10).fill('transparent')
      ]
    }
  }

  constructor (ctx, string = 'T', colors = [], {
    wrapAfter = 1337, // For better looking patterns, always use odd number of cols
    buildMode = 'complete' // 'fast|complete'
  } = {}) {
    this.ctx = ctx

    this.string = string
    this.pattern = this.string.split('')

    this.colors = colors
    this.wrapAfter = wrapAfter
    this.buildMode = buildMode

    this.uid = string + '__' + colors.join('_')

    this.canvas = CACHE.get(this.uid)
    if (!this.canvas) {
      const u = ctx.canvas.resolution || 1

      this.canvas = document.createElement('canvas')
      this.canvas.width = ctx.canvas.width * u
      this.canvas.height = ctx.canvas.height * u

      const context = this.canvas.getContext('2d')
      context.imageSmoothingEnabled = false

      switch (this.buildMode) {
        case 'fast': {
          const canvas = document.createElement('canvas')
          canvas.width = this.wrapAfter
          canvas.height = this.wrapAfter

          if (canvas.width % 2 === 0) canvas.width += 1
          if (canvas.height % 2 === 0) canvas.height += 1

          // OMG I have no time for this
          let magic = 0
          if (string.length === 2) magic = 1
          if (string.length === 3) magic = 0
          if (string.length === 4) magic = 3
          if (string.length === 5) magic = 0
          if (string.length === 6) magic = 3
          if (string.length === 7) magic = 1
          if (string.length === 8) magic = -1
          if (string.length === 9) magic = 0
          // At least there is a pattern emerging…
          if (string.length > 9) magic = this.wrapAfter - string.length

          canvas.width -= magic
          canvas.height -= magic

          const ctx = canvas.getContext('2d')

          for (let i = 0; i < canvas.width; i++) {
            for (let j = 0; j < canvas.height; j++) {
              ctx.fillStyle = this.#getColor(i, j)
              ctx.fillRect(i, j, 1, 1)
            }
          }

          context.scale(u, u)
          context.fillStyle = context.createPattern(canvas, 'repeat')
          context.fillRect(0, 0, context.canvas.width / u, context.canvas.height / u)
          break
        }

        default:
        case 'complete': {
          for (let i = 0; i < context.canvas.width; i++) {
            for (let j = 0; j < context.canvas.height; j++) {
              context.fillStyle = this.#getColor(i, j)
              context.fillRect(i * u, j * u, u, u)
            }
          }
          break
        }
      }

      CACHE.set(this.uid, this.canvas)
    }
  }

  isEmpty () {
    return !this.colors.filter(c => !['black', 'transparent', '#000000'].includes(c)).length
  }

  fill (ctx, i = 0, j = 0, width = this.canvas.width, height = this.canvas.height) {
    ctx.drawImage(this.canvas, i, j, width, height)
  }

  #getColor (i, j) {
    const index = i + j * this.wrapAfter
    const next = this.pattern[index % this.pattern.length]

    // Decode next symbol
    if (next === 'R') return randomOf(this.colors)
    if (next === 'T') return 'transparent'
    return this.colors[next % this.colors.length] || 'black'
  }

  toJson () {
    return {
      string: this.string,
      colors: this.colors,
      wrapAfter: this.wrapAfter,
      buildMode: this.buildMode
    }
  }
}
