import crypto from "crypto";
import elliptic from "elliptic";
import { generateAddress } from "../helper/generate-keys.js";

const ec = new elliptic.ec("secp256k1");

export class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.pair = this.checkPair();
        this.amount = amount;
        this.timestamp = Date.now();
        this.hash = this.calcHash();
        this.nonce = null;
        this.signature = null;
        this.publicKey = null;
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.nonce + this.pair)
            .digest('hex');
    }

    signTransaction(signingKey) {
        if (this.pair === 2 || this.pair === 3) return;
        const pubKeyHex = signingKey.getPublic('hex');

        if (this.pair === 0) {
            if (pubKeyHex !== this.fromAddress) {
                throw new Error('Cannot sign transactions for other wallets!');
            }
        } else if (this.pair === 1) {
            if (generateAddress(pubKeyHex) !== this.fromAddress) {
                throw new Error('Cannot sign transactions for other wallets!');
            }
        } else {
            throw new Error('Invalid pair');
        }

        this.publicKey = pubKeyHex;
        const hash = this.calculateHash();
        const sig = signingKey.sign(hash, 'base64');
        this.signature = sig.toDER('hex');
    }

    checkPair() {
        if (this.fromAddress === null && this.toAddress.length === 130) return 2;
        if (this.fromAddress === null && this.toAddress.length === 34) return 3;
        if (this.fromAddress.length === 130 && this.toAddress.length === 130) return 0;
        if (this.fromAddress.length === 34 && this.toAddress.length === 34) return 1;
        throw new Error("Invalid addresses pair");
    }

    calcHash() {
        return crypto.createHash("sha256")
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.pair + this.nonce)
            .digest('hex');
    }

    isValid() {
        if (this.pair === 2 || this.pair === 3) {
            if (this.amount <= 0 && typeof this.amount === 'number') return false;
            if (!this.hash) return false;
            if (!(this.nonce >= 0 && this.nonce < Infinity)) return false;
            return true
        }
        if (!this.signature || this.signature.length === 0) return false;
        if (this.amount <= 0 && typeof this.amount === 'number') return false;
        if (!this.hash) return false;

        let publicKeyHex;
        if (this.pair === 0) {
            publicKeyHex = this.fromAddress;
        } else if (this.pair === 1) {
            publicKeyHex = this.publicKey;
            if (!publicKeyHex || generateAddress(publicKeyHex) !== this.fromAddress) return false;
        } else {
            return false;
        }

        const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }

    isValidAddress() {
        if (this.pair === 0) {
            try {
                // Check uncompressed public key format
                if (
                    this.fromAddress.length === 130 &&
                    this.fromAddress.startsWith('04') &&
                    this.toAddress.length === 130 &&
                    this.toAddress.startsWith('04')
                ) {
                    // Try to parse as public key (throws if invalid)
                    ec.keyFromPublic(this.fromAddress, 'hex');
                    ec.keyFromPublic(this.toAddress, 'hex');
                    return true;
                }
                return false;
            } catch (e) {
                return false;
            }
        } 
        if (this.pair === 1) {
            return (
                /^[0-9a-zA-Z]{34}$/.test(this.fromAddress) &&
                /^[0-9a-zA-Z]{34}$/.test(this.toAddress)
            );
        }
        if (this.pair === 2) {
            if (this.fromAddress === null && this.toAddress.length === 130 && this.toAddress.startsWith('04')) {
                ec.keyFromPublic(this.toAddress, 'hex');
                return true;
            }
        }
        if (this.pair === 3) {
            return this.fromAddress === null && /^[0-9a-zA-Z]{34}$/.test(this.toAddress)
        }
        throw new Error("Invalid addresses pair");
    }
}