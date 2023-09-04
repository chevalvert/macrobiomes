import { Component } from 'utils/jsx'

export default class Splashscreen extends Component {
  template (props, state) {
    return (
      <section class='splashscreen'>
        <div class='splashscreen__content' store-innerHTML={props.text} />
      </section>
    )
  }
}
