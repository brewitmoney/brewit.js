import {
  Hex,
  PublicClient,
  http,
  Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { entryPoint07Address } from 'viem/account-abstraction';

import { toSafeSmartAccount, ToSafeSmartAccountReturnType } from 'permissionless/accounts';
import { getBrewitConstants, DEFAULT_BREWIT_VERSION } from '../../constants/brewit';
import { BREWIT_VERSION_TYPE } from '../../types';


interface SmartAccountClientParams {
  client: PublicClient;
  signer?: any;
  nonceKey?: bigint;
  address?: Hex;
  signUserOperation?: any;
  getDummySignature?: any;
  validators?: { address: Address; context: Hex }[];
  executors?: { address: Address; context: Hex }[];
  validatorAddress?: Address;
  factoryAddress?: Address;
  // Add version parameter for Brewit account versioning
  version?: BREWIT_VERSION_TYPE;
}

export const getSmartAccount = async ({
  client,
  nonceKey,
  signer,
  address,
  signUserOperation,
  getDummySignature,
  validators,
  executors,
  version = DEFAULT_BREWIT_VERSION, // Default to latest version
}: SmartAccountClientParams): Promise<ToSafeSmartAccountReturnType<'0.7'>> => {

  // Get versioned constants
  const constants = getBrewitConstants(version);

  // Create a dummy private key signer
  const dummyPrivateKey = generatePrivateKey(); // Generate a dummy private key
  const dummySigner = privateKeyToAccount(dummyPrivateKey); // Create an account from the private key
  dummySigner.address = constants.defaultSafeSignerAddress;

  // Use the dummy signer if no signer is provided
  signer = signer || dummySigner;

  const account = await toSafeSmartAccount({
    client: client,
    owners: [signer],
    address: address,
    version: '1.4.1',
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
    validators,
    executors,
    nonceKey,
    safe4337ModuleAddress: constants.safe4337ModuleAddress,
    erc7579LaunchpadAddress: constants.erc7579LaunchpadAddress,
    safeSingletonAddress: constants.safeSingletonAddress,
    attesters: constants.attesters,
    attestersThreshold: constants.attestersThreshold,
  });
  

  account.signUserOperation = signUserOperation ?? account.signUserOperation;
  account.getStubSignature = getDummySignature ?? account.getStubSignature;

  return account;

};

// Rhinestone V2 Safe flow (Safe singleton + setup + addSafe7579 with flat ModuleInit[])
export {
  getSmartAccountRhinestoneV2,
  getDeployArgsRhinestoneV2,
  getAddressFromDeployArgs,
  type GetSmartAccountRhinestoneV2Params,
  type RhinestoneV2DeployArgs,
} from './rhinestoneV2';