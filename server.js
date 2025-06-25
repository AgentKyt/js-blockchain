import express from "express";
import elliptic from "elliptic";

import { Blockchain } from "./class/blockchain.js";
import { Transaction } from "./class/transaction.js";
import { generateWallet } from "./helper/generate-keys.js"

const app = express();
const ec = new elliptic.ec('secp256k1');

app.use(express.json());

app.get('/', (req, res) => {
    // simple usage of blockchain

    const wallet1 = generateWallet(); 
    const wallet2 = generateWallet();

    // creating a wallet which looks like: 
    // {publicKey: "...", privateKey: "...", wallet: "...", "mnemonicSeed": "..."}
    // wallet private, public key length - 130
    // wallet address length - 34
    // amount of words in mnemonic seed - 24

    console.log(wallet1);
    console.log(wallet2);
    console.log(wallet1.publicKey.length)

    const key1 = ec.keyFromPrivate(wallet1.privateKey);
    const key2 = ec.keyFromPrivate(wallet2.privateKey);

    // key is like an encrypted pair of private and public keys

    const tx1 = new Transaction(wallet1.publicKey, wallet2.publicKey, 10);
    const tx2 = new Transaction(wallet2.address, wallet2.address, 5);

    // to creating a transaction you need sender and recipient pair, amount of coin you wanna to transfer
    // there are 2 pairs, publicKey - publicKey and address - address

    const chain = new Blockchain();

    // blockchain is a object where all of the information stored, it has blocks containing transactions 

    let balance1 = chain.getBalance(key1);

    // to get balance use getBalnce method of blockchain
    // handles keys, public keys, addresses

    while (balance1 <= 10) {
        chain.commitMining(wallet1.publicKey);
        balance1 = chain.getBalance(key1);
    }

    // mining works using commitMining, handles public keys and adresses

    const senderNonce1 = chain.nonces[wallet1.address] || 0;
    const senderNonce2 = chain.nonces[wallet2.address] || 0;
    tx1.nonce = senderNonce1;
    tx2.nonce = senderNonce2;

    // nonce is a unique number for each transaction 

    tx1.signTransaction(key1);
    tx2.signTransaction(key2);

    // to protect transaction we must sign (encrypt) it with key that says what you are sender

    chain.addTransaction(tx1);

    // then transaction added to blockchain

    chain.commitTransactions();

    // now we have to proceed it

    chain.addTransaction(tx2);
    chain.commitTransactions()

    console.log(chain.getBalance(key1));
    console.log(chain.getBalance(key2));

    console.log(chain)

    res.status(200).send(chain);
})

app.listen(3000, () => console.log("Server is running on 3000 port"));