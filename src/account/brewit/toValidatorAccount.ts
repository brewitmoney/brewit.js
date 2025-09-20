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
import { getSmartAccount } from "../../lib/smartaccount";
import { getPassKeyValidator, getPKeySessionValidator } from "../../lib/smartaccount/auth";
import { ToSafeSmartAccountReturnType } from 'permissionless/accounts';
import { MainAccountParams } from '../../types';
import { getPublicClient } from '../../utils/network';
import { getBrewitConstant, BREWIT_VERSION_TYPE, DEFAULT_BREWIT_VERSION } from "../../constants/brewit";



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

    const smartAccount = await getSmartAccount({
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
      version, // Pass the version to getSmartAccount
    });
  
    return smartAccount;
  }
  