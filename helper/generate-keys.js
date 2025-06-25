import crypto from "crypto";
import elliptic from "elliptic";
import fs from "fs";

const ec = new elliptic.ec('secp256k1');

function to62base(hex) {
    const base62dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let bigint = BigInt('0x' + hex);
    let base62 = '';

    while (bigint > 0) {
        const rem = bigint % 62n;
        base62 = base62dictionary[Number(rem)] + base62;
        bigint = bigint / 62n;
    }

    return base62
}

function privateKeyToBits(privateKeyHex) {
    if (privateKeyHex.startsWith('0x')) privateKeyHex = privateKeyHex.slice(2);
    let bits = BigInt('0x' + privateKeyHex).toString(2).padStart(256, '0');
    return bits;
}


function generateMnemonicSeed(privateKey) {
    const bits = privateKeyToBits(privateKey);
    const hash = crypto.createHash("sha256").update(Buffer.from(privateKey, 'hex')).digest();
    const checksumBits = hash[0].toString(2).padStart(8, '0');
    const fullBits = bits + checksumBits;

    const arr = fullBits.match(/.{11}/g);
    const data = fs.readFileSync('bip39.txt', "utf-8");
    const dictionary = data.split(/\r?\n/).map(e => e.trim());
    const words = arr.map(bin => dictionary[parseInt(bin, 2)]);
    return words
}

export function generateAddress(publicKey) {
    const sha256 = crypto.createHash("sha256").update(Buffer.from(publicKey, 'hex')).digest();
    const hash160 = crypto.createHash('ripemd160').update(sha256).digest('hex');
    const checkSum = crypto.createHash("sha256").update(sha256).digest('hex');
    const rawAddress = "38" + hash160 + checkSum.slice(0, 8)
    const address = to62base(rawAddress);

    return address;
}

export function privateKeyFromMnemonicSeed(mnemonicSeed) {
    const data = fs.readFileSync('bip39.txt', "utf-8");
    const dictionary = data.split(/\r?\n/).map(e => e.trim());

    let bits = mnemonicSeed.map(word => {
        const idx = dictionary.indexOf(word);
        if (idx === -1) throw new Error(`Word "${word}" not found in dictionary`);
        return idx.toString(2).padStart(11, '0');
    }).join('');

    const entropyBits = bits.slice(0, 256);

    const privateKeyHex = BigInt('0b' + entropyBits).toString(16).padStart(64, '0');
    return privateKeyHex;
}

export function generateWallet() {
    const keys = ec.genKeyPair();
    const privateKey = keys.getPrivate('hex');
    const publicKey = keys.getPublic('hex');
    const address = generateAddress(publicKey);
    const mnemonicSeed = generateMnemonicSeed(privateKey);

    return {
        privateKey,
        publicKey,
        address,
        mnemonicSeed
    };
}