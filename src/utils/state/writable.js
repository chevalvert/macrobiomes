import { Readable } from './readable'

class Writable extends Readable {
  set (value, force) {
    if (!force && this.current === value) return
    this.previous = this.current

    this.current = value
    let node = this._first
    while (node) {
      node.fn.call(node.ctx, this.current, this.previous)
      node.once && this.unsubscribe(node)
      node = node.next
    }
  }

  toggle () {
    this.set(!this.current)
  }

  update (cb, force) {
    const value = cb(this.current)
    this.set(value !== undefined ? value : this.current, force)
  }
}

export { Writable }
export default function writable (v) {
  return new Writable(v)
}
