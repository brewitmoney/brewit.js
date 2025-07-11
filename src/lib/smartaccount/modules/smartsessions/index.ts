import {
  Address,
  Hex,
  parseUnits,
  PrivateKeyAccount,
  PublicClient,
  toBytes,
  toFunctionSelector,
  toHex,
} from 'viem';
import { buildInstallModule, isInstalled } from '..';
import {
  ActionData,
  EnableSessionData,
  SmartSessionMode,
  SmartSessionModeType,
} from './types';
import {
  encodeValidationData,
  getActionId,
  getDisableActionPoliciesAction,
  getEnableActionPoliciesAction,
  getEnableSessionsAction,
  getRemoveSessionAction,
  getSpendingLimitsPolicy,
  getSudoPolicy,
  getPermissionId,
  Session,
} from '@rhinestone/module-sdk';
import { OWNABLE_VALIDATOR_ADDRESS, SMART_SESSIONS_ADDRESS, SPEND_LIMIT_POLICY_ADDRESS } from '../../../../constants';
import { privateKeyToAccount } from 'viem/accounts';
import { PolicyParams, Transaction } from '../../../../types';
import { SmartAccount } from 'viem/account-abstraction';

export const getSessionValidatorAccount = (
  sessionPKey: Hex
): PrivateKeyAccount => {
  const validator = privateKeyToAccount(sessionPKey);
  return validator;
};

export function getSessionValidatorDetails(validatorAccount: Hex) {
  return {
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData: encodeValidationData({
      threshold: 1,
      owners: [validatorAccount],
    }),
  };
}

export const buildInstallSmartSessionModule = async (
  account: SmartAccount
): Promise<Transaction | null> => {

  const isModuleInstalled = await isInstalled(
    account,
    SMART_SESSIONS_ADDRESS,
    'validator'
  );

  if (!isModuleInstalled) {
    return await buildInstallModule(
      account,
      SMART_SESSIONS_ADDRESS,
      'validator',
      '0x'
    );
  }
  return null;
};

export const buildUseSmartSession = async (
  chainId: number,
  validator: {
    address: Address;
    initData: Hex;
    salt?: Hex;
  }
): Promise<{
  mode: SmartSessionModeType;
  permissionId: Hex;
  signature: Hex;
  enableSessionData?: EnableSessionData;
}> => {
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const sessionDetails = {
    permissionId: getPermissionId({ session }),
    mode: SmartSessionMode.USE,
    signature: '0x' as Hex,
  };

  return sessionDetails;
};





export const buildEnableSmartSession = async (
  chainId: number,
  policyParams: PolicyParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction> => {

  let actions: ActionData[] = [];
  const transferSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });
  if (policyParams.policy === 'spendlimit') {
    actions = await Promise.all(
      policyParams.tokenLimits.map(async ({ token, amount }) => {
        const spendingLimitsPolicy = getSpendingLimitsPolicy([
          {
            token: token,
            limit: amount,
          },
        ]);

        return {
          actionTarget: token, // an address as the target of the session execution
          actionTargetSelector: transferSelector, // function selector to be used in the execution
          actionPolicies: [
            {
              policy: SPEND_LIMIT_POLICY_ADDRESS,
              initData: spendingLimitsPolicy.initData,
            },
          ],
        };
      })
    );
  } else if (policyParams.policy === 'sudo') {
    const approveSelector = toFunctionSelector({
      name: 'approve',
      type: 'function',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'view',
    });

    // TODO: older 0x allowance selector
    // const allowanceSelector = toFunctionSelector({
    //   name: 'exec',
    //   type: 'function',
    //   inputs: [
    //     { name: 'operator', type: 'address' },
    //     { name: 'token', type: 'address' },
    //     { name: 'amount', type: 'uint256' },
    //     { name: 'target', type: 'address' },
    //     { name: 'data', type: 'bytes' },
    //   ],
    //   outputs: [{ type: 'bytes', name: 'result' }],
    //   stateMutability: 'payable',
    // });

    const LiFiDiamondContract: Address =
      '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
    const lifiSwapSelectors: Hex[] = [
      '0x5fd9ae2e', // swapTokensMultipleV3ERC20ToERC20
      '0x2c57e884', // swapTokensMultipleV3ERC20ToNative
      '0x736eac0b', // swapTokensMultipleV3NativeToERC20
      '0x4666fc80', // swapTokensSingleV3ERC20ToERC20
      '0x733214a3', // swapTokensSingleV3ERC20ToNative
      '0xaf7060fd', // swapTokensSingleV3NativeToERC20
    ];

    const KuruSwapContract: Address =
      '0xc816865f172d640d93712C68a7E1F83F3fA63235';

    const kuruSwapSelectors: Hex[] = [
      '0xffa5210a', // anyToAnySwap
    ];
    actions = lifiSwapSelectors.map((selector) => ({
      actionTarget: LiFiDiamondContract,
      actionTargetSelector: selector,
      actionPolicies: [getSudoPolicy()],
    }));
    actions.push(...kuruSwapSelectors.map((selector) => ({
      actionTarget: KuruSwapContract,
      actionTargetSelector: selector,
      actionPolicies: [getSudoPolicy()],
    })));

    const tokenActions = policyParams.tokenAccess.map((tokenAccess) => {
      const tokenActions = [];
      if (tokenAccess.isSwapEnabled) {
        tokenActions.push({
          actionTarget: tokenAccess.token,
          actionTargetSelector: approveSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
      if (tokenAccess.isTransferEnabled) {
        tokenActions.push({
          actionTarget: tokenAccess.token,
          actionTargetSelector: transferSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
      return tokenActions;
    });

    actions = [...actions, ...tokenActions.flat()];
  }
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions,
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const action = getEnableSessionsAction({ sessions: [session] });

  return {
    to: action.to,
    value: BigInt(0),
    data: action.data,
  };
};

export const buildRemoveSession = async (
  validator: {
    address: Address;
    initData: Hex;
    salt?: Hex;
  },
  chainId: number
): Promise<Transaction> => {
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const action = getRemoveSessionAction({
    permissionId: getPermissionId({ session }),
  });

  return {
    to: action.to,
    value: BigInt(0),
    data: action.data,
  };
};



export const buildDisableActionPolicies = async (
  chainId: number,
  disableActionParams: PolicyParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction[]> => {

  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const transferSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const approveSelector = toFunctionSelector({
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  let actions: Transaction[] = [];
  if (disableActionParams.policy === 'spendlimit') {
    actions = await Promise.all(
      disableActionParams.tokenLimits
        .filter((update) => update.amount == BigInt(0))
        .map(async (update) => {
          const actionId = await getActionId({
            target: update.token,
            selector: transferSelector,
          });
          const action = getDisableActionPoliciesAction({
            permissionId: getPermissionId({ session }),
            actionId: actionId,
            policies: [SPEND_LIMIT_POLICY_ADDRESS],
          });

          return {
            to: action.to,
            value: BigInt(0),
            data: action.data,
          };
        })
    );
  } else if (disableActionParams.policy === 'sudo') {
    actions = await Promise.all(
      disableActionParams.tokenAccess
        .filter(
          (update) =>
            update.isTransferEnabled === false || update.isSwapEnabled === false
        )
        .map(async (update) => {
          const removeActions = [];
          if (update.isTransferEnabled === false) {
            const action = getDisableActionPoliciesAction({
              permissionId: getPermissionId({ session }),
              actionId: await getActionId({
                target: update.token,
                selector: transferSelector,
              }),
              policies: [getSudoPolicy().policy],
            });
            removeActions.push({
              to: action.to,
              value: BigInt(0),
              data: action.data,
            });
          }
          if (update.isSwapEnabled === false) {
            const action = getDisableActionPoliciesAction({
              permissionId: getPermissionId({ session }),
              actionId: await getActionId({
                target: update.token,
                selector: approveSelector,
              }),
              policies: [getSudoPolicy().policy],
            });
            removeActions.push({
              to: action.to,
              value: BigInt(0),
              data: action.data,
            });
          }

          return removeActions;
        })
    ).then((arrays) => arrays.flat());
  }

  return actions;
};

export const buildEnableActionPolicies = async (
  chainId: number,
  enableActionParams: PolicyParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction[]> => {

  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const transferSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const approveSelector = toFunctionSelector({
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  let actions: Transaction[] = [];
  if (enableActionParams.policy === 'spendlimit') {
    actions = await Promise.all(
      enableActionParams.tokenLimits
        .filter((update) => update.amount && update.amount > BigInt(0))
        .map(async (update) => {
          const spendingLimitsPolicy = getSpendingLimitsPolicy([
            {
              token: update.token,
              limit: update.amount,
            },
          ]);

          const action = getEnableActionPoliciesAction({
            permissionId: getPermissionId({ session }),
            actionPolicies: [
              {
                actionTarget: update.token,
                actionTargetSelector: transferSelector,
                actionPolicies: [
                  {
                    policy: SPEND_LIMIT_POLICY_ADDRESS,
                    initData: spendingLimitsPolicy.initData,
                  },
                ],
              },
            ],
          });

          return {
            to: action.to,
            value: BigInt(0),
            data: action.data,
          };
        })
    );
  } else if (enableActionParams.policy === 'sudo') {
    const actionPolicies = [];

    for (const update of enableActionParams.tokenAccess) {
      if (update.isTransferEnabled === true) {
        actionPolicies.push({
          actionTarget: update.token,
          actionTargetSelector: transferSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }

      if (update.isSwapEnabled === true) {
        actionPolicies.push({
          actionTarget: update.token,
          actionTargetSelector: approveSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
    }

    if (actionPolicies.length > 0) {
      const action = getEnableActionPoliciesAction({
        permissionId: getPermissionId({ session }),
        actionPolicies,
      });

      actions.push({
        to: action.to,
        value: BigInt(0),
        data: action.data,
      });
    }
  }

  return actions;
};

