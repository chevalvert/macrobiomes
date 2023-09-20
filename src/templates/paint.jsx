import { render } from 'utils/jsx'

import CreaturePainter from 'components/CreaturePainter'

import Raf from 'controllers/Raf'
import WebSocketServer from 'controllers/WebSocketServer'

/// #if DEVELOPMENT
require('webpack-hot-middleware/client?reload=true')
  .subscribe(({ reload }) => reload && window.location.reload())
/// #endif

;(async () => {
  render(<CreaturePainter />, document.body)

  Raf.start()
  WebSocketServer.open()
})()
