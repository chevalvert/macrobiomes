const WebSocket = require('ws')
const logger = require('./utils/logger')
const Emitter = require('tiny-emitter')

const emitter = new Emitter()
const wss = new WebSocket.Server({ noServer: true })
const map = new Map()

wss.on('connection', async (ws, req) => {
  const id = req.session.id
  logger({ color: 'white', prefix: '[WEBSOCKET]' })(`${id} connected`)
  map.set(id, ws)
  ws.send(JSON.stringify({ event: 'connection', message: id }))
  ws.on('close', () => map.delete(id))
  ws.on('message', message => {
    const string = message.toString()
    const { event, data } = JSON.parse(message)
    emitter.emit(event, data)
    broadcast(string, ws)
  })
})

function broadcast (message, client) {
  for (const c of wss.clients) {
    if (c !== client) c.send(message)
  }
}

module.exports = {
  on: emitter.on.bind(emitter),
  once: emitter.once.bind(emitter),
  off: emitter.off.bind(emitter),

  handleUpgrade: (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req))
  },

  broadcast,
  send: (id, message) => {
    const ws = map.get(id)
    if (ws) ws.send(message)
  }
}
