import { render } from 'utils/jsx'

import CreatureDrawer from 'components/CreatureDrawer'
import Renderer from 'components/Renderer'

import WebSocketServer from 'controllers/WebSocketServer'

/// #if DEVELOPMENT
require('webpack-hot-middleware/client?reload=true')
  .subscribe(({ reload }) => reload && window.location.reload())
/// #endif

;(async () => {
  render(<CreatureDrawer resolution={26} />, document.body)
  render(<Renderer />, document.body)

  WebSocketServer.open()
})()
