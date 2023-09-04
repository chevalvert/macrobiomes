/* global APP */
import Store from 'store'
import { Component } from 'utils/jsx'
import { writable } from 'utils/state'

import Population from 'controllers/Population'
import WebSocketServer from 'controllers/WebSocketServer'

import Renderer from 'components/Renderer'

export default class Cartel extends Component {
  beforeRender () {
    this.handleTick = this.handleTick.bind(this)
    this.handleCreature = this.handleCreature.bind(this)

    this.state = {
      creatures: writable([])
    }
  }

  template (props, state) {
    const size = 200
    const len = (Math.floor(window.innerWidth / size) - 1) * 2
    return (
      <main id='Cartel' class='cartel'>
        <header>
          <h1>{APP.title}</h1>
          <h2>studio chevalvert, 2023</h2>
        </header>

        <div class='cartel__text'>
          <p>Chevalvert aborde les relations entre les métaphores organiques et les environnements numériques depuis plusieurs années et&nbsp;Microbiomes est un écho aux problématiques actuelles autour du&nbsp;vivant et à la pédagogie liées aux sciences naturelles. Sur l’invitation de la&nbsp;Mallapixels 2022, nous avons proposé Microbiomes.</p>
          <p>En biologie, la stigmergie est un mécanisme de coordination indirecte entre les agents. Le principe est que la trace laissée dans l'environnement par l'action initiale stimule une&nbsp;action suivante, par le même agent ou un agent différent. De cette façon, les actions successives ont&nbsp;tendance à se renforcer, conduisant ainsi à l'émergence spontanée d'activité cohérente, apparemment systématique.</p>
        </div>
        <div class='cartel__renderers' style={`--cols: ${len / 2}`}>
          {
            new Array(len).fill().map(() => (
              <Renderer
                width={size}
                height={size}
                ref={this.refArray('renderers')}
              />
            ))
          }
        </div>

        <footer>
          <img src='https://github.com/chevalvert.png' />
        </footer>
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)
    WebSocketServer.emitter.on('creature', this.handleCreature)
  }

  handleCreature ({ from, creature } = {}) {
    this.state.creatures.update(creatures => {
      if (creatures.length > this.refs.renderers.length - 1) creatures.shift()
      creatures.push(Population.create(creature))
      return creatures
    }, true)
  }

  handleTick () {
    for (const renderer of this.refs.renderers) {
      renderer.clear({ force: true })
    }

    const creatures = this.state.creatures.get()
    for (let index = 0; index < creatures.length; index++) {
      const creature = creatures[index]
      creature.renderer = this.refs.renderers[Math.min(creatures.length - 1, this.refs.renderers.length - 1) - index]
      creature.position = [
        (creature.renderer.props.width - creature.size) / 2,
        (creature.renderer.props.height - creature.size) / 2
      ]

      creature.renderer.base.dataset.name = creature.uid
      creature.render({ showStroke: true, showName: false })
    }
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
