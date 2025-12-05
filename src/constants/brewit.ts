import { Address, Hex } from 'viem';
import { BREWIT_VERSION_TYPE } from '../types';

// Define version types for Brewit accounts

// Define the structure for Brewit constants
export interface BrewitConstants {
  safe4337ModuleAddress: Address;
  erc7579LaunchpadAddress: Address;
  safeSingletonAddress: Address;
  attesters: Address[];
  attestersThreshold: number;
  validators: {
    ownableValidator: Address;
    webauthnValidator: Address;
    webauthnSessionValidator: Address;
  };
  policies: {
    spendLimitPolicy: Address;
    sudoPolicy: Address;
  };
  smartSessions: Address;
  defaultSafeSignerAddress: Address;
}

// Versioned constants mapping
export const BrewitVersionToConstantsMap: {
  [key in BREWIT_VERSION_TYPE]: BrewitConstants;
} = {
  '1.0.0': {
    // Original constants - maintain for backward compatibility
    safe4337ModuleAddress: '0x7579EE8307284F293B1927136486880611F20002',
    erc7579LaunchpadAddress: '0x7579011aB74c46090561ea277Ba79D510c6C00ff',
    safeSingletonAddress: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762',
    attesters: [
      '0x000000333034E9f539ce08819E12c1b8Cb29084d', // RHINESTONE_ATTESTER_ADDRESS
      '0xC9e29745a752B551a7FCD19Afe50EcCEf5fd7d02', // BREWIT_ATTESTER_ADDRESS
    ],
    attestersThreshold: 1,
    validators: {
      ownableValidator: '0x2483DA3A338895199E5e538530213157e931Bf06', // OWNABLE_VALIDATOR_ADDRESS
      webauthnValidator: '0x2f167e55d42584f65e2e30a748f41ee75a311414', // WEBAUTHN_VALIDATOR_ADDRESS
      webauthnSessionValidator: '0x4853727f59C3C161a58E153E2B0F9F683EcFB9Df',
    },
    policies: {
      spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
      sudoPolicy: '0x0000003111cD8e92337C100F22B7A9dbf8DEE301',
    },
    smartSessions: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE', // SMART_SESSIONS_ADDRESS
    defaultSafeSignerAddress: '0x000000000000000000000000000000000000dEaD',
  },
  '1.1.0': {
    // Updated constants with bug fixes
    safe4337ModuleAddress: '0x7579EE8307284F293B1927136486880611F20002', // Same as v1.0.0
    erc7579LaunchpadAddress: '0x7579011aB74c46090561ea277Ba79D510c6C00ff', // Same as v1.0.0
    safeSingletonAddress: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762', // Same as v1.0.0
    attesters: [
      '0x000000333034E9f539ce08819E12c1b8Cb29084d', // RHINESTONE_ATTESTER_ADDRESS
      '0xC9e29745a752B551a7FCD19Afe50EcCEf5fd7d02', // BREWIT_ATTESTER_ADDRESS
    ],
    attestersThreshold: 1,
    validators: {
      ownableValidator: '0x2483DA3A338895199E5e538530213157e931Bf06', // Updated OWNABLE_VALIDATOR_ADDRESS
      webauthnValidator: '0x7ab16Ff354AcB328452F1D445b3Ddee9a91e9e69', // Updated WEBAUTHN_VALIDATOR_ADDRESS
      webauthnSessionValidator: '0x4853727f59C3C161a58E153E2B0F9F683EcFB9Df', // Same
    },
    policies: {
      spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08', // Same
      sudoPolicy: '0x0000003111cD8e92337C100F22B7A9dbf8DEE301', // Same
    },
    smartSessions: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE', // Updated SMART_SESSIONS_ADDRESS
    defaultSafeSignerAddress: '0x000000000000000000000000000000000000dEaD', // Same
  },
  '1.2.0': {
    safe4337ModuleAddress: '0x7579f2AD53b01c3D8779Fe17928e0D48885B0003', // Same as v1.0.0
    erc7579LaunchpadAddress: '0x75798463024Bda64D83c94A64Bc7D7eaB41300eF', // Same as v1.0.0
    safeSingletonAddress: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762', // Same as v1.0.0
    attesters: [
      '0x000000333034E9f539ce08819E12c1b8Cb29084d', // RHINESTONE_ATTESTER_ADDRESS
      '0xC9e29745a752B551a7FCD19Afe50EcCEf5fd7d02', // BREWIT_ATTESTER_ADDRESS
    ],
    attestersThreshold: 1,
    validators: {
      ownableValidator: '0x2483DA3A338895199E5e538530213157e931Bf06', // Updated OWNABLE_VALIDATOR_ADDRESS
      webauthnValidator: '0x0000000000578c4cB0e472a5462da43C495C3F33', // Updated WEBAUTHN_VALIDATOR_ADDRESS
      webauthnSessionValidator: '0x4853727f59C3C161a58E153E2B0F9F683EcFB9Df', // Same
    },
    policies: {
      spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08', // Same
      sudoPolicy: '0x0000003111cD8e92337C100F22B7A9dbf8DEE301', // Same
    },
    smartSessions: '0x00000000008bdaba73cd9815d79069c247eb4bda', // Updated SMART_SESSIONS_ADDRESS
    defaultSafeSignerAddress: '0x000000000000000000000000000000000000dEaD', // Same
  }
};

// Version constants
export const BREWIT_V1_0_0: BREWIT_VERSION_TYPE = '1.0.0';
export const BREWIT_V1_1_0: BREWIT_VERSION_TYPE = '1.1.0';
export const BREWIT_V1_2_0: BREWIT_VERSION_TYPE = '1.2.0';

// Default version (latest)
export const DEFAULT_BREWIT_VERSION: BREWIT_VERSION_TYPE = BREWIT_V1_1_0;

// Helper function to get constants by version
export const getBrewitConstants = (version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION): BrewitConstants => {
  return BrewitVersionToConstantsMap[version];
};

// Helper function to get specific constant by version
export const getBrewitConstant = <K extends keyof BrewitConstants>(
  key: K,
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): BrewitConstants[K] => {
  return BrewitVersionToConstantsMap[version][key];
};
