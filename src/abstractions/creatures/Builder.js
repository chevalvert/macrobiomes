/* global APP */
import Creature from 'abstractions/Creature'
import Pattern from 'abstractions/Pattern'
import { randomOf } from 'controllers/Prng'

export default class Builder extends Creature {
  get color () {
    return 'white'
  }

  constructor (...params) {
    super(...params)

    this.pattern = new Pattern(
      this.renderer.getContext('trace'),
      this.pattern.string || randomOf(APP.scene.patterns),
      this.pattern.colors || randomOf(APP.scene.palettes)
    )
  }

  render (...args) {
    super.render(...args)

    this.renderer.draw(args[0].trace || 'trace', ctx => {
      ctx.save()
      ctx.translate(this.center[0], this.center[1])
      ctx.clip(this.path)
      this.pattern.fill(ctx, -this.center[0], -this.center[1])
      ctx.restore()
    })
  }
}
