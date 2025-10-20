'use strict'

const neostandard = require('neostandard')

module.exports = neostandard({
  ts: true,
  ignores: ['node_modules/', 'coverage/', '.nyc_output/', 'types/']
})
