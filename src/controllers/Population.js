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

export function add (creature) {
  // Interpret non-creature inputs as creature parameters (used by ws)
  if (!(creature instanceof Creature)) creature = create(creature)

  // TODO creature starting position based on gamepad mapped position on screen
  // creature.position = []

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
