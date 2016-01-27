var exportAssets = require('./export-assets')
var config = require('./config')
var hub = require('quantum-hub')

exportAssets().then(function () {
  return hub.client.build(config)
})