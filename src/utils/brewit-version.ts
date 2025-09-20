import { Address, Hex } from 'viem';
import { BREWIT_VERSION_TYPE, getBrewitConstants, DEFAULT_BREWIT_VERSION } from '../constants/brewit';

// Function to detect account version based on deployed contract addresses
export const detectBrewitAccountVersion = async (
  client: any,
  accountAddress: Address
): Promise<BREWIT_VERSION_TYPE | null> => {
  try {
    // Read the account's implementation address
    const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    const implementationAddress = await client.getStorageAt({
      address: accountAddress,
      slot: implementationSlot,
    });

    // Compare with known implementation addresses for each version
    for (const version of ['1.2.0', '1.1.0', '1.0.0'] as BREWIT_VERSION_TYPE[]) {
      const constants = getBrewitConstants(version);
      if (implementationAddress.toLowerCase() === constants.safeSingletonAddress.toLowerCase()) {
        return version;
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting Brewit account version:', error);
    return null;
  }
};

// Function to get the appropriate version for a new account
export const getVersionForNewBrewitAccount = (): BREWIT_VERSION_TYPE => {
  return DEFAULT_BREWIT_VERSION; // Always use latest for new accounts
};

// Function to check if an account needs migration
export const needsBrewitMigration = (
  currentVersion: BREWIT_VERSION_TYPE,
  targetVersion: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): boolean => {
  const versionOrder: BREWIT_VERSION_TYPE[] = ['1.0.0', '1.1.0'];
  const currentIndex = versionOrder.indexOf(currentVersion);
  const targetIndex = versionOrder.indexOf(targetVersion);
  
  return currentIndex < targetIndex;
};

// Migration helper
export const getBrewitMigrationPath = (
  fromVersion: BREWIT_VERSION_TYPE,
  toVersion: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): BREWIT_VERSION_TYPE[] => {
  const versionOrder: BREWIT_VERSION_TYPE[] = ['1.0.0', '1.1.0'];
  const fromIndex = versionOrder.indexOf(fromVersion);
  const toIndex = versionOrder.indexOf(toVersion);
  
  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    return [];
  }
  
  return versionOrder.slice(fromIndex + 1, toIndex + 1);
};

// Function to get version info for debugging
export const getBrewitVersionInfo = (version: BREWIT_VERSION_TYPE) => {
  const constants = getBrewitConstants(version);
  return {
    version,
    safeSingletonAddress: constants.safeSingletonAddress,
    safe4337ModuleAddress: constants.safe4337ModuleAddress,
    erc7579LaunchpadAddress: constants.erc7579LaunchpadAddress,
    validators: constants.validators,
    attesters: constants.attesters,
  };
};
