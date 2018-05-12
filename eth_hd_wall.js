const { generateMnemonic, EthHdWallet } = require('eth-hd-wallet')

var mnemonic = generateMnemonic()
console.log(mnemonic)

const wallet = EthHdWallet.fromMnemonic(mnemonic)

console.log(wallet)

console.log( wallet.generateAddresses(1) )

