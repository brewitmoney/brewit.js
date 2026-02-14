import { SmartAccount } from "viem/account-abstraction";
import { buildDisableActionPolicies, buildEnableActionPolicies, buildEnableSmartSession, buildInstallSmartSessionModule, buildRemoveSession } from "../lib/smartaccount/modules/smartsessions"
import { PolicyParams, PolicyType, Token, Transaction } from "../types";
import { Address, Hex, PublicClient } from "viem";
import { getSessionValidator } from "../lib/smartaccount/auth";
import { getSpendLimitTokensInfo, getSudoAccessTokensInfo } from "../lib/smartaccount/modules/smartsessions/util";
import { DEFAULT_BREWIT_VERSION } from "../constants/brewit";
import { BREWIT_VERSION_TYPE } from "../types";

export async function createDelegatedAccount(
  account: SmartAccount,
  validator: { address: Address; initData: Hex; salt?: Hex },
  policyParams: PolicyParams,
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
): Promise<Transaction[]> {
  const createDelegatedAccountTx: Transaction[] = [];

  const installSmartSessionModuleTx = await buildInstallSmartSessionModule(account, version);
  if (installSmartSessionModuleTx) {
    createDelegatedAccountTx.push(installSmartSessionModuleTx);
  }

  const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId();
  createDelegatedAccountTx.push(
    await buildEnableSmartSession(chainId, policyParams, validator, version)
  );

  return createDelegatedAccountTx;
}

export async function updateDelegatedAccount(
  account: SmartAccount,
  policyParams: PolicyParams,
  validator: { address: Address; initData: Hex; salt?: Hex },
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
) {
  const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId();

  const disableActions = await buildDisableActionPolicies(
    chainId,
    policyParams,
    validator,
    version
  );

  const enableActions = await buildEnableActionPolicies(
    chainId,
    policyParams,
    validator,
    version
  );

  return [...disableActions, ...enableActions];
}

export async function removeDelegatedAccount(
  account: SmartAccount,
  validator: { address: Address; initData: Hex; salt?: Hex },
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
) {
  const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId();
  const disableActions = await buildRemoveSession(validator, chainId, version);
  return disableActions;
}


export async function getDelegatedAccount(
  client: PublicClient,
  tokens: Token[],
  account: Address,
  validator: { address: Address; initData: Hex; salt?: Hex },
  policy: PolicyType,
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION
) {
  let delegatedAccountInfo:
    | {
        address: Address;
        permissions: { swap: boolean; spend: boolean };
      }[]
    | {
        address: Address;
        limit: string;
        spent: string;
        balance: bigint;
      }[] = [];
  if (policy === 'spendlimit') {
    delegatedAccountInfo = await getSpendLimitTokensInfo(
      client,
      tokens,
      account,
      validator,
      version
    );
  } else if (policy === 'sudo') {
    delegatedAccountInfo = await getSudoAccessTokensInfo(
      client,
      tokens,
      account,
      validator,
      version
    );
  }
  return delegatedAccountInfo;
}