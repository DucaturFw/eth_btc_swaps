var bitcoin = require('bitcoinjs-lib');
var bip65 = require('bip65');

export function createAliceToBobAtomicSwapScript(aliceSecretHash, alicePubKey, bobPubKey) {
    return bitcoin.script.compile([,
        bitcoin.opcodes.OP_IF, // redeem to bob if secret is known
        bitcoin.opcodes.OP_HASH160,
        aliceSecretHash,
        bitcoin.opcodes.OP_EQUALVERIFY,
        bobPubKey,

        bitcoin.opcodes.OP_ELSE, // redeem to alice after timeout
        bitcoin.script.number.encode(60),
        bitcoin.opcodes.OP_NOP3,
        bitcoin.opcodes.OP_DROP,
        alicePubKey,

        bitcoin.opcodes.OP_ENDIF,
        bitcoin.opcodes.OP_CHECKSIG
    ]);
}

function createBobToAliceAtomicSwapScript(aliceSecretHash, alicePubKey, bobPubKey) {
    return bitcoin.script.compile([,
        // If everything goes right
        bitcoin.opcodes.OP_IF,
        bitcoin.opcodes.OP_HASH160,
        aliceSecretHash,
        bitcoin.opcodes.OP_EQUALVERIFY,
        alicePubKey,

        // If everything goes wrong
        bitcoin.opcodes.OP_ELSE,
        bitcoin.script.number.encode(30),
        bitcoin.opcodes.OP_NOP3,
        bitcoin.opcodes.OP_DROP,
        bobPubKey,

        bitcoin.opcodes.OP_ENDIF,
        bitcoin.opcodes.OP_CHECKSIG
    ]);
}

var aliceToBobOutputScript = scriptHashOutput(bitcoin.crypto.hash160(aliceToBobAtomicSwapScript));
var aliceToBobP2SHAddress = bitcoin.address.fromOutputScript(aliceToBobOutputScript, NETWORK);
console.log(aliceToBobP2SHAddress) //2MxRHAzcBt5Jh68T8gBWA5cnQkuYANoonuV — testnet P2SH address

var bobToAliceOutputScript = scriptHashOutput(bitcoin.crypto.hash160(bobToAliceAtomicSwapScript));
var aliceToBobP2SHAddress = bitcoin.address.fromOutputScript(aliceToBobOutputScript, NETWORK);
console.log(bobToAliceP2SHAddress) //2N8cSUwEaf56uUrcjfB9BxQf2h93jNUmAFA — testnet P2SH address

var unsignedHex = createSend(bobToAliceP2SHAddress, AliceAddress, 'RAREPEPE', 1);
var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex);

var txb = bitcoin.TransactionBuilder.fromTransaction(unsignedTx, NETWORK);

var signedTx = signClaimTxWithSecret(txb, alicePrivKey, bobToAliceAtomicSwapScript, aliceSecret);

var signClaimTxWithSecret = function(txb, privKey, redeemScript, secret) {
    var signatureScript = redeemScript;
    var signatureHash = txb.tx.hashForSignature(0, signatureScript, bitcoin.Transaction.SIGHASH_ALL);
    var signature = privKey.sign(signatureHash);
    var tx = txb.buildIncomplete();
    var scriptSig = bitcoin.script.compile([
        signature.toScriptSignature(bitcoin.Transaction.SIGHASH_ALL),
        secret,
        bitcoin.opcodes.OP_TRUE,
        redeemScript
     ]);

    tx.setInputScript(0, scriptSig);

    return tx;
};

var unsignedHex = createSend(aliceToBobP2SHAddress,AliceAddress, 'SATOSHICARD', 1);
var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex);
var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex);

unsignedTx.version = 2;
unsignedTx.ins.forEach((input, idx) => { input['sequence'] = 60; });

var txb = bitcoin.TransactionBuilder.fromTransaction(unsignedTx, NETWORK);

var signedTx = signRefundClaim(txb, alicePrivKey, aliceToBobAtomicSwapScript);
var signRefundClaim = function(txb, privKey, redeemScript) {
    var signatureScript = redeemScript;
    var signatureHash = txb.tx.hashForSignature(0, signatureScript, bitcoin.Transaction.SIGHASH_ALL);
    var signature = privKey.sign(signatureHash);
    var tx = txb.buildIncomplete();
    var scriptSig = bitcoin.script.compile([
        signature.toScriptSignature(bitcoin.Transaction.SIGHASH_ALL),
        bitcoin.opcodes.OP_FALSE,
        redeemScript,
    ]);

    tx.setInputScript(0, scriptSig);

    return tx;
};