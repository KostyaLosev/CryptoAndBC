# CryptoAndBC

Upgradeable `KosToken` assignment using the UUPS pattern on top of `ERC1967Proxy`.

## Contracts

- `contracts/KosTokenV1.sol` - initial ERC20 implementation with `mint`
- `contracts/KosTokenProxy.sol` - proxy contract based on `ERC1967Proxy`
- `contracts/KosTokenV2.sol` - upgraded implementation with `version()`

## Install

```bash
npm install
```

## Test locally

```bash
npm run compile
npm test
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
