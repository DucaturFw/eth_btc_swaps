var RIPEMD160 = require('ripemd160')

console.log(new RIPEMD160().update('test key').digest('hex'))

