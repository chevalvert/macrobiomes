import { Component } from 'utils/jsx'
import { writable } from 'utils/state'
import Gamepad from 'controllers/Gamepad'
import { clamp } from 'missing-math'
import classnames from 'classnames'
import noop from 'utils/noop'

import Prng from 'controllers/Prng'

export default class Button extends Component {
  beforeRender (props) {
    this.update = this.update.bind(this)
    this.handleValueChange = this.handleValueChange.bind(this)

    this.state = {
      value: props['store-value'] || writable(new Array(props.entries.length).fill(0)),
      selectedEntryIndex: writable(0)
    }
  }

  template () {
    return <section class='gamepad-menu' />
  }

  afterMount () {
    this.update()
    this.state.selectedEntryIndex.subscribe(this.update)
    this.state.value.subscribe(this.update)
    this.state.value.subscribe(this.handleValueChange)
    this.handleValueChange()

    Gamepad.on('up', () => this.state.selectedEntryIndex.update(i => clamp(--i, 0, this.props.entries.length - 1)))
    Gamepad.on('down', () => this.state.selectedEntryIndex.update(i => clamp(++i, 0, this.props.entries.length - 1)))
    Gamepad.on('left', this.handleSubEntryChange(-1))
    Gamepad.on('right', this.handleSubEntryChange(+1))
  }

  clear () {
    this.base.innerHTML = ''
    if (this.refs.entries) this.refs.entries.length = 0
  }

  update () {
    this.clear()

    this.render((
      this.props.entries.map(({ values, label }, i) => (
        <ul
          data-label={label}
          ref={this.refArray('entries')}
          class={classnames('gamepad-menu__entry', { 'is-selected': i === this.state.selectedEntryIndex.current })}
        >
          {values.map(({ label }, j) => (
            <li
              class={classnames('gamepad-menu__value', { 'is-selected': j === this.state.value.current[i] })}
              innerHTML={label}
            />
          ))}
        </ul>
      ))
    ), this.base)
  }

  randomize () {
    this.log(this.state.value.current)
    this.state.value.update(value => this.props.entries.map(entry => (
      Prng.randomInt(0, entry.values.length)
    )), true)
  }

  handleValueChange () {
    const props = {}
    for (let i = 0; i < this.props.entries.length; i++) {
      const entry = this.props.entries[i]
      const p = entry.values[this.state.value.current[i]].props
      for (const key in p) {
        const v = p[key]
        props[key] = Array.isArray(v) ? Prng.randomOf(v) : v
      }
    }
    ;(this.props['event-change'] || noop)(props)
  }

  handleSubEntryChange (direction = 0) {
    return () => {
      const index = this.state.selectedEntryIndex.get()
      this.state.value.update(value => {
        const len = this.props.entries[index].values.length
        const offset = direction > 0
          ? direction
          : direction + len
        value[index] = (value[index] + offset) % len
        return value
      }, true)
    }
  }
}
