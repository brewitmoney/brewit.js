# brewit-js
JavaScript SDK for Humans and Agents - Accounts, Delegations and Automations

## Installation

```bash
# npm
npm install brewit

# pnpm
pnpm install brewit

# yarn
yarn add brewit

# bun
bun install brewit
```

## Usage

### Create a main account

```ts
import { toAccount } from 'brewit';

const mainAccount = await toAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: privateKeyToAccount('0x...'),
  type: 'main',
  config: { validator: 'ownable' },
});
```

### Create a delegated account

```ts
import { toAccount } from 'brewit';
import { createDelegatedAccount } from 'brewit/delegation';


// Define the validator and policy for the delegated account
const validator = {
  address: '0xValidatorAddress', // Validator contract address
  initData: '0x...',             // Validator initialization data
  salt: '0x...',                 // Unique salt for the delegated account
};

const policyParams = {
  policy: 'spendlimit', // or 'sudo'
  tokenLimits: [{ token: '0xTokenAddress', amount: 1000000000000000000n }],
};

const txs = await createDelegatedAccount(mainAccount, validator, policyParams);
// Send these transactions using the main account and client
```


### Get delegated account details

```ts
import { getDelegatedAccount } from 'brewit/delegation';

// Fetch delegated account info
const delegatedInfo = await getDelegatedAccount(
  publicClient, // viem PublicClient instance
  tokens,       // Array of tokens to check
  mainAccount.address,
  validator,
  'spendlimit'  // or 'sudo'
);

```


### Use a delegated account


```ts
import { toAccount } from 'brewit/account';

const account = await toAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: privateKeyToAccount('0x...'),
  type: 'delegated',
  config: { validator: 'ownable', validatorInitData: '0x...', salt: '0x...' },
});
```


### Update a delegated account

```ts
import { updateDelegatedAccount } from 'brewit/delegation';

// Update the policy or validator for the delegated account
const updatedPolicyParams = {
  policy: 'spendlimit',
  tokenLimits: [{ token: '0xTokenAddress', amount: 2000000000000000000n }],
};

const updateTxs = await updateDelegatedAccount(mainAccount, updatedPolicyParams, validator);
// Send these transactions using the main account and client
```

### Remove a delegated account

```ts
import { removeDelegatedAccount } from 'brewit/delegation';

const removeTxs = await removeDelegatedAccount(mainAccount, validator);
// Send these transactions using the main account and client
```

### Send a transaction

```ts
import { createAccountClient } from 'brewit';

const client = createAccountClient(account, bundlerUrl);

const tx = await client.sendTransaction(calls: {
  to: '0x...00',
  value: 0,   
  data: '0x'
});
```
