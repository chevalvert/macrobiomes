/* global APP */

import Store from 'store'
import { randomOf } from 'controllers/Prng'

import Creature from 'abstractions/Creature'
import Builder from 'abstractions/creatures/Builder'
import Restorer from 'abstractions/creatures/Restorer'
import Shifter from 'abstractions/creatures/Shifter'

const CREATURES = { Builder, Restorer, Shifter }

export function create ({ type, ...params } = {}) {
  return new (CREATURES[type] || Creature)(params)
}

export function createRandomCreature (distribution = Store.population.initialTypeDistribution.get()) {
  return create({
    shape: 'blob',
    animated: true,
    type: randomOf(distribution),
    size: randomOf(Store.population.initialSizeDistribution.get())
  })
}

export function add ({ from, creature } = {}) {
  // Interpret non-creature inputs as creature parameters (used by ws)
  if (!(creature instanceof Creature)) creature = create(creature)

  if (APP.gamepad.geoMapping[from]) {
    creature.position = [...APP.gamepad.geoMapping[from].position].map((v, i) => {
      const [, value, unit = 'px'] = String(v).match(/([\d.+-]*)(%?)/)

      if (unit === 'px') return parseFloat(value)
      if (unit === '%') return parseFloat(value) / 100 * Store.renderer.instance.current.props[['width', 'height'][i]]
      return v
    })
  }

  Store.population.content.update(population => {
    population.push(creature)
    if (population.length > Store.population.maxLength.current) population.shift()
  }, true)
}

export function clear () {
  Store.population.content.set([])
}

export function randomize () {
  for (let i = 0; i < Store.population.maxLength.get(); i++) {
    const creature = createRandomCreature()
    add(creature)
  }
}

export default {
  add,
  clear,
  create,
  createRandomCreature,
  randomize
}
