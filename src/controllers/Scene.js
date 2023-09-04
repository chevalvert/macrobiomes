/* global APP */
import Store from 'store'

export async function setup () {}

export function update () {
  const renderer = Store.renderer.instance.get()

  const debug = Store.renderer.debug.get()
  const now = Date.now()

  renderer.clear()

  for (const creature of Store.population.content.get()) {
    const showStroke = debug || creature.timestamp + (APP.scene.displayNewCreature || -1) > now
    creature.update()
    creature.render({ showStroke, showName: showStroke })
  }
}

export function clear () {
  const renderer = Store.renderer.instance.get()
  if (renderer) renderer.clear({ force: true })
}

export default { setup, update, clear }
