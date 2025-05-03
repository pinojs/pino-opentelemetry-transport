'use strict'

const assert = require('node:assert/strict')

function match (result, expectedResult, message) {
  const checkResult = Object
    .keys(expectedResult)
    .reduce((acc, key) => {
      acc[key] = result[key]
      return acc
    }, {})

  assert.deepStrictEqual(checkResult, expectedResult, message)
}

module.exports = { match }
