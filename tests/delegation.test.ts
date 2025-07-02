import { describe, it, expect } from 'vitest';
import { toAccount, toValidatorAccount, buildInstallModule, buildUninstallModule } from '../src/account';
import { privateKeyToAccount, generatePrivateKey, Address } from 'viem/accounts';
import { AccountParams } from '../src/types';
import { createDelegatedAccount } from '../src/delegation';
import { PolicyParams } from '../src/types';
import { Hex } from 'viem';
  
describe('toAccount', () => {
  const privateKey = generatePrivateKey();
  const signer = privateKeyToAccount(privateKey);
  const mockParams: AccountParams = {
    chainId: 84530,
    rpcEndpoint: 'http://localhost:8545',    
    signer: signer as any,
    config: { validator: 'ownable' },
    type: 'main'
  };

  const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

  it('should create a delegated account', async () => {

    const account = await toAccount(mockParams);
    console.log('account', account)

    const validator = { 
      address: '0x0000000000000000000000000000000000000000' as Address, 
      initData: ZERO_BYTES32 as Hex, 
      salt: ZERO_BYTES32 as Hex 
    };
    const policyParams: PolicyParams = {
      policy: 'spendlimit',
      tokenLimits: [{ token: '0x0000000000000000000000000000000000000000', amount: 1000000000000000000n }],
    };
    const result = await createDelegatedAccount(account, validator, policyParams);
    console.log(result);
    // expect(result).toBeDefined();
  });



}); 