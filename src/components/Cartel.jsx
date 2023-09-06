/* global APP, ENV */
import Store from 'store'
import { Component } from 'utils/jsx'
import { writable } from 'utils/state'
import lastOf from 'utils/array-last'
import Population from 'controllers/Population'
import WebSocketServer from 'controllers/WebSocketServer'

import Renderer from 'components/Renderer'

export default class Cartel extends Component {
  beforeRender () {
    this.handleTick = this.handleTick.bind(this)
    this.handleCreature = this.handleCreature.bind(this)

    this.state = {
      creatures: writable([]),
      count: writable(ENV.count || 0)
    }
  }

  template (props, state) {
    const size = 160
    const len = 6 * 4
    return (
      <main id='Cartel' class='cartel'>
        <header>
          <h1>{APP.title}</h1>
          <h2>studio chevalvert, 2023</h2>
        </header>

        <section class='cartel__content'>
          <div class='cartel__text'>
            <p>L’installation <i>Macrobiomes</i> souhaite sensibiliser les spectateurs à la réalité du vivant par le prisme du numérique. L’œuvre interactive propose au public de se plonger au cœur d’un laboratoire de lumière et de comprendre les interactions entre les éléments constitutifs de l’échelle microscopique, échelon invisible et pourtant essentiel à la vie sur Terre.</p>
            <p>Au cœur de l’action, le spectateur par ses choix et leurs conséquences, participe à la création en temps réel d’un macrobiome lumineux, interactif et unique, lui permettant de&nbsp;s’immerger dans des paysages de pixels. <br/><i>Macrobiomes</i> permet ainsi de faire écho aux problématiques actuelles autour du vivant et à la pédagogie liées aux sciences naturelles.</p>
            <p>Champignons, bactéries et virus composent cet univers graphique en perpétuel évolution.</p>
            <p>Deux générateurs de créatures micro-organiques positionnés dans la salle permettent de venir peupler  le terrarium de pixels.</p>
            <p>Chaque créature interagit avec l’écosystème suivant sa taille, son type et son comportement.</p>
            <p>Les champignons appliquent des motifs suivant leur gênes, les&nbsp;bactéries ont la capacité d’étaler les couleurs déjà posées et&nbsp;les virus  suppriment ces traces graphiques, mais laissent quand même quelques pixels…</p>
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
        </section>

        <div class='cartel__count'><span store-text={state.count} /> créatures générées depuis le lancement de l’expérience</div>
        <img src='https://github.com/chevalvert.png' />
      </main>
    )
  }

  afterMount () {
    Store.raf.frameCount.subscribe(this.handleTick)
    WebSocketServer.emitter.on('creature', this.handleCreature)
  }

  handleCreature ({ from, creature } = {}) {
    this.state.count.update(count => ++count)

    creature = Population.create(creature)

    // Do not push spammed creatures
    const last = lastOf(this.state.creatures.current)
    if (last && creature.uid === last.uid) {
      last.occurence = (last.occurence || 1) + 1
      return
    }

    this.state.creatures.update(creatures => {
      if (creatures.length > this.refs.renderers.length - 1) creatures.shift()
      creatures.push(creature)
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
      creature.renderer.base.dataset.count = (creature.occurence > 1) ? creature.occurence : null
      creature.render({ showStroke: true, showName: false })
    }
  }

  beforeDestroy () {
    Store.raf.frameCount.unsubscribe(this.handleTick)
  }
}
