var bitcoin = require('bitcoinjs-lib');
var bip65 = require('bip65');

var bitcoin = require("bitcoinjs-lib");
var Mnemonic = require("bitcore-mnemonic");
// var bip38 = require("bip38");
var {wif} = require("wif");

var axios = require('axios');

const URL_NODE = 'https://testnet.blockchain.info';

const SECRET = 'MYSUPERSECRET';
var SECRET_HASH = '4DD6AA7C11';
const network = bitcoin.networks.testnet;

// Sending money
const SUM_TO_SEND = 20000;
const FEE = 4999;

class BitcoinWallet {
  constructor() {}

  create(seed) {
    console.log('seed>', seed);
    this.mnemonic = new Mnemonic(seed);

    this.seed = this.mnemonic.toString();
    this.priv = this.mnemonic.toHDPrivateKey().privateKey.toWIF();

    console.log(this.seed);
    console.log(this.priv);
  }

  getSeed() {
    return this.seed;
  }

    init() {
        this.pk = 'cTgR2GrYrH3Z9UULxGEpfAhM4mAsmFRAULUwp5KYFM9R9khxYJ4v'
        this.address = 'mph94e6SCNUPpyZBhBXHdRZyz1f4DDzeJK'
        this.pass = 'blank'

    }

   create_p(pwd) {
     const testnet = bitcoin.networks.testnet;
     const keyPair = bitcoin.ECPair.makeRandom({ network: testnet });

     this.pk = keyPair.toWIF();
     this.address = keyPair.getAddress();
     this.pass = pwd;

    console.log('private: ', this.pk);
    console.log('adr: ',      this.address);

   }

  getInfo() {
    return axios.get(`${URL_NODE}/rawaddr/${this.address}`).then(res => {

      const lastOUT = res.data.txs[0];
      const outputIndex = lastOUT.out.findIndex(item => item.addr === this.address);
      console.log(outputIndex)
      return {
        index: outputIndex,
        address: res.data.address,
        output: lastOUT.hash,
        balance: res.data.final_balance,
        txs: res.data.txs
      }
    });
  }

  createTX({ to, amount, data }) {
    this.getInfo().then(({ output, balance, index }) => {
        var hashType = bitcoin.Transaction.SIGHASH_ALL
        var lockTime = bip65.encode({ utc: utcNow() + (3600 * 3) })
        var keyPair = bitcoin.ECPair.fromWIF(this.pk, network)

        console.log('SECRET_HASH', SECRET_HASH);
        console.log('Taking this tx as input:', output)

        let redeemScript = createAtomicSwapScript(to);

        // var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
        // var address = bitcoin.address.fromOutputScript(scriptPubKey, network)
        var txb = new bitcoin.TransactionBuilder(network)

        // Ok, we take just one input. Let's hope this will be ok.
        txb.addInput(output, 0)

        // var txb = new bitcoin.TransactionBuilder(network)
        // txb.setLockTime(lockTime)
        // txb.addInput(output, 1)
        // console.log(output)
        // txb.addOutput('mph94e6SCNUPpyZBhBXHdRZyz1f4DDzeJK', 0)
        // var tx = txb.buildIncomplete()
        // var signatureHash = tx.hashForSignature(0, redeemScript, hashType);
        // var redeemScriptSig = bitcoin.script.scriptHash.input.encode([
        //     keyPair.sign(signatureHash).toScriptSignature(hashType),
        //     SECRET,
        //     bitcoin.opcodes.OP_TRUE,
        //     redeemScript,
        // ], redeemScript);
        // tx.setInputScript(0, redeemScriptSig)
        // txb.addOutput(redeemScript, 20000)
        // txb.sign(0, keyPair)
        // console.log(txb.build().toHex())

        // Sending some money to us
        txb.addOutput('mph94e6SCNUPpyZBhBXHdRZyz1f4DDzeJK', balance - (SUM_TO_SEND + FEE))

        // Sending some money to another guy
        var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
        var address = bitcoin.address.fromOutputScript(scriptPubKey, network)
        txb.addOutput(address, SUM_TO_SEND)

        txb.sign(0, keyPair);
        console.log(`Atomic swap transaction: ${txb.build().toHex()}`)
    })
  }

  createRedeemTx({secret, txHash}) {
    // console.log(txHash)
    var keyPair = bitcoin.ECPair.fromWIF(this.pk, network)
    // var txb = new bitcoin.TransactionBuilder(network);
    var tx = new bitcoin.Transaction();

    let scriptSig = bitcoin.script.compile([
        bitcoin.opcodes.OP_TRUE,
        Buffer.from(secret)
    ]);

    tx.addInput(Buffer.from(txHash, 'hex'), 1, 0, scriptSig)
    console.log('TX', txHash, Buffer.from(txHash, 'hex').toString('hex'))

    // Sending everything to us
    tx.addOutput(Buffer.from(this.address, 'hex'), SUM_TO_SEND - FEE);

    // Our desired input lies in the second input
    // txb.addInput(txHash, 1);
    // tx.setInputScript(0, scriptSig);

    // let atomicSwapScript = createAtomicSwapScript(this.address)

    // let sigHash = txb.tx.hashForSignature(0, atomicSwapScript, bitcoin.Transaction.SIGHASH_ALL);
    // let signature = keyPair.sign(sigHash)

    // var redeemScriptSig = bitcoin.script.scriptHash.input.encode([
    //     new Buffer(secret)
    // ], atomicSwapScript)

    // txb.addInput(1, redeemScriptSig)
    // txb.sign(0, keyPair);

    // let tx = txb.buildIncomplete();
    // tx.setInputScript(0, redeemScriptSig);

    console.log(`Redeem transaction: ${tx.toHex()}`)
  }
}


let testbtc = new BitcoinWallet();
//testbtc.create_p('testfdsg')
testbtc.init();
// testbtc.createTX({ to : 'mph94e6SCNUPpyZBhBXHdRZyz1f4DDzeJK' , amount: 10000 , data : 'k1.2.160'})
testbtc.createRedeemTx({ secret: SECRET, txHash: 'cc8f4bfd63aff96a7a863d1e239cd3b1a654db54da486867f8430b389ef344b7' })

function utcNow () {
    return Math.floor(Date.now() / 1000);
}

function createAtomicSwapScript(to) {
    return bitcoin.script.compile([
        bitcoin.opcodes.OP_DUP,
        // bitcoin.opcodes.OP_IF, // redeem to bob if secret is known
        bitcoin.opcodes.OP_HASH160,
        // new Buffer(SECRET_HASH, "hex"),
        new Buffer(SECRET_HASH),
        bitcoin.opcodes.OP_EQUALVERIFY,
        // new Buffer(to),

        // bitcoin.opcodes.OP_ELSE, // redeem to alice after timeout
        // new Buffer("60"),
        // bitcoin.opcodes.OP_NOP3,
        // bitcoin.opcodes.OP_DROP,
        // keyPair.getPublicKeyBuffer(),

        // bitcoin.opcodes.OP_ENDIF,
        // bitcoin.opcodes.OP_EQUALVERIFY,
        // bitcoin.opcodes.OP_CHECKSIG
    ]);
}