/* global APP */

import Store from 'store'
import { Component } from 'utils/jsx'
import { derived, writable } from 'utils/state'
import Gamepad from 'controllers/Gamepad'
import Population from 'controllers/Population'
import Sound from 'controllers/Sound'
import WebSocketServer from 'controllers/WebSocketServer'

import Button from 'components/Button'
import Renderer from 'components/Renderer'
import GamepadMenu from 'components/GamepadMenu'

import IconSend from 'iconoir/icons/fast-arrow-up.svg'
import IconRandom from 'iconoir/icons/refresh-double.svg'

export default class Remote extends Component {
  beforeRender () {
    this.handleRandom = this.handleRandom.bind(this)
    this.handleTick = this.handleTick.bind(this)
    this.handleSend = this.handleSend.bind(this)
    this.handleGamepadMenu = this.handleGamepadMenu.bind(this)

    this.state.value = writable(null)
    this.state.creature = writable(undefined)
    this.state.creatureName = derived(this.state.creature, creature => creature && creature.uid)
  }

  template (props, state) {
    return (
      <main id='Remote' class='remote'>
        <h1 store-text={state.creatureName} />
        <div class='remote__renderer'>
          <Renderer
            width={600}
            height={600}
            ref={this.ref('renderer')}
          />
        </div>
        <Button icon={IconSend} class='button--send' ref={this.ref('buttonSend')} />
        <Button icon={IconRandom} class='button--random' ref={this.ref('buttonRandom')} />
        <GamepadMenu
          ref={this.ref('gamepadMenu')}
          entries={APP.creatures.traits}
          event-change={this.handleGamepadMenu}
        />
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)

    Gamepad.on(APP.gamepad.keyMapping.random, this.handleRandom)
    Gamepad.on(APP.gamepad.keyMapping.send, this.handleSend)
  }

  handleRandom () {
    this.handleGamepadMenu(this.state.value.get())
    this.refs.buttonRandom.animate()
  }

  handleGamepadMenu (value) {
    this.state.value.set(value)
    this.state.creature.set(Population.create(value))
  }

  handleTick () {
    this.refs.renderer.clear({ force: true })

    const creature = this.state.creature.get()
    if (!creature) return

    creature.position = [
      (this.refs.renderer.props.width - creature.size) / 2,
      (this.refs.renderer.props.height - creature.size) / 2
    ]

    this.refs.renderer.forEachLayer((canvas, context) => {
      const SCALE = 3
      context.save()
      context.translate((canvas.width * canvas.resolution) / 2, (canvas.height * canvas.resolution) / 2)
      context.scale(SCALE, SCALE)
      context.translate(-(canvas.width * canvas.resolution) / 2, -(canvas.height * canvas.resolution) / 2)
    })

    creature.render({ showStroke: true, trace: 'creatures' })
    this.refs.renderer.forEachLayer((canvas, context) => context.restore())
  }

  async handleSend () {
    const creature = this.state.creature.get()
    if (!creature) return

    this.refs.renderer.base.style.animation = 'none'
    void this.refs.renderer.base.offsetHeight // eslint-disable-line no-void
    this.refs.renderer.base.style.animation = null

    Sound.random()
    Sound.play()

    WebSocketServer.send('creature', {
      from: window.UID,
      creature: this.state.creature.current.toJSON()
    })

    this.refs.buttonSend.animate()
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
