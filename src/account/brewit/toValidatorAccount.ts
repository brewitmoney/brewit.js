import {
    Hex,
    pad,
    SignableMessage,
  } from 'viem';

  import { getChainId, signMessage as signMessageViem } from 'viem/actions';
  import {
    entryPoint07Address,
    getUserOperationHash,
    UserOperation,
  } from 'viem/account-abstraction';
import { getOwnableValidatorMockSignature } from '@rhinestone/module-sdk';
import { getSmartAccount, getSmartAccountRhinestoneV2 } from "../../lib/smartaccount";
import { getBrewitConstants } from "../../constants/brewit";
import { getPassKeyValidator, getPKeySessionValidator } from "../../lib/smartaccount/auth";
import { ToSafeSmartAccountReturnType } from 'permissionless/accounts';
import { MainAccountParams } from '../../types';
import { getPublicClient } from '../../utils/network';
import { getBrewitConstant, DEFAULT_BREWIT_VERSION } from "../../constants/brewit";
import { BREWIT_VERSION_TYPE } from '../../types';




// Extend MainAccountParams to include version
interface VersionedMainAccountParams extends MainAccountParams {
  version?: BREWIT_VERSION_TYPE;
}

export async function toValidatorAccount(
    params: VersionedMainAccountParams
  ): Promise<ToSafeSmartAccountReturnType<'0.7'>> {
    const { chainId, rpcEndpoint, signer, safeAddress, config, version = DEFAULT_BREWIT_VERSION } = params;

    

    const client = getPublicClient(
      chainId,
      rpcEndpoint,
    );

    
    if (!chainId) {
        throw new Error('Chain ID not found');
    }

    // Get versioned validator addresses
    const validatorAddress =
    config.validator == 'passkey'
      ? getBrewitConstant('validators', version).webauthnValidator
      : getBrewitConstant('validators', version).ownableValidator;
  const nonceKey = validatorAddress
    ? BigInt(
        pad(validatorAddress, {
          dir: 'right',
          size: 24,
        }) || 0
      )
    : undefined;
  
    const signMessage = ({
      message,
    }: {
      message: SignableMessage;
    }): Promise<Hex> => {
      return signMessageViem(client, {
        account: signer,
        message: message,
      });
    };
  
    const signUserOperation = async (userOperation: UserOperation<'0.7'>) => {
      const signature = await signMessage({
        message: {
          raw: getUserOperationHash({
            userOperation,
            entryPointAddress: entryPoint07Address,
            entryPointVersion: '0.7',
            chainId: chainId,
          }),
        },
      });
  
      return signature;
    };
  
    const getDummySignature = async () => {
      const signature =
        config.validator == 'passkey'
          ? await signer.getStubSignature()
          : getOwnableValidatorMockSignature({
              threshold: 1,
            });
  
      return signature;
    };

    const constants = getBrewitConstants(version);
    const owners = [
      config.validator === 'passkey' ? constants.defaultSafeSignerAddress : signer.address,
    ];
    const validators = [
      config.validator === 'passkey'
        ? await getPassKeyValidator(signer, version)
        : getPKeySessionValidator(signer, version),
    ];

    const smartAccount =
      version === '1.2.0'
        ? ((await getSmartAccountRhinestoneV2({
            client,
            owners,
            threshold: 1n,
            validators,
            address: typeof safeAddress === 'string' && safeAddress.length > 2 ? safeAddress : undefined,
            nonceKey,
            signUserOperation: async ({ userOperation, chainId }) =>
              signUserOperation(userOperation as UserOperation<'0.7'>),
            getDummySignature: () => getDummySignature(),
            version,
          })) as ToSafeSmartAccountReturnType<'0.7'>)
        : await getSmartAccount({
            client,
            nonceKey,
            signer: config.validator === 'ownable' ? signer : undefined,
            address: safeAddress,
            validators: [
              config.validator === 'passkey'
                ? await getPassKeyValidator(signer, version)
                : getPKeySessionValidator(signer, version),
            ],
            signUserOperation: signUserOperation,
            getDummySignature: getDummySignature,
            version,
          });

    return smartAccount;
  }
  