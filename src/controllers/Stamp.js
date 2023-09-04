/* global APP, Blob, Image */
import Store from 'store'
import HtmlToSvg from '@tooooools/html-to-svg'
import WebSocketServer from 'controllers/WebSocketServer'

let timer
let img
let isRunning = false

WebSocketServer.emitter.on('gamepad:keypress', reset)

function tick () {
  if (!APP.stamp.duration) return
  timer = window.setTimeout(async () => {
    await stamp()
    tick()
  }, APP.stamp.duration)
}

export function start () {
  if (isRunning) return
  isRunning = true
  tick()
  window.setTimeout(stamp, 1000)
}

export function reset () {
  if (!isRunning) return
  stop()
  start()
}

export function stop () {
  isRunning = false
  window.clearTimeout(timer)
}

async function stamp () {
  if (!img) {
    const svgRender = new HtmlToSvg(document.querySelector('h1'), {
      fonts: [
        { family: 'Styrene', url: '/fonts/styrenea-regular.otf', weight: '700' }
      ]
    })

    await svgRender.preload()

    const url = URL.createObjectURL(new Blob([
      (await svgRender.compute()).outerHTML
    ], { type: 'image/svg+xml;charset=utf-8' }))

    img = new Image()
    await new Promise(resolve => {
      img.onload = resolve
      img.src = url
    })
  }

  const renderer = Store.renderer.instance.get()
  renderer.draw('trace', ctx => {
    // Left
    ctx.save()
    ctx.translate(img.height / 2 + 20, window.innerHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.translate(-img.width / 2, -img.height / 2)
    ctx.drawImage(img, 0, 0)
    ctx.restore()

    // Right
    ctx.save()
    ctx.translate(window.innerWidth - img.height / 2 + 20, window.innerHeight / 2)
    ctx.rotate(Math.PI / 2)
    ctx.translate(-img.width / 2, -img.height / 2)
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  })
}

export default { start, reset, stop }
