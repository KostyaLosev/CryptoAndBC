# CryptoAndBC

Upgradeable `KosToken` assignment using the UUPS pattern on top of `ERC1967Proxy`.

This repository now also includes a constructor-configured multi-signature wallet for Ether and token transfers.

## Contracts

- `contracts/KosTokenV1.sol` - initial ERC20 implementation with `mint`
- `contracts/KosTokenProxy.sol` - proxy contract based on `ERC1967Proxy`
- `contracts/KosTokenV2.sol` - upgraded implementation with `version()`
- `contracts/MultiSigWallet.sol` - fixed-owner multi-sig wallet with threshold-based execution
- `contracts/MultiSigWalletTarget.sol` - simple execution target used by tests

## Install

```bash
npm install
```

## Test locally

```bash
npm run compile
npm test
```

## Multi-sig wallet

- Documentation and analysis: `docs/MultiSigWallet.md`
- Deployment script: `npm run deploy:multisig`
- Tests: `test/MultiSigWallet.ts`

Required environment variables for Sepolia deployment:

```dotenv
MULTISIG_OWNERS=0xOwner1,0xOwner2,0xOwner3
MULTISIG_CONFIRMATIONS=2
```

## Sepolia deployment flow

1. Fill `.env` from `.env.example`
2. Deploy implementation V1 and proxy

```bash
npm run deploy:kostoken:v1
```

3. Mint and transfer through the proxy

```bash
npm run interact:kostoken:v1
```

4. Upgrade proxy to V2

```bash
npm run upgrade:kostoken:v2
```

5. Validate balances and `version()`

```bash
npm run check:kostoken:v2
```

Each script writes and reuses `deployments/sepolia-kostoken.json`.

## What to submit

- Explorer link for V1 implementation deployment
- Explorer link for proxy deployment
- Explorer link for mint transaction through proxy
- Explorer link for transfer transaction through proxy
- Explorer link for upgrade transaction
- Screenshot or log showing balances before upgrade
- Screenshot or log showing balances after upgrade
- Screenshot or log showing `version()` returns `V2`
