
import {
  generatePrivateKey,
  LocalAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import { encodeValidationData } from '@rhinestone/module-sdk';
import { Address, Hex } from 'viem';
import { DelegatedAccountConfig, Subaccount, ValidatorType } from '../../types';
import { getBrewitConstant, BREWIT_VERSION_TYPE, DEFAULT_BREWIT_VERSION } from '../../constants/brewit';
import { KernelValidator } from '../../types/kernel';

export const generateRandomPrivateKey = (): Hex => {
  return generatePrivateKey(); // Convert to hex string and prepend '0x'
};



export function getPKeySessionValidator(
  validator: LocalAccount, 
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): {
  validator: ValidatorType;
  address: Hex;
  initData: Hex;
  context: Hex;
} {
  return {
    validator: 'ownable',
    address: getBrewitConstant('validators', version).ownableValidator as Hex,
    context: encodeValidationData({
      threshold: 1,
      owners: [validator.address],
    }),
    initData: encodeValidationData({
      threshold: 1,
      owners: [validator.address],
    }),
  };
}

export async function getPassKeySessionValidator(
  validator: KernelValidator,
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): Promise<{ validator: string; address: Hex; initData: Hex }> {
  // Replace with proper passkey session validator
  return {
    validator: 'passkey',
    address: getBrewitConstant('validators', version).webauthnSessionValidator as Hex,
    initData: (await validator.getEnableData()) as Hex,
  };
}

export const getPassKeyValidator = async (
  validator: any, 
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
) => {
  return {
    address: getBrewitConstant('validators', version).webauthnValidator as Hex,
    context: await validator.getEnableData(),
  };
};

export function getSessionValidator(
  subaccount: DelegatedAccountConfig,
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): {
  validator: ValidatorType;
  address: Hex;
  initData: Hex;
  salt: Hex;
} {
  return {
    validator: subaccount.validator,
    address:
      subaccount.validator == 'ownable'
        ? getBrewitConstant('validators', version).ownableValidator as Hex
        : getBrewitConstant('validators', version).webauthnSessionValidator as Hex,
    initData: subaccount.validatorInitData,
    salt: subaccount.salt,
  };
}


export function formatSubAccounts(
  account: Address,
  initData: Hex,
  subaccounts: Subaccount[]
): { owned: Subaccount[]; created: Subaccount[] } {
  if (!subaccounts?.length) {
    return { owned: [], created: [] };
  }

  const normalizedAccount = account.toLowerCase();
  const normalizedInitData = initData.toLowerCase();

  return {
    created: subaccounts.filter(
      (subaccount) =>
        subaccount.accountAddress.toLowerCase() === normalizedAccount
    ),
    owned: subaccounts.filter(
      (subaccount) =>
        subaccount.validatorInitData.toLowerCase() === normalizedInitData
    ),
  };
}
