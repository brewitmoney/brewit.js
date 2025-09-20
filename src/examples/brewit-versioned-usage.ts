import { toValidatorAccount } from '../account/brewit/toValidatorAccount';
import { detectBrewitAccountVersion, getVersionForNewBrewitAccount } from '../utils/brewit-version';
import { BREWIT_VERSION_TYPE } from '../constants/brewit';

// Example 1: Creating a new Brewit account with latest version
export const createNewBrewitAccount = async (params: any) => {
  const version = getVersionForNewBrewitAccount(); // '1.2.0'
  
  return await toValidatorAccount({
    ...params,
    version, // Explicitly set to latest
  });
};

// Example 2: Working with existing account - auto-detect version
export const workWithExistingBrewitAccount = async (params: any) => {
  const client = params.client;
  const accountAddress = params.safeAddress;
  
  // Detect the version of the existing account
  const detectedVersion = await detectBrewitAccountVersion(client, accountAddress);
  
  if (!detectedVersion) {
    throw new Error('Could not detect Brewit account version');
  }
  
  console.log(`Detected Brewit account version: ${detectedVersion}`);
  
  // Use the detected version to ensure compatibility
  return await toValidatorAccount({
    ...params,
    version: detectedVersion,
  });
};

// Example 3: Force specific version for testing
export const createBrewitAccountWithSpecificVersion = async (params: any, version: BREWIT_VERSION_TYPE) => {
  return await toValidatorAccount({
    ...params,
    version, // Use specific version
  });
};

// Example 4: Migration scenario
export const migrateBrewitAccount = async (params: any) => {
  const client = params.client;
  const accountAddress = params.safeAddress;
  
  const currentVersion = await detectBrewitAccountVersion(client, accountAddress);
  
  if (!currentVersion) {
    throw new Error('Could not detect current Brewit account version');
  }
  
  // Check if migration is needed
  if (currentVersion === '1.1.0') {
    console.log('Brewit account is already at latest version');
    return await toValidatorAccount({ ...params, version: currentVersion });
  }
  
  // For migration, you would typically:
  // 1. Create a new account with the latest version
  // 2. Transfer assets from old to new account
  // 3. Update your application to use the new account
  
  console.log(`Brewit account needs migration from ${currentVersion} to 1.2.0`);
  // Implementation would go here...
};

// Example 5: Backward compatibility - ensure old accounts work
export const ensureBackwardCompatibility = async (params: any) => {
  const client = params.client;
  const accountAddress = params.safeAddress;
  
  // Try to detect version, fallback to oldest if detection fails
  const detectedVersion = await detectBrewitAccountVersion(client, accountAddress) || '1.0.0';
  
  console.log(`Using Brewit account version: ${detectedVersion}`);
  
  return await toValidatorAccount({
    ...params,
    version: detectedVersion,
  });
};
