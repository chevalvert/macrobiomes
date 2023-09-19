import Store from 'store'
import { Component } from 'utils/jsx'
import { derived, writable } from 'utils/state'
import lastOf from 'utils/array-last'
import pathData from 'utils/points-to-pathdata'

import { randomName } from 'controllers/Prng'
import Population from 'controllers/Population'
import WebSocketServer from 'controllers/WebSocketServer'

import Button from 'components/Button'

import IconSend from 'iconoir/icons/fast-arrow-up.svg'
import IconTrash from 'iconoir/icons/trash.svg'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const COORDS_REGEX = /([a-zA-Z])\s?([0-9]+)/
const letters = index => ALPHA.charAt(index)
const toPoint = coord => {
  const [, letter, integer] = coord.match(COORDS_REGEX)
  return [ALPHA.indexOf(letter), +integer]
}

export default class CreatureDrawer extends Component {
  beforeRender () {
    this.update = this.update.bind(this)
    this.handleName = this.handleName.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleSend = this.handleSend.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handlePointEnter = this.handlePointEnter.bind(this)
    this.handlePointLeave = this.handlePointLeave.bind(this)

    this.state.name = writable(randomName())
    this.state.coords = writable([])
    this.state.invalid = derived(this.state.coords, coords => coords.length <= 2)
  }

  template (props, state) {
    return (
      <main id='CreatureDrawer' class='creature-drawer'>
        <div class='creature-drawer__grid'>
          <div class='rows'>
            {
              new Array(props.resolution)
                .fill(0)
                .map((_, index) => (<div class='row' data-index={index} />))
            }
          </div>
          <div class='cols'>
            {
              new Array(props.resolution)
                .fill(0)
                .map((_, index) => (<div class='col' data-index={letters(index)} />))
            }
          </div>
          <svg
            width='100%'
            height='100%'
            viewBox={`0 0 ${props.resolution - 1} ${props.resolution - 1}`}
          >
            <path ref={this.ref('close')} fill='none' class='close' />
            <path ref={this.ref('path')} fill='none' />
            <g ref={this.ref('points')} />
          </svg>
        </div>

        <section class='creature-drawer__inputs'>
          <input
            type='text'
            ref={this.ref('name')}
            placeholder={state.name.get()}
            event-input={this.handleName}
          />
          <div
            contentEditable
            ref={this.ref('input')}
            event-input={this.handleInput}
            placeholder='A0'
          />
          <div class='creature-drawer__toolbar'>
            <Button
              icon={IconTrash}
              class='button--delete'
              event-click={this.handleDelete}
            />
            <Button
              icon={IconSend}
              label='envoyer'
              class='button--send'
              ref={this.ref('buttonSend')}
              store-disabled={state.invalid}
              event-click={this.handleSend}
            />
          </div>
        </section>
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)
    this.state.coords.subscribe(this.update)
  }

  clear () {
    this.refs.points.innerHTML = ''
  }

  update () {
    this.clear()

    const points = this.state.coords.current.map(toPoint)
    this.render(points.map(([x, y]) => (
      <circle
        cx={x}
        cy={y}
        r='0.1'
        event-mouseenter={this.handlePointEnter([x, y])}
        event-mouseleave={this.handlePointLeave}
      />
    )), this.refs.points)

    this.refs.close.setAttribute('d',
      points.length > 1
        ? pathData([points[0], lastOf(points)], { close: false })
        : ''
    )

    this.refs.path.setAttribute('d',
      points.length > 1
        ? pathData(points, { close: false })
        : ''
    )
  }

  handlePointEnter ([x, y]) {
    return e => {
      const col = this.base.querySelector(`.col:nth-child(${x + 1})`)
      const row = this.base.querySelector(`.row:nth-child(${y + 1})`)
      row?.classList.add('is-hover')
      col?.classList.add('is-hover')
    }
  }

  handlePointLeave () {
    for (const line of this.base.querySelectorAll('.row.is-hover, .col.is-hover')) {
      line.classList.remove('is-hover')
    }
  }

  handleName (e) {
    this.state.name.set(e.target.value)
  }

  handleInput (e) {
    e.preventDefault()
    this.state.coords.set(
      e.target.innerText
        .split('\n')
        .filter(v => COORDS_REGEX.test(v))
    )
  }

  handleDelete (e) {
    this.refs.input.innerHTML = ''
    this.state.coords.set([])
  }

  async handleSend () {
    const SCALE = 10
    const res = this.props.resolution
    const creature = Population.create({
      uid: this.state.name.get(),
      type: 'Builder',
      size: this.props.resolution * SCALE,
      shape: this.state.coords.current.map(coord => {
        const [x, y] = toPoint(coord)
        return [(x - res / 2) * SCALE, (y - res / 2) * SCALE]
      })
    })

    WebSocketServer.send('creature', {
      from: 'creature-draw',
      creature: creature.toJSON()
    })

    this.refs.buttonSend.animate()
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
