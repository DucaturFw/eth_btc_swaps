var bitcoin = require('bitcoinjs-lib');

const testnet = bitcoin.networks.testnet;
const keyPair1 = bitcoin.ECPair.makeRandom({ network: testnet });
const keyPair2 = bitcoin.ECPair.makeRandom({ network: testnet });

var alicePrivKey = keyPair1;
var bobPrivKey = keyPair2;
var aliceAddress = alicePrivKey.getAddress();
var bobAddress = bobPrivKey.getAddress();
var OP_INT_BASE = 80;


console.log('aliceAddress; ', aliceAddress);
console.log('bobAddress; ', bobAddress);

var aliceSecret = require('randombytes')(32);
var aliceSecretHash = bitcoin.crypto.hash160(aliceSecret);


var aliceToBobRedeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    bitcoin.opcodes.OP_HASH160,
    aliceSecretHash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bobPrivKey.getPublicKeyBuffer(),
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    OP_INT_BASE + 2,
    alicePrivKey.getPublicKeyBuffer(),
    bobPrivKey.getPublicKeyBuffer(),
    OP_INT_BASE + 2,
    bitcoin.opcodes.OP_CHECKMULTISIG,
    bitcoin.opcodes.OP_ENDIF
]);
var aliceToBobOutputScript = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(aliceToBobRedeemScript));
var aliceToBobP2SHAddress = bitcoin.address.fromOutputScript(aliceToBobOutputScript, testnet);

console.log('aliceToBobP2SHAddress; ', aliceToBobP2SHAddress);



