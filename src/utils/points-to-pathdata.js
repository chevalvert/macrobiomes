export default function (arr, { decimals = 3, close = false } = {}) {
  let d = ''
  for (let i = 0; i < arr.length + (close ? 1 : 0); i++) {
    d += i ? ' L ' : 'M '
    d += arr[i % arr.length][0].toFixed(decimals) + ' ' + arr[i % arr.length][1].toFixed(decimals)
  }

  if (close) d += ' Z'

  return d
}
