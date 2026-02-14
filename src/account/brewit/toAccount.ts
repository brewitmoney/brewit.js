import { AccountParams, DelegatedAccountConfig, DelegatedAccountParams, isDelegatedConfig, MainAccountParams } from "../../types";
import { toValidatorAccount } from "./toValidatorAccount";
import { getSmartAccount, getSmartAccountRhinestoneV2 } from "../../lib/smartaccount";
import { toDelegatedAccount } from "./toDelegatedAccount";
import { getPublicClient } from "../../utils/network";
import { ToSafeSmartAccountReturnType } from "permissionless/accounts";
import { getPKeySessionValidator, getPassKeyValidator } from "../../lib/smartaccount/auth";
import { getBrewitConstants, getBrewitConstant, DEFAULT_BREWIT_VERSION } from "../../constants/brewit";
import { BREWIT_VERSION_TYPE } from "../../types";
import { pad, type SignableMessage } from "viem";
import { signMessage as signMessageViem } from "viem/actions";
import { entryPoint07Address, getUserOperationHash, type UserOperation } from "viem/account-abstraction";
import { getOwnableValidatorMockSignature } from "@rhinestone/module-sdk";


// Extend AccountParams to include version
type VersionedAccountParams = AccountParams & {
  version?: BREWIT_VERSION_TYPE;
};

export const toAccount = async (
    params: VersionedAccountParams
  ): Promise<ToSafeSmartAccountReturnType<'0.7'>> => {
    const { chainId, rpcEndpoint, signer, safeAddress, config, type, useValidator = true, version = DEFAULT_BREWIT_VERSION } = params;
  
    const client = getPublicClient(
      chainId,
     rpcEndpoint,
    );
    let smartAccount;
    if(config && useValidator) {
      if (type == 'delegated') {
        if (isDelegatedConfig(config)) {
          smartAccount = await toDelegatedAccount(
            { ...params as DelegatedAccountParams, version }
          );
        }
        else {
          throw new Error('Invalid delegated account config');
        }
      } 
      else {
        smartAccount = await toValidatorAccount(
          { ...params as MainAccountParams, version }
        );
      }
    } else {
      if (type == 'main') {
        const constants = getBrewitConstants(version);
        const validatorAddress =
          config?.validator === 'passkey'
            ? getBrewitConstant('validators', version).webauthnValidator
            : getBrewitConstant('validators', version).ownableValidator;
        const nonceKey = validatorAddress
          ? BigInt(pad(validatorAddress, { dir: 'right', size: 24 }) || 0)
          : undefined;
        const owners = [
          config?.validator === 'passkey' ? constants.defaultSafeSignerAddress : signer.address,
        ];
        const validators = [
          config?.validator === 'passkey'
            ? await getPassKeyValidator(signer, version)
            : getPKeySessionValidator(signer, version),
        ];
        const signMessage = ({ message }: { message: SignableMessage }) =>
          signMessageViem(client, { account: signer, message });
        const signUserOperation = async (userOperation: UserOperation<'0.7'>) => {
          const signature = await signMessage({
            message: {
              raw: getUserOperationHash({
                userOperation,
                entryPointAddress: entryPoint07Address,
                entryPointVersion: '0.7',
                chainId: chainId!,
              }),
            },
          });
          return signature;
        };
        const getDummySignature = async () =>
          config?.validator === 'passkey'
            ? await signer.getStubSignature()
            : getOwnableValidatorMockSignature({ threshold: 1 });

        if (version === '1.2.0') {
          smartAccount = (await getSmartAccountRhinestoneV2({
            client,
            owners,
            threshold: 1n,
            validators,
            address: typeof safeAddress === 'string' && safeAddress.length > 2 ? safeAddress : undefined,
            nonceKey,
            signUserOperation: async ({ userOperation }) => signUserOperation(userOperation as UserOperation<'0.7'>),
            getDummySignature: () => getDummySignature(),
            version,
          })) as ToSafeSmartAccountReturnType<'0.7'>;
        } else {
          smartAccount = await getSmartAccount({
            client,
            signer,
            address: safeAddress,
            validators: [
              config?.validator === 'passkey'
                ? await getPassKeyValidator(signer, version)
                : getPKeySessionValidator(signer, version),
            ],
            version,
          });
        }
      } else {
        throw new Error('Invalid account type');
      }
    }
    
  
    return smartAccount;
  
    // return await smartAccount.sendUserOperation({ calls: calls });
  };
  