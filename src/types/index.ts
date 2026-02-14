import { Address, Hex } from 'viem';

export type BREWIT_VERSION_TYPE = '1.0.0' | '1.1.0' | '1.2.0';

export interface Transaction {
  to: Hex;
  value: bigint;
  data: Hex;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  iconUrl: string;
  tokenId?: string;
  type?: string;
  price?: number;
  totalSupply?: number;
  priceChange1d?: number;
  pricePercentChange1d?: number;
}

export interface Token extends TokenInfo {
  balance?: string;
  usdValue?: number;
  spendlimit?: any;
  permissions?: {
    spend: boolean;
    swap: boolean;
  };
  chain?: {
    id: string;
    chainId?: number;
    name: string;
  };
  quantity?: {
    int: string;
    decimals: number;
    float: number;
    numeric: string;
  };
  chains?: {
    chain: {
      id: string;
      chainId?: number;
      name: string;
    };
    balance: string;
    usdValue: number;
    address: Address;
  }[];
}
export type AccountType = 'main' | 'delegated';
export type BaseAccountParams = {
  chainId: number;
  rpcEndpoint: string;
  signer: any;
  safeAddress?: Hex;
  type?: AccountType;
  useValidator?: boolean;
  /** Brewit account version (e.g. '1.0.0', '1.1.0', '1.2.0'). Pass from client to use versioned constants. */
  version?: BREWIT_VERSION_TYPE;
};

export type MainAccountConfig = {
  validator: ValidatorType;
};

export type DelegatedAccountConfig = {
  validator: ValidatorType;
  salt: Hex;
  validatorInitData: Hex;
};



export type DelegatedAccountParams = BaseAccountParams & {
  config: DelegatedAccountConfig;
};

export type MainAccountParams = BaseAccountParams & {
  config: MainAccountConfig;
};

export type AccountParams = MainAccountParams | DelegatedAccountParams;

// Runtime type guard
export const isDelegatedConfig = (config: MainAccountConfig | DelegatedAccountConfig): config is DelegatedAccountConfig => {
  return 'salt' in config && 'validatorInitData' in config;
};

export type ValidatorType = 'passkey' | 'ownable';

export type PolicyType = 'spendlimit' | 'sudo';

// Define an interface for the account info
export interface AuthInfo {
  authType: 'normal' | 'validator' | 'session';
  validator?: ValidatorType;
  authData: any; // Replace 'any' with a more specific type if known
}

export interface Subaccount {
  name: string;
  validator: ValidatorType;
  policy: PolicyType;
  validatorInitData: Hex;
  salt: Hex;
  accountAddress: Hex;
  tag: string;
  chainid: number;
  created_at?: string;
}

export interface AccountInfo {
  authInfo?: AuthInfo;
  subaccounts?: Subaccount[];
  address?: Hex;
  userInfo?: UserInfo;
}

export interface UserInfo {
  name: string;
  email: string;
  avatar: string;
  bio?: string;
}

export interface BasePolicyParams {
  policy: PolicyType;
}

export interface SpendLimitTokenLimit {
  token: Address;
  amount: bigint;
}

export interface SpendLimitParams extends BasePolicyParams {
  policy: 'spendlimit';
  tokenLimits: SpendLimitTokenLimit[];
}

export interface SudoTokenAccess {
  token: Address;
  isTransferEnabled: boolean;
  isSwapEnabled: boolean;
}

export interface SudoParams extends BasePolicyParams {
  policy: 'sudo';
  tokenAccess: SudoTokenAccess[];
}


export type PolicyParams = SpendLimitParams | SudoParams;
