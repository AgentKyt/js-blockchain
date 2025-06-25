import { Block } from "./block.js";
import { Transaction } from "./transaction.js";
import { generateAddress } from "../helper/generate-keys.js";

export class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.nonces = {};
        this.difficulty = 1;
        this.adjustDifficultyAfterNBlocks = 5;
        this.targetTimeForBlock = 500;
        this.miningReward = 10;
        this.maxSupply = 1000000;
        this.currentMoney = 1000000;
        this.nextHalving = 500000;
        this.maxTransactionsPerBlock = 5000;
        this.minTxAmount = 0.00001;
        this.maxTxAmount = 100000;
        this.maxSymbolsAfterPeriod = 10;
    }

    createGenesisBlock() {
        return new Block(Date.now(), [])
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        if (transaction.fromAddress === null) {
            if (this.pendingTransactions.some(tx => tx.fromAddress === null)) {
                throw new Error("A coinbase transaction is already pending.");
            }
        }

        if (!transaction.isValid()) {
            throw new Error("Invalid Transaction");
        }

        if (!transaction.isValidAddress(transaction.fromAddress) || !transaction.isValidAddress(transaction.toAddress)) {
            throw new Error("Invalid address");
        }

        if (
            typeof transaction.amount !== "number" ||
            !Number.isFinite(transaction.amount) ||
            Number.isNaN(transaction.amount) ||
            transaction.amount <= this.minTxAmount ||
            transaction.amount >= this.maxTxAmount ||
            transaction.amount > Number.MAX_SAFE_INTEGER ||
            transaction.amount < 0
        ) {
            throw new Error("Invalid transaction amount (overflow, NaN, or out of bounds)");
        }

        transaction.amount = parseFloat(transaction.amount.toFixed(this.maxSymbolsAfterPeriod))

        const balance = this.getBalance(transaction.publicKey);
        if (balance < transaction.amount) {
            throw new Error("Not enough funds");
        }

        if (transaction.fromAddress !== null) {
            let senderAddress;
            if (transaction.fromAddress.length === 130) {
                senderAddress = generateAddress(transaction.fromAddress);
            } else {
                senderAddress = transaction.fromAddress;
            }
            const expectedNonce = (this.nonces[senderAddress] || 0);
            if (transaction.nonce !== expectedNonce) {
                throw new Error(`Invalid nonce: expected ${expectedNonce}, got ${transaction.nonce}`);
            }
            this.nonces[senderAddress] = expectedNonce + 1;
        }

        this.pendingTransactions.push(transaction);
    }

    commitTransactions() {
        let txs;
        let flag;
        if (this.pendingTransactions.length > this.maxTransactionsPerBlock) {
            txs = this.pendingTransactions.slice(0, this.maxTransactionsPerBlock);
            this.pendingTransactions = this.pendingTransactions.slice(this.maxTransactionsPerBlock);
            flag = false;
        } else {
            txs = this.pendingTransactions;
            flag = true;
        }

        let coinbaseCount = 0;
        for (const tx of txs) {
            if (!tx.isValid()) {
                throw new Error("Invalid transaction in pending pool");
            }
            if (tx.fromAddress === null) coinbaseCount++;
        }
        if (coinbaseCount > 1) {
            throw new Error("Block cannot contain more than one coinbase (mining reward) transaction.");
        }

        const block = new Block(Date.now(), txs, this.getLatestBlock().hash);
        this.chain.push(block)
        if (flag) this.pendingTransactions = [];
    }

    commitMining(minerAddress) {
        const last = this.getLatestBlock();
        if (last.mined || !last.prevHash) {
            this.commitTransactions();
        } else {
            const isMiningSuccessful = last.mineBlock(this.difficulty);
            if (!isMiningSuccessful) return false;
            if (this.nextHalving >= this.currentMoney && this.miningReward >= this.minTxAmount) {
                this.nextHalving = this.nextHalving / 2;
                this.miningReward = parseFloat((this.miningReward / 2).toFixed(this.maxSymbolsAfterPeriod));
            }
            if (this.miningReward > this.currentMoney) return false;
            this.currentMoney -= this.miningReward;
            const rewardTx = new Transaction(null, minerAddress, this.miningReward)
            this.addTransaction(rewardTx);
            this.adjustDifficulty();
        }
    }

    getBalance(key) {
        let publicKey = null, address = null;
        if (key === null) return this.currentMoney;
        if (!key) return 0;
        if (typeof key === "string") {
            if (key.length === 130) {
                publicKey = key;
                address = generateAddress(publicKey);
            } else if (key.length === 34) {
                address = key;
            }
        } else if (typeof key === "object" && key.getPublic('hex') && generateAddress(key.getPublic('hex'))) {
            publicKey = key.getPublic('hex');
            address = generateAddress(publicKey);
        }

        let balance = 0;
        for (let block of this.chain) {
            for (let transaction of block.transactions) {
                // Only subtract if fromAddress is not null (not a coinbase/reward tx)
                if (transaction.fromAddress && (transaction.fromAddress === publicKey || transaction.fromAddress === address)) {
                    balance -= +transaction.amount;
                }
                if (transaction.toAddress === publicKey || transaction.toAddress === address) {
                    balance += transaction.amount;
                }
            }
        }
        return balance;
    }

    adjustDifficulty() {
        const N = this.adjustDifficultyAfterNBlocks;
        const targetTime = this.targetTimeForBlock;
        if (this.chain.length > N) {
            const lastBlock = this.getLatestBlock();
            const prevAdjustBlock = this.chain[this.chain.length - 1 - N];
            const actualTime = (lastBlock.timestamp - prevAdjustBlock.timestamp) / 1000;
            if (actualTime < N * targetTime * 0.9) {
                this.difficulty++;
            } else if (actualTime > N * targetTime * 1.1 && this.difficulty > 1) {
                this.difficulty--;
            }
        }
    }

    isValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const b = this.chain[i];
            const prev = this.chain[i - 1];

            if (b.hash !== b.calcHash()) return false;
            if (b.prevHash !== prev.hash) return false;
        }

        return true;
    }
}