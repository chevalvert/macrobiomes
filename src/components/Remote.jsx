import Store from 'store'
import { Component } from 'utils/jsx'
import { writable } from 'utils/state'

import Gamepad from 'controllers/Gamepad'
import Population from 'controllers/Population'
import WebSocketServer from 'controllers/WebSocketServer'

import Renderer from 'components/Renderer'
import GamepadMenu from 'components/GamepadMenu'

export default class Remote extends Component {
  beforeRender () {
    this.update = this.update.bind(this)
    this.handleTick = this.handleTick.bind(this)
    this.handleSend = this.handleSend.bind(this)

    this.state = {
      gamepadValue: writable([0, 0]),
      creature: writable(undefined),
      creatureType: writable('Creature'),
      creatureBehavior: writable('Curieux')
    }
  }

  template (props, state) {
    const subentries = []
    for (const creature in Store.creatures.behaviors.get()) {
      subentries.push(Object.keys(Store.creatures.behaviors.current[creature]))
    }

    return (
      <main id='Remote' class='remote' store-data-creature={state.creatureType}>
        <Renderer
          width={400}
          height={400}
          ref={this.ref('renderer')}
        />
        <GamepadMenu
          store-value={state.gamepadValue}
          entries={[
            Object.keys(Store.creatures.types.get()),
            subentries
          ]}
        />
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)
    this.state.gamepadValue.subscribe(this.update)
    this.update()

    window.setTimeout(() => this.handleSend(), 1000)

    Gamepad.on(window.ENV.gamepad.mapping.random, this.update)
    Gamepad.on(window.ENV.gamepad.mapping.send, this.handleSend)
  }

  update () {
    const [type, behavior] = this.state.gamepadValue.get()

    this.state.creature.set(Population.create({
      type: Object.values(Store.creatures.types.current)[type],
      ...Object.values(Store.creatures.behaviors.current[Object.keys(Store.creatures.types.current)[type]])[behavior]
    }))
  }

  handleTick () {
    this.refs.renderer.clear(true)

    const creature = this.state.creature.get()
    if (!creature) return

    creature.position = [
      (this.refs.renderer.props.width - creature.size) / 2,
      (this.refs.renderer.props.height - creature.size) / 2
    ]
    creature.render({ showStroke: true })
  }

  async handleSend () {
    const creature = this.state.creature.get()
    if (!creature) return

    this.refs.renderer.base.style.animation = 'none'
    void this.refs.renderer.base.offsetHeight // eslint-disable-line no-void
    this.refs.renderer.base.style.animation = null

    WebSocketServer.send('creature', this.state.creature.current.toJSON())
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
