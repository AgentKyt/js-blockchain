import crypto from "crypto";

export class Block {
    constructor(timestamp, transactions, prevHash = '') {
        this.timestamp = timestamp;
        this.transactions = this.validTransactions(transactions);
        this.prevHash = prevHash;
        this.nonce = 0;
        this.hash = this.calcHash();
        this.mined = false;
    }
   
    calcHash() {
        return crypto.createHash("sha256")
            .update(this.timestamp + this.prevHash + this.nonce)
            .digest('hex');
    }

    mineBlock(difficulty) {
        if (this.mined) return false;
        if (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calcHash();
            return false;
        } else {
            this.mined = true;
            return true;
        }
    }

    validTransactions(transactions) {
        let arr = [];
        transactions.forEach((tx) => {
            if (tx.isValid()) arr.push(tx);
        });
        return arr;
    }
}