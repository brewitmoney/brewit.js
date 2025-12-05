import { AccountParams, DelegatedAccountConfig, DelegatedAccountParams, isDelegatedConfig, MainAccountParams } from "../../types";
import { toValidatorAccount } from "./toValidatorAccount";
import { getSmartAccount } from "../../lib/smartaccount";
import { toDelegatedAccount } from "./toDelegatedAccount";
import { getPublicClient } from "../../utils/network";
import { ToSafeSmartAccountReturnType } from "permissionless/accounts";
import { getPKeySessionValidator, getPassKeyValidator } from "../../lib/smartaccount/auth";
import { DEFAULT_BREWIT_VERSION } from "../../constants/brewit";
import { BREWIT_VERSION_TYPE } from "../../types";


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
      if(type == 'main') {
        smartAccount = await getSmartAccount({
          client,
          signer,
          address: safeAddress,
          validators: [
            config.validator === 'passkey'
              ? await getPassKeyValidator(signer, version)
              : getPKeySessionValidator(signer, version),
          ],
          version,
        });
      } else {
        throw new Error('Invalid account type');
      }
    }
    
  
    return smartAccount;
  
    // return await smartAccount.sendUserOperation({ calls: calls });
  };
  