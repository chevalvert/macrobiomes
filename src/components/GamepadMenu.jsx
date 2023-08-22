import { Component } from 'utils/jsx'
import { writable } from 'utils/state'
import Gamepad from 'controllers/Gamepad'
import { clamp } from 'missing-math'
import classnames from 'classnames'
import noop from 'utils/noop'

export default class Button extends Component {
  beforeRender (props) {
    this.update = this.update.bind(this)
    this.handleValueChange = this.handleValueChange.bind(this)

    this.state = {
      value: props['store-value'] || writable([0, 0]),
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

    Gamepad.on('up', () => this.state.selectedEntryIndex.update(i => clamp(--i, 0, this.refs.entries.length - 1)))
    Gamepad.on('down', () => this.state.selectedEntryIndex.update(i => clamp(++i, 0, this.refs.entries.length - 1)))
    Gamepad.on('right', this.handleSubEntryChange(-1))
    Gamepad.on('left', this.handleSubEntryChange(+1))
  }

  clear () {
    this.base.innerHTML = ''
    if (this.refs.entries) this.refs.entries.length = 0
  }

  update () {
    this.clear()
    this.render((
      this.props.entries.map((entries, i) => (
        <ul
          refArray={this.refArray('entries')}
          class={classnames('gamepad-menu__entry', { 'is-selected': i === this.state.selectedEntryIndex.current })}
        >
          {(i > 0 ? entries[this.state.value.current[0]] : entries).map((subentry, j) => (
            <li
              class={classnames('gamepad-menu__subentry', { 'is-selected': j === this.state.value.current[i] })}
            >
              {subentry}
            </li>
          ))}
        </ul>
      ))
    ), this.base)
  }

  handleValueChange () {
    ;(this.props['event-change'] || noop)(this.props.entries.map((subentries, i) => {
      return subentries[this.state.value.current[i]]
    }))
  }

  handleSubEntryChange (direction = 0) {
    return () => {
      const index = this.state.selectedEntryIndex.get()
      this.state.value.update(value => {
        // WARNING: hardcoded value
        const offset = direction > 0
          ? direction
          : direction + 3
        value[index] = (value[index] + offset) % 3
        return value
      }, true)
    }
  }
}
