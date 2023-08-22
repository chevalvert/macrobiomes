#!/usr/bin/env node

const path = require('path')
const pkg = require('../package.json')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.CONFIGURATION = path.join(__dirname, process.env.CONFIGURATION)

const http = require('http')
const express = require('express')
const upload = require('express-fileupload')
const session = require('express-session')
const Websocket = require('./websocket')
const MemoryStore = require('memorystore')(session)
const logger = require('./utils/logger')
const render = require('./api/render')

const app = express()
const server = http.createServer(app)
const sessionParser = session({
  saveUninitialized: true,
  secret: pkg.name,
  store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
  // Use same session for every req to debug ws w/ API using different softwares
  genid: process.env.NODE_ENV === 'development' ? req => 'dev-session' : undefined,
  resave: false,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000
  }
})

// Log request
app.use((req, res, next) => {
  logger({ color: 'gray', prefix: '[EXPRESS]' })(req.originalUrl)
  next()
})

// Handle multipart/form-data headers
app.use(upload({
  createParentPath: true,
  limits: {
    fieldSize: 50 * 1024 * 1024
  }
}))

// Handle session
app.use(sessionParser)

// Setup webpack middlewares
if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack')
  const config = require('../webpack.config.js')
  const compiler = webpack(config)
  const hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: logger({ color: 'gray', prefix: '[WEBPACK]' })
  })
  const devMiddleware = require('webpack-dev-middleware')(compiler, {
    serverSideRender: true,
    stats: 'errors-warnings',
    publicPath: config.output.publicPath
  })

  app.use(devMiddleware)
  app.use(hotMiddleware)
}

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'build')))
app.use(express.static(path.join(__dirname, '..', 'static')))

// Setup API routes
app.use('/api/ping', (req, res) => res.status(200).json({ version: pkg.version }))

// Setup front routes
app.use(['/screen/:id', '/screen'], render('main.hbs'))
app.use(['/:id', '/'], render('remote.hbs'))

// Log errors
app.use((error, req, res, next) => {
  error = error.cause || error
  logger({ color: 'red', prefix: '[EXPRESS]', level: 'error' })(error)
  res.status(500).json({ error: error.message || error })
})

// Websocket authentication handling
server.on('upgrade', (req, socket, head) => {
  sessionParser(req, {}, () => Websocket.handleUpgrade(req, socket, head))
})

// Start server
server.listen(process.env.PORT, () => {
  logger({
    color: 'green',
    prefix: '[EXPRESS]'
  })(`HTTP server is up and running on port ${process.env.PORT}`)
})
