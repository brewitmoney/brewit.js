/**
 * Custom policy and validation helpers using Brewit constants.
 * Replaces @rhinestone/module-sdk encodeValidationData, getSpendingLimitsPolicy, getSudoPolicy.
 */

import { type Address, type Hex, encodeAbiParameters } from 'viem';
import { getBrewitConstant, DEFAULT_BREWIT_VERSION } from '../../../../constants/brewit';
import type { BREWIT_VERSION_TYPE } from '../../../../types';
import type { PolicyData } from './types';

/**
 * Encodes ownable-validator init data (threshold + owners).
 * Same ABI encoding as Rhinestone SDK; no contract address needed.
 */
export function encodeValidationData({
  threshold,
  owners,
}: {
  threshold: number;
  owners: Address[];
}): Hex {
  return encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'address[]' }],
    [BigInt(threshold), [...owners].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))],
  );
}

/**
 * Spending limits policy config using Brewit spendLimitPolicy address.
 */
export function getSpendingLimitsPolicy(
  params: { token: Address; limit: bigint }[],
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION,
): PolicyData {
  const policy = getBrewitConstant('policies', version).spendLimitPolicy;
  const initData = encodeAbiParameters(
    [{ type: 'address[]' }, { type: 'uint256[]' }],
    [params.map(({ token }) => token), params.map(({ limit }) => limit)],
  );
  return { policy, initData };
}

/**
 * Sudo policy using Brewit sudoPolicy address.
 */
export function getSudoPolicy(
  version: BREWIT_VERSION_TYPE = DEFAULT_BREWIT_VERSION,
): PolicyData {
  const policy = getBrewitConstant('policies', version).sudoPolicy;
  return { policy, initData: '0x' };
}
