# MultiSig Wallet

## Research and planning

This implementation follows the core patterns used by production multi-signature wallets:

- Safe documents the standard model of `owners + threshold + transaction execution` for smart-account security and governance: <https://docs.safe.global/advanced/smart-account-concepts>
- Safe's architecture overview explains why threshold approval removes the single-key failure mode of EOAs and why multi-sig is widely used in DeFi treasury management: <https://docs.safe.global/advanced/smart-account-overview>
- The original Gnosis / ConsenSys Mesh multi-sig repository shows the long-lived baseline pattern of transaction submission, confirmation tracking, and threshold-based execution: <https://github.com/ConsenSysMesh/MultiSigWallet>
- OpenZeppelin's security docs reinforce the need for careful external-call handling and reentrancy-aware design when a contract executes arbitrary calls: <https://docs.openzeppelin.com/contracts/5.x/api/utils>

## Requirements chosen for this contract

- Owners are configured once in the constructor and remain fixed.
- The wallet accepts any number of owners greater than zero.
- `required` confirmations must be between `1` and the number of owners.
- The transaction lifecycle is explicit:
  1. submission
  2. confirmation
  3. optional revocation before execution
  4. execution after the threshold is met
- Transactions support arbitrary `to`, `value`, and `data`, so the same wallet can:
  - transfer Ether
  - call ERC20 `transfer`
  - invoke any other contract method

The owner set is intentionally static in this version. That reduces complexity and avoids introducing another privileged administration path while still satisfying the core multi-sig wallet assignment.

## Contract design

`contracts/MultiSigWallet.sol` uses:

- `address[] s_owners` and `mapping(address => bool) public isOwner` for owner membership
- `uint256 public immutable required` for the confirmation threshold
- `Transaction[] private s_transactions` for submitted proposals
- `mapping(uint256 => mapping(address => bool))` for per-owner confirmations

Each transaction stores:

- target address
- Ether value
- calldata payload
- execution status
- current confirmation count

## Security considerations

- Only owners can submit, confirm, revoke, or execute transactions.
- Constructor validation rejects zero addresses, duplicate owners, and invalid thresholds.
- Execution follows checks-effects-interactions by marking a transaction executed before the external call.
- Failed external calls revert and bubble the original revert data when available.
- Revocation is blocked after execution to preserve transaction finality.
- Event logs provide an auditable history for deposits, submissions, confirmations, revocations, and execution.

This is still a teaching implementation, not a full Safe replacement. It does not include modules, batched transactions, signature aggregation, guards, timelocks, or owner management after deployment.

## Deployment

Local compile and test:

```bash
npm run compile
npm test
```

Sepolia deployment script:

```powershell
$env:MULTISIG_OWNERS="0xOwner1,0xOwner2,0xOwner3"
$env:MULTISIG_CONFIRMATIONS="2"
npm run deploy:multisig
```

The script reads:

- `MULTISIG_OWNERS`: comma-separated owner addresses
- `MULTISIG_CONFIRMATIONS`: threshold required for execution
- `SEPOLIA_RPC_URL` and `PRIVATE_KEY`: already used by the repo's Hardhat config

## Interaction flow

1. Fund the wallet by sending Ether to the contract address.
2. An owner calls `submitTransaction(to, value, data)`.
3. Owners call `confirmTransaction(txId)` until the threshold is met.
4. Any owner calls `executeTransaction(txId)`.
5. Before execution, a confirming owner may call `revokeConfirmation(txId)`.

For token transfers, encode the ERC20 call data for `transfer(recipient, amount)` and submit it as the transaction `data` field with `value = 0`.

## Tests included

`test/MultiSigWallet.ts` covers:

- deployment and initialization
- transaction submission
- confirmation and revocation
- Ether execution after threshold approval
- ERC20 transfer execution through arbitrary call data
- duplicate confirmation rejection
- unauthorized access rejection
- invalid transaction id handling

## Role in DeFi and governance

Multi-signature wallets reduce key-person risk by distributing control across multiple participants. In DeFi, that matters for treasury custody, protocol upgrades, emergency actions, and DAO operations where a single compromised signer should not be able to move funds or change critical state alone. The threshold model adds operational friction by design, but that friction is the security feature.
