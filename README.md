# JavaScript Blockchain

A simple educational blockchain implementation in JavaScript (Node.js) featuring wallet generation, BIP39 mnemonic support, mining, transaction validation, and basic block/chain logic.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Blocks](#blocks)
  - [Transactions](#transactions)
  - [Wallets & Keys](#wallets--keys)
  - [Mining & Rewards](#mining--rewards)
  - [Nonces](#nonces)
  - [Mnemonic Seed](#mnemonic-seed)
- [API Usage](#api-usage)
- [Security Considerations](#security-considerations)
- [Known Limitations](#known-limitations)
- [Extending the Blockchain](#extending-the-blockchain)
- [License](#license)

---

## Features

- **Block and Transaction Classes**: Core blockchain logic with mining and validation.
- **Wallet Generation**: secp256k1 elliptic curve, address derivation, and mnemonic backup.
- **BIP39 Mnemonic**: Generate and restore private keys using a 24-word mnemonic phrase.
- **Mining**: Proof-of-work mining with adjustable difficulty and halving reward.
- **Nonce Management**: Per-sender nonce to prevent replay and double-spend.
- **Express API**: Simple REST API for demonstration and testing.

---

## Project Structure

```
/class
    blockchain.js      # Blockchain logic
    block.js           # Block structure and mining
    transaction.js     # Transaction structure and validation
/helper
    generate-keys.js   # Wallet, address, and mnemonic utilities
bip39.txt              # BIP39 English wordlist (2048 words)
server.js              # Express server for API demonstration
```

---

## How It Works

### Blocks

- Each block contains:
  - `timestamp`
  - `transactions` (validated)
  - `prevHash` (previous block hash)
  - `nonce` (for mining)
  - `hash` (SHA256 of block data)
  - `mined` (boolean)

- **Mining**: The block is mined by finding a nonce such that the hash has a number of leading zeros equal to the difficulty.

### Transactions

- Each transaction contains:
  - `fromAddress` (sender's address or public key, or `null` for coinbase)
  - `toAddress` (recipient's address or public key)
  - `amount`
  - `timestamp`
  - `nonce` (per-sender)
  - `signature` (except for coinbase)
  - `publicKey` (for verification)
  - `pair` (address/public key type)

- **Validation**: Transactions are validated for signature, amount, nonce, and address format.

### Wallets & Keys

- **Wallet Generation**: Uses secp256k1 to generate private/public key pairs.
- **Address Generation**: SHA256 + RIPEMD160 + base62 encoding.
- **Mnemonic Seed**: Private key can be converted to a BIP39 mnemonic phrase for backup and recovery.

### Mining & Rewards

- **Mining**: Miners collect pending transactions, create a block, and mine it.
- **Reward**: The miner receives a reward transaction (coinbase) with no sender. The reward halves at specified intervals.

### Nonces

- **Per-Sender Nonce**: Each sender has their own incrementing nonce to prevent replay attacks and ensure transaction order.

### Mnemonic Seed

- **Generation**: Private key is converted to a 24-word BIP39 mnemonic.
- **Recovery**: Mnemonic can be converted back to the original private key.

---

## API Usage

### Start the Server

```bash
node server.js
```

### Example Endpoint

- **GET /**  
  - Generates two wallets.
  - Mines blocks to reward one wallet.
  - Demonstrates sending transactions and mining.
  - Returns the blockchain state as JSON.

**Example:**
```bash
curl http://localhost:3000/
```

---

## Security Considerations

- **Nonce Tracking**: Always uses the address as the canonical identifier for nonce tracking.
- **Transaction Validation**: All transactions are validated for signature, amount, and nonce.
- **Mining Reward**: Only one coinbase transaction per block is allowed.
- **Wordlist**: Uses a full 2048-word BIP39 wordlist for mnemonic generation and recovery.
- **No Networking**: This blockchain is single-node; no peer-to-peer or consensus networking is implemented.
- **No Transaction Fees**: Only mining rewards are supported.
- **Block Size Limit**: Enforced by `maxTransactionsPerBlock`.

---

## Known Limitations

| #  | Vulnerability                              | Fixed? | Impact/Note                                               |
|----|--------------------------------------------|--------|-----------------------------------------------------------|
| 1  | Nonce/address confusion                    | ✅     | Always normalized to address                              |
| 2  | Mining reward recipient format             | ✅     | Always normalized to address                              |
| 3  | No tx uniqueness/double-spend              | ❌     | Double-spending possible                                  |
| 4  | No transaction fees                        | ❌     | No miner incentive beyond reward                          |
| 5  | No timestamp validation                    | ❌     | Manipulation of block order/difficulty                    |
| 6  | No consensus/forks                         | ❌     | No network security, no fork resolution                   |
| 7  | No block size/tx limit                     | ✅     | Spam/DoS possible (now fixed)                             |
| 8  | Multiple coinbase tx allowed               | ✅     | Only one per block allowed                                |
| 9  | No re-validation on mining                 | ✅     | Transactions re-validated before block inclusion          |
| 10 | Static difficulty                          | ❌     | Difficulty adjusts only on halving, not by block time     |
| 11 | No genesis block reward                    | —      | Not a security risk, just a limitation                    |
| 12 | No integer overflow checks                 | ✅     | Negative balances/bugs prevented (now fixed)              |
| 13 | Mining logic inefficient                   | ❌     | Not realistic, easy to manipulate                         |
| 14 | No tx pool synchronization                 | ❌     | Inconsistent mempools across nodes                        |
| 15 | No chain rollback/reorg                    | ❌     | No fork resolution, risk of chain splits                  |
| 16 | No block/tx propagation                    | ❌     | No network security, no peer-to-peer                      |
| 17 | No protection against malformed txs        | ❌     | Malicious txs could be crafted                            |
| 18 | No replay protection across chains         | ❌     | Replay attacks possible                                   |
| 19 | No wallet encryption                       | ❌     | Private keys at risk                                      |
| 20 | No rate limiting/anti-spam                 | ❌     | Spam/DoS possible                                         |
| 21 | No block validation on commit              | ❌     | Invalid blocks could be added                             |
| 22 | No mempool expiry                          | ❌     | Pending txs never expire                                  |
| 23 | No chain finality                          | ❌     | No confirmations, risk of reorgs                          |
| 24 | No versioning/upgrade path                 | ❌     | Hard to upgrade protocol                                  |
| 25 | No logging/auditing                        | ❌     | Hard to debug or audit                                    |

**See the code and comments for more details on each limitation.**

---

## Extending the Blockchain

- **Add Transaction Fees**: Allow transactions to specify a fee, which is added to the miner's reward.
- **Networking**: Implement peer-to-peer networking for block and transaction propagation.
- **Consensus**: Add logic to resolve forks and select the longest valid chain.
- **Difficulty Adjustment**: Dynamically adjust mining difficulty based on block times.
- **Smart Contracts**: Add a scripting language or virtual machine for programmable transactions.

---

## Contributing & Sharing Improvements

If you make improvements, fix bugs, or add new features to this blockchain project, **please consider sharing your code!**

- **How to contribute:**
  1. Fork this repository or copy the code to your own repository.
  2. Make your changes and improvements.
  3. Submit a pull request or share a link to your repository with a description of your changes.

**Your contributions can help others learn and make this educational blockchain even better!**

If you want to contact me, here my email: **agentksined@gmail.com**

---

## License

This project is for educational and prototyping purposes only.  
No warranty or guarantee of security or fitness for production use.

---

**Happy hacking and learning!**