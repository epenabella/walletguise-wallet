# Solana Wallet Extension with WalletGuise Integration

A [Wallet Standard](https://github.com/wallet-standard/wallet-standard) secure chrome browser extension wallet for Solana that creates pre-funded wallets through proof-of-work clue solving.

## 🎯 Unique Value Proposition

**First-of-its-kind Solana wallet that converts puzzle-solving into auto-refilled - pre-funded wallets**

### Why This Matters

- **Zero barrier to entry**: Users get SOL without buying or faucets
- **Proof-of-work validation**: Prevents bot farming through auto PoW challenges
- **Educational onboarding**: Learn Solana & crypto without spending time & money to start

## 🚀 Key Features

### Core Wallet Functions

- **Secure key management**: Encrypted private key storage
- **Network flexibility**: Mainnet, Devnet, and Testnet support
- **Transaction handling**: Send/receive SOL with confirmation modals
- **Settings & security**: Private key deletion with multi-step confirmation

### Unique Features

- **WalletGuise Integration**: Connect to clue-solving dApp
- **Proof-of-Work Rewards**: Earn SOL with quick background PoW
- **Pre-funded Wallets**: Created wallets start with SOL balance good enough for 10-100 transactions?

## 🏁 Hackathon Development Strategy

### Features We Prioritized

1. **Security-first approach**: Multi-step wallet creattion & deletion prevents accidental loss
2. **Seamless WalletGuise dApp connection**: One-click integration with clue-solving platform
3. **Intuitive UX**: Familiar wallet interface with unique proof-of-work twist

### Why These Decisions

- **Market gap**: No existing Solana wallet offers proof-of-work funded creation
- **User acquisition**: KYC free & preloaded onboarding enables & attracts non-crypto users
- **Technical feasibility**: It already works on dev & mainnet

## 🔍 Competitive Landscape

### Current Market

- **Traditional wallets**: Phantom, Solflare, Backpack - require SOL purchase
- **Bitcoin faucets**: Solve CAPTCHAs for tiny rewards

### Our Advantage

- **Meaningful rewards**: Real usable SOL amounts
- **Skill-based distribution**: Clues prevent bot farming
- **Educational value**: Learn while staying anonymous for free

## ⚡ Quick Start

```bash
pnpm dev  # Development
pnpm build  # Production build
```

Load `build/chrome-mv3-dev` in Chrome for testing.

## 🔧 Technical Stack

- **Framework**: Plasmo (TypeScript)
- **Frontend**: Svelte + TailwindCSS
- **Blockchain**: Solana Web3.js
- **Storage**: Encrypted local storage
- **Integration**: WalletGuise dApp connector

---

**Built with ❤️ for the Solana ecosystem**

pnpm config set @wallet-guise:registry https://gitea.epenabella.com/api/packages/ricalski/npm/
pnpm config set //gitea.epenabella.com/api/packages/ricalski/npm/:\_authToken "gitea auth token"
pnpm add @wallet-guise/shared
