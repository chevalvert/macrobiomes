import Store from 'store'
import { Component } from 'utils/jsx'
import { writable, not, localStored } from 'utils/state'

import Pattern from 'abstractions/Pattern'

import { randomName } from 'controllers/Prng'
import Population from 'controllers/Population'
import WebSocketServer from 'controllers/WebSocketServer'

import Button from 'components/Button'
import Renderer from 'components/Renderer'

import IconVisible from 'iconoir/icons/eye-empty.svg'
import IconHidden from 'iconoir/icons/eye-off.svg'
import IconSend from 'iconoir/icons/fast-arrow-up.svg'

const RENDERER_SCALE = 3
const PATTERN_COLS = 15
const COLORS = [
  '#ff528c',
  '#ff8c41',
  '#ffe448',
  '#54db87',
  '#00d7e9',
  '#968ae9',
  '#bbb6c1'
]

export default class CreaturePainter extends Component {
  beforeRender () {
    this.handleTick = this.handleTick.bind(this)
    this.handleGenerate = this.handleGenerate.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleSend = this.handleSend.bind(this)
    this.handleName = this.handleName.bind(this)

    this.state = {
      value: localStored('1-', 'painter-pattern-value'),
      name: writable(randomName()),
      creature: writable(),
      pattern: writable(),

      showCreature: writable(false) // WIP
    }
  }

  template (props, state) {
    return (
      <main
        id='CreaturePainter'
        class='creature-painter'
        store-class-show-creature={state.showCreature}
      >
        <div class='creature-painter__renderer'>
          <Renderer
            width={600}
            height={600}
            ref={this.ref('renderer')}
            event-click={this.handleGenerate}
          />

          <div class='toggle'>
            <Button icon={IconHidden} store-disabled={not(state.showCreature)} event-click={() => state.showCreature.toggle()} />
            <Button icon={IconVisible} store-disabled={state.showCreature} event-click={() => state.showCreature.toggle()} />
          </div>

          <ul
            ref={this.ref('palette')}
            class='creature-painter__palette'
          >
            <li data-name='black'>-</li>
            {
              COLORS.map((hex, i) => (
                <li
                  style={`--color: ${hex}`}
                  data-name={hex}
                >
                  {i}
                </li>
              ))
            }
            <li data-name='random' ref={this.refArray('randoms')}>R</li>
          </ul>
        </div>

        <div class='creature-painter__toolbar'>
          <input
            type='text'
            ref={this.ref('name')}
            value={state.name.get()}
            event-input={this.handleName}
          />

          <div class='flexgroup'>
            <div
              contentEditable
              ref={this.ref('input')}
              event-input={this.handleInput}
            >
              {state.value.get()}
            </div>

            <Button
              icon={IconSend}
              label='envoyer'
              class='button--send'
              ref={this.ref('buttonSend')}
              store-disabled={not(state.showCreature)}
              event-click={this.handleSend}
            />
          </div>
        </div>
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)

    // Wait until mount so that renderer is instanciated
    this.handleGenerate()
    this.handleInput()
  }

  handleTick () {
    for (const el of this.refs.randoms) {
      if (Store.raf.frameCount.current % 10 !== 0) continue
      el.dataset.index = (+(el.dataset.index) + 1) % COLORS.length || 0
      el.style.setProperty('--color', COLORS[+el.dataset.index])
    }

    this.refs.renderer.clear({ force: true })

    const creature = this.state.creature.get()
    if (!creature) return

    // Render background
    this.refs.renderer.draw('trace', context => {
      context.save()
      context.translate((context.canvas.width * context.canvas.resolution) / 2, (context.canvas.height * context.canvas.resolution) / 2)
      context.scale(RENDERER_SCALE, RENDERER_SCALE)
      context.translate(-(context.canvas.width * context.canvas.resolution) / 2, -(context.canvas.height * context.canvas.resolution) / 2)
      this.state.pattern.current.fill(context)
      context.restore()
    })

    // Render creature

    creature.position = [
      (this.refs.renderer.props.width - creature.size) / 2,
      (this.refs.renderer.props.height - creature.size) / 2
    ]

    this.refs.renderer.forEachLayer((canvas, context) => {
      context.save()
      context.translate((canvas.width * canvas.resolution) / 2, (canvas.height * canvas.resolution) / 2)
      context.scale(RENDERER_SCALE, RENDERER_SCALE)
      context.translate(-(canvas.width * canvas.resolution) / 2, -(canvas.height * canvas.resolution) / 2)
    })

    creature.render({
      showStroke: true,
      lineWidth: 1,
      trace: 'creatures'
    })

    this.refs.renderer.forEachLayer((canvas, context) => context.restore())
  }

  handleInput (e) {
    const value = this.refs.input.innerText
    this.state.value.set(this.refs.input.innerText)
    const pattern = new Pattern(
      this.refs.renderer.getContext('trace'),
      value,
      COLORS,
      {
        wrapAfter: PATTERN_COLS,
        buildMode: 'fast'
      }
    )

    this.state.pattern.set(pattern)
    this.state.creature.update(creature => {
      if (!creature) return
      creature.pattern = pattern
    })
  }

  handleGenerate () {
    this.state.creature.set(Population.create({
      type: 'Builder',
      size: 150,
      speed: 2,
      pattern: this.state.pattern.get()
    }))
  }

  handleName (e) {
    this.state.name.set(e.target.value)
  }

  async handleSend () {
    WebSocketServer.send('creature', {
      from: 'creature-draw',
      creature: {
        ...this.state.creature.current.toJSON(),
        uid: this.state.name.get()
      }
    })

    this.refs.buttonSend.animate()
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
