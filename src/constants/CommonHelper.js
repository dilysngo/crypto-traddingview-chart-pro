/* eslint-disable no-return-assign */
import { roundTo } from 'round-to'
import { isNumber } from 'lodash'
import momentTimezone from 'moment-timezone'

const isMobile = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    return true
  }
  return false
}

/**
 * @dev
 * @param {string} name {iPad|iPhone|iPod} or {android} or {windows phone}
 * @returns
 */
const isDevice = (name) => {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera
  const isMobile = new RegExp(name, 'i').test(userAgent)
  if (isMobile) {
    return true
  }
  return false
}

const removeEmpty = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => [k, v && typeof v === 'object' ? removeEmpty(v) : v])
    // eslint-disable-next-line eqeqeq
    .reduce((a, [k, v]) => (v == null || v == undefined || v == '' ? a : ((a[k] = v), a)), {})

function roundNumber(n, scale = 3) {
  if (!isNumber(n)) return 0
  if (+n > 1e17) return Math.round(+n)
  const num = typeof +n !== 'number' ? 0 : parseFloat(n)
  if (!`${num}`.includes('e')) {
    return +`${Math.floor(`${num}e+${scale}`)}e-${scale}`
  }
  const arr = `${num}`.split('e')
  let sig = ''
  if (+arr[1] + scale > 0) {
    sig = '+'
  }
  return +`${Math.floor(`${+arr[0]}e${sig}${+arr[1] + scale}`)}e-${scale}`
}

function formatNumber(nb, scale = 3) {
  const n = roundTo.up(parseFloat(nb), scale)

  const sign = +n < 0 ? '-' : ''
  const toStr = n.toString()
  if (!/e/i.test(toStr)) {
    return n
  }
  const [lead, decimal, pow] = n
    .toString()
    .replace(/^-/, '')
    .replace(/^([0-9]+)(e.*)/, '$1.$2')
    .split(/e|\./)
  return +pow < 0
    ? `${sign}0.${'0'.repeat(Math.max(Math.abs(pow) - 1 || 0, 0))}${lead}${decimal}`
    : sign +
        lead +
        (+pow >= decimal.length
          ? decimal + '0'.repeat(Math.max(+pow - decimal.length || 0, 0))
          : `${decimal.slice(0, +pow)}.${decimal.slice(+pow)}`)
}

const formatDate = (date, format = 'HH:mm DD/MM/YYYY') => {
  // const country = JSON.parse(localStorage.getItem("userInfo"));
  const country = 'Asia/Ho_Chi_Minh'
  if (date) {
    const tz = momentTimezone(date)
    const time = tz.tz(country).format(format)
    return time
  }
  return ''
}
const formatDateNoTime = (date, format = 'DD/MM/YYYY') => {
  // const country = JSON.parse(localStorage.getItem("userInfo"));
  const country = 'Asia/Ho_Chi_Minh'
  if (date) {
    const tz = momentTimezone(date)
    const time = tz.tz(country).format(format)
    return time
  }
  return ''
}

const formatCode = (text, start, end, concat = '...') => {
  if (!text) return text
  const total = start + end
  const textStr = text.toString()
  const { length } = textStr
  if (total >= length) return text
  return [textStr.slice(0, start), textStr.slice(length - end)].join(concat)
}

const isValid = (value) => {
  if (value !== undefined && value !== null && !Number.isNaN(value)) {
    return true
  }
  return false
}

export { isValid, isMobile, isDevice, removeEmpty, roundNumber, formatNumber, formatDate, formatCode, formatDateNoTime }
