var hdkey = require('ethereumjs-wallet/hdkey')

var fixtureseed = Buffer.from('747f302d9c916698912d5f70be53a6cf53bc495803a5523d3a7c3afa2afba94ec3803f838b3e1929ab5481f9da35441372283690fdcf27372c38f40ba134fe03', 'hex')
var fixturehd = hdkey.fromMasterSeed(fixtureseed)
console.log(fixturehd)
