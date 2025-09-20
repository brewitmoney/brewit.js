# Brewit Account Versioning System

This document explains how to use the versioned constants system for Brewit smart accounts to maintain backward compatibility when contract addresses change.

## Problem Solved

When validator contracts or other constants are updated (e.g., due to bug fixes), older accounts need to continue using their original constants to generate the same address, while new accounts can use the updated constants.

## Solution Overview

The versioned constants system provides:

- **Backward Compatibility**: Old accounts continue using their original constants
- **Forward Compatibility**: New accounts can use updated constants  
- **Version Detection**: Automatically detect account versions
- **Migration Support**: Clear path for upgrading accounts
- **Type Safety**: Full TypeScript support for all versions

## Usage Examples

### 1. Creating a New Account (Latest Version)

```typescript
import { toValidatorAccount } from './src/account/brewit/toValidatorAccount';
import { getVersionForNewBrewitAccount } from './src/utils/brewit-version';

const account = await toValidatorAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: mySigner,
  safeAddress: undefined, // Will be generated
  config: { validator: 'passkey' },
  version: getVersionForNewBrewitAccount(), // Uses latest version (1.2.0)
});
```

### 2. Working with Existing Account (Auto-detect Version)

```typescript
import { toValidatorAccount } from './src/account/brewit/toValidatorAccount';
import { detectBrewitAccountVersion } from './src/utils/brewit-version';

// Detect the version of an existing account
const detectedVersion = await detectBrewitAccountVersion(client, accountAddress);

const account = await toValidatorAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: mySigner,
  safeAddress: existingAccountAddress,
  config: { validator: 'passkey' },
  version: detectedVersion, // Use detected version for compatibility
});
```

### 3. Force Specific Version (Testing)

```typescript
import { toValidatorAccount } from './src/account/brewit/toValidatorAccount';

const account = await toValidatorAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: mySigner,
  safeAddress: undefined,
  config: { validator: 'passkey' },
  version: '1.0.0', // Force specific version for testing
});
```

### 4. Migration Scenario

```typescript
import { detectBrewitAccountVersion, needsBrewitMigration } from './src/utils/brewit-version';

const currentVersion = await detectBrewitAccountVersion(client, accountAddress);

if (needsBrewitMigration(currentVersion)) {
  console.log(`Account needs migration from ${currentVersion} to 1.2.0`);
  
  // Create new account with latest version
  const newAccount = await toValidatorAccount({
    // ... params
    version: '1.2.0',
  });
  
  // Transfer assets from old to new account
  // Update your application to use the new account
}
```

## Version Management

### Available Versions

- **1.0.0**: Original constants (backward compatibility)
- **1.1.0**: Updated constants with bug fixes
- **1.2.0**: Latest constants (default for new accounts)

### Adding New Versions

When you need to update constants:

1. Add new version to `BREWIT_VERSION_TYPE` in `src/constants/brewit.ts`
2. Add new version entry to `BrewitVersionToConstantsMap`
3. Update `DEFAULT_BREWIT_VERSION` to the latest version
4. Test with both old and new versions

### Example: Adding Version 1.3.0

```typescript
// In src/constants/brewit.ts
export type BREWIT_VERSION_TYPE = '1.0.0' | '1.1.0' | '1.2.0' | '1.3.0';

export const BrewitVersionToConstantsMap = {
  // ... existing versions
  '1.3.0': {
    safe4337ModuleAddress: '0x...', // Updated address
    erc7579LaunchpadAddress: '0x...', // Updated address
    // ... other constants
  },
};

export const DEFAULT_BREWIT_VERSION: BREWIT_VERSION_TYPE = '1.3.0';
```

## Key Benefits

1. **No Breaking Changes**: Existing accounts continue to work
2. **Gradual Migration**: Update constants without affecting existing accounts
3. **Clear Versioning**: Easy to track which accounts use which constants
4. **Future-Proof**: Easy to add new versions as needed
5. **Testing Support**: Can test with specific versions

## Best Practices

1. **New Accounts**: Always use latest version
2. **Existing Accounts**: Auto-detect version and use appropriate constants
3. **Testing**: Use specific versions for testing different scenarios
4. **Migration**: Plan gradual migration when needed
5. **Documentation**: Document changes when adding new versions

## File Structure

```
src/
├── constants/
│   └── brewit.ts              # Versioned constants definitions
├── lib/
│   └── smartaccount/
│       └── index.ts           # Updated to support versioning
├── account/
│   └── brewit/
│       └── toValidatorAccount.ts  # Updated to use versioned constants
├── utils/
│   └── brewit-version.ts      # Version detection and management utilities
└── examples/
    └── brewit-versioned-usage.ts  # Usage examples
```

This system ensures that when you update validator contracts or other constants, older accounts continue to generate the same address while new accounts can benefit from the updates.
