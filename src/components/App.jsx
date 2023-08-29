/* global APP */
import { Component } from 'utils/jsx'
import Renderer from 'components/Renderer'

export default class App extends Component {
  template (props, state) {
    return (
      <main id='App' class='app'>
        <Renderer
          padding={APP.renderer.padding}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      </main>
    )
  }
}
