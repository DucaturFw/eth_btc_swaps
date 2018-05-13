var bitcoin = require('bitcoinjs-lib');
var bip65 = require('bip65');

const SECRET_SIZE = 32;

function createLockTime() {
    return bip65.encode({ utc: Math.floor(Date.now() / 1000) - (3600 * 3) });
}

function createAtomicSwapScript(secretHash, us, them) {
    // TODO(universome): rename us/them args

    let lockTime = bip65.encode({ utc: Math.floor(Date.now() / 1000) - (3600 * 3) })

    return bitcoin.script.compile([
        /* MAIN IF BRANCH */
        bitcoin.opcodes.OP_IF,

        // Require initiator's secret to be a known length that the redeeming
		// party can audit.  This is used to prevent fraud attacks between two
		// currencies that have different maximum data sizes.
		bitcoin.opcodes.OP_SIZE,
		SECRET_SIZE,
        bitcoin.opcodes.OP_EQUALVERIFY,

        // Require initiator's secret to be known to redeem the output.
        bitcoin.opcodes.OP_SHA256,
		secretHash,
        bitcoin.opcodes.OP_EQUALVERIFY,

        // Verify their signature is being used to redeem the output.  This
		// would normally end with OP_EQUALVERIFY OP_CHECKSIG but this has been
		// moved outside of the branch to save a couple bytes.
		bitcoin.opcodes.OP_DUP,
		bitcoin.opcodes.OP_HASH160,
        // anotherPersonPublicKeyHash, // Sending them our bitcoins
        them.getPublicKeyBuffer(),

        /* ELSE BRANCH */
        // Else branch. This is executed if everything goes wrong.
        bitcoin.opcodes.OP_ELSE,

        // Verify locktime and drop it off the stack (which is not done by CLTV).
		locktime,
		bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
		bitcoin.opcodes.OP_DROP,

		// Verify our signature is being used to redeem the output.  This would
		// normally end with OP_EQUALVERIFY OP_CHECKSIG but this has been moved
		// outside of the branch to save a couple bytes.
		bitcoin.opcodes.OP_DUP,
		bitcoin.opcodes.OP_HASH160,
        // ourPublicKeyHash,
        us.getPublicKeyBuffer(),

        /* ALMOST THE END. */
        bitcoin.opcodes.OP_ENDIF,

        // Complete the signature check.
        bitcoin.opcodes.OP_EQUALVERIFY,
        bitcoin.opcodes.OP_CHECKSIG
    ]);
}

function createRedeemScript(txbuilder, atomicSwapScript, secret, privateKey, pubkey) {
    let sigHash = txbuilder.tx.hashForSignature(0, atomicSwapScript, bitcoin.Transaction.SIGHASH_ALL);
    let sig = privKey.sign(sigHash);

    return bitcoin.script.compile([
        sig,
        pubkey,
        secret,
        bitcoin.opcodes.OP_TRUE, // Adding TRUE. TODO: why do we need it?
        atomicSwapScript
    ])
}
