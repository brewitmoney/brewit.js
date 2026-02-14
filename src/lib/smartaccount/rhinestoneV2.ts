/**
 * Rhinestone V2 Safe flow.
 * Uses Safe as singleton + setup(..., launchpad, addSafe7579(...), adapter).
 *
 * V2 API: addSafe7579(safe7579, ModuleInit[] modules, address[] attesters, uint8 threshold)
 * with ModuleInit { module, initData, moduleType } (flat list; moduleType = 1 validator, 2 executor, 3 fallback, 4 hook).
 */

import {
  type Address,
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  type Hex,
  keccak256,
  parseAbi,
  parseAbiParameters,
  zeroAddress,
} from 'viem';
import { getCode } from 'viem/actions';
import { getAction } from 'viem/utils';
import {
  entryPoint07Abi,
  entryPoint07Address,
  type SmartAccount,
  type SmartAccountImplementation,
  toSmartAccount,
} from 'viem/account-abstraction';
import type { PublicClient } from 'viem';
import { encode7579Calls } from 'permissionless/utils';
import { getAccountNonce } from 'permissionless/actions';
import { getBrewitConstants, type BrewitConstants } from '../../constants/brewit';
import type { BREWIT_VERSION_TYPE } from '../../types';

// ERC-7579 module type IDs (Rhinestone V2 uses these in ModuleInit.moduleType)
const MODULE_TYPE_VALIDATOR = 1;
const MODULE_TYPE_EXECUTOR = 2;
const MODULE_TYPE_FALLBACK = 3;
const MODULE_TYPE_HOOK = 4;

// Rhinestone V2 contract addresses (Safe 7579 launchpad v2)
const SAFE_7579_LAUNCHPAD_V2_ADDRESS: Address =
  '0x75798463024bda64d83c94a64bc7d7eab41300ef';
const SAFE_7579_ADAPTER_V2_ADDRESS: Address =
  '0x7579f2ad53b01c3d8779fe17928e0d48885b0003';
const SAFE_SINGLETON_ADDRESS: Address =
  '0x29fcb43b46531bca003ddc8fcb67ffe91900c762';
const SAFE_PROXY_FACTORY_ADDRESS: Address =
  '0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67';

// Same as Rhinestone SDK – used for CREATE2 address derivation
const SAFE_PROXY_INIT_CODE: Hex =
  '0x608060405234801561001057600080fd5b506040516101e63803806101e68339818101604052602081101561003357600080fd5b8101908080519060200190929190505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156100ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806101c46022913960400191505060405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505060ab806101196000396000f3fe608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033496e76616c69642073696e676c65746f6e20616464726573732070726f7669646564';

export interface RhinestoneV2DeployArgs {
  factory: Address;
  factoryData: Hex;
  salt: Hex;
  implementation: Address;
}

export interface GetSmartAccountRhinestoneV2Params {
  client: PublicClient;
  /** Owner address(es). For single signer use [signer.address]. */
  owners: Address[];
  /** Default 1n */
  threshold?: bigint;
  /** Validators for addSafe7579 (V2: included in flat modules with type 1). */
  validators?: { address: Address; context: Hex }[];
  /** Executors for addSafe7579 (V2: included in flat modules with type 2). */
  executors?: { address: Address; context: Hex }[];
  /** Fallbacks for addSafe7579 (V2: type 3). Optional, default []. */
  fallbacks?: { address: Address; context: Hex }[];
  /** Hooks for addSafe7579 (V2: type 4). Optional, default []. */
  hooks?: { address: Address; context: Hex }[];
  /** Attesters. Default from Brewit constants. */
  attesters?: Address[];
  attestersThreshold?: number;
  /** If provided, use this address and skip deploy args when deployed. */
  address?: Address;
  /** Salt nonce for createProxyWithNonce. Default 0n. */
  saltNonce?: bigint;
  /** Nonce key for getNonce. If not set, derived from first validator. */
  nonceKey?: bigint;
  signUserOperation?: (params: { userOperation: any; chainId?: number }) => Promise<Hex>;
  getDummySignature?: (userOperation?: any) => Promise<Hex>;
  version?: BREWIT_VERSION_TYPE;
}

/**
 * Build deploy args for Rhinestone V2 flow:
 * Safe singleton + setup(owners, threshold, launchpad, addSafe7579(adapter, modules[], attesters, threshold), adapter, ...)
 * V2: single ModuleInit[] with moduleType per module.
 */
export function getDeployArgsRhinestoneV2(params: {
  owners: Address[];
  threshold?: bigint;
  validators?: { address: Address; context: Hex }[];
  executors?: { address: Address; context: Hex }[];
  fallbacks?: { address: Address; context: Hex }[];
  hooks?: { address: Address; context: Hex }[];
  attesters?: Address[];
  attestersThreshold?: number;
  saltNonce?: bigint;
  constants?: BrewitConstants;
}): RhinestoneV2DeployArgs {
  const {
    owners,
    threshold = 1n,
    validators = [],
    executors = [],
    fallbacks = [],
    hooks = [],
    attesters = [],
    attestersThreshold = 0,
    saltNonce = 0n,
    constants,
  } = params;

  const adapter = SAFE_7579_ADAPTER_V2_ADDRESS;
  const launchpad = SAFE_7579_LAUNCHPAD_V2_ADDRESS;
  const attestersList = constants?.attesters ?? attesters;
  const thresholdAttesters = constants?.attestersThreshold ?? attestersThreshold;

  const modules = [
    ...validators.map((v) => ({ module: v.address, initData: v.context, moduleType: MODULE_TYPE_VALIDATOR as number })),
    ...executors.map((e) => ({ module: e.address, initData: e.context, moduleType: MODULE_TYPE_EXECUTOR as number })),
    ...fallbacks.map((f) => ({ module: f.address, initData: f.context, moduleType: MODULE_TYPE_FALLBACK as number })),
    ...hooks.map((h) => ({ module: h.address, initData: h.context, moduleType: MODULE_TYPE_HOOK as number })),
  ];

  const calldata = encodeFunctionData({
    abi: parseAbi([
      'struct ModuleInit {address module;bytes initData;uint256 moduleType}',
      'function addSafe7579(address safe7579,ModuleInit[] calldata modules,address[] calldata attesters,uint8 threshold) external',
    ]),
    functionName: 'addSafe7579',
    args: [adapter, modules, attestersList, thresholdAttesters],
  });

  const initData = encodeFunctionData({
    abi: parseAbi([
      'function setup(address[] calldata _owners,uint256 _threshold,address to,bytes calldata data,address fallbackHandler,address paymentToken,uint256 payment,address paymentReceiver) external',
    ]),
    functionName: 'setup',
    args: [
      owners,
      threshold,
      launchpad,
      calldata,
      adapter,
      zeroAddress,
      BigInt(0),
      zeroAddress,
    ],
  });

  const factoryData = encodeFunctionData({
    abi: parseAbi([
      'function createProxyWithNonce(address singleton,bytes calldata initializer,uint256 saltNonce) external payable returns (address)',
    ]),
    functionName: 'createProxyWithNonce',
    args: [SAFE_SINGLETON_ADDRESS, initData, saltNonce],
  });

  const salt = keccak256(
    encodePacked(['bytes32', 'uint256'], [keccak256(initData), saltNonce]),
  );

  return {
    factory: SAFE_PROXY_FACTORY_ADDRESS,
    factoryData,
    salt,
    implementation: SAFE_SINGLETON_ADDRESS,
  };
}

/**
 * Derive Safe address from Rhinestone V2 deploy args (CREATE2).
 */
export function getAddressFromDeployArgs(deployArgs: RhinestoneV2DeployArgs): Address {
  const { factory, implementation, salt } = deployArgs;
  const constructorArgs = encodeAbiParameters(
    parseAbiParameters('address singleton'),
    [implementation],
  );
  return getContractAddress({
    opcode: 'CREATE2',
    from: factory,
    salt,
    bytecode: concat([SAFE_PROXY_INIT_CODE, constructorArgs]),
  });
}

/**
 * getSmartAccount using Rhinestone V2 Safe flow.
 * - Safe as singleton (not launchpad).
 * - setup(owners, threshold, launchpad, addSafe7579(adapter, modules[], attesters, threshold), adapter, ...).
 * - getFactoryArgs() returns { factory, factoryData } when account is not deployed (first user op deploys).
 */
export async function getSmartAccountRhinestoneV2(
  params: GetSmartAccountRhinestoneV2Params,
): Promise<SmartAccount<SmartAccountImplementation<typeof entryPoint07Abi, '0.7'>>> {
  const {
    client,
    owners,
    threshold = 1n,
    validators = [],
    executors = [],
    fallbacks = [],
    hooks = [],
    address: providedAddress,
    saltNonce = 0n,
    nonceKey,
    signUserOperation: signUserOperationParam,
    getDummySignature: getDummySignatureParam,
    version,
  } = params;

  const constants = getBrewitConstants(version);

  const deployArgs = getDeployArgsRhinestoneV2({
    owners,
    threshold,
    validators,
    executors,
    fallbacks,
    hooks,
    attesters: params.attesters ?? constants.attesters,
    attestersThreshold: params.attestersThreshold ?? constants.attestersThreshold,
    saltNonce,
    constants,
  });

  const derivedAddress =
    typeof providedAddress === 'string' && providedAddress.length > 2
      ? (providedAddress as Address)
      : getAddressFromDeployArgs(deployArgs);

  const nonceKeyResolved =
    nonceKey ??
    (validators[0]
      ? BigInt(concat([validators[0].address, '0x00000000'] as const))
      : undefined);

  async function isDeployed(addr: Address): Promise<boolean> {
    const code = await getAction(client, getCode, 'getCode')({ address: addr });
    return Boolean(code && code !== '0x' && code.length > 2);
  }

  return toSmartAccount({
    client,
    entryPoint: {
      abi: entryPoint07Abi,
      address: entryPoint07Address,
      version: '0.7',
    },
    address: derivedAddress,
    async getFactoryArgs() {
      if (await isDeployed(derivedAddress)) {
        return { factory: undefined, factoryData: undefined };
      }
      return {
        factory: deployArgs.factory,
        factoryData: deployArgs.factoryData,
      };
    },
    async getAddress() {
      return derivedAddress;
    },
    async encodeCalls(calls) {
      return encode7579Calls({
        mode: {
          type: calls.length > 1 ? 'batchcall' : 'call',
          revertOnError: false,
          selector: '0x',
          context: '0x',
        },
        callData: calls,
      });
    },
    async decodeCalls() {
      throw new Error('decodeCalls not implemented for Rhinestone V2');
    },
    async getNonce() {
      return getAccountNonce(client, {
        address: derivedAddress,
        entryPointAddress: entryPoint07Address,
        key: nonceKeyResolved,
      });
    },
    async getStubSignature(userOperation) {
      if (getDummySignatureParam) {
        return getDummySignatureParam(userOperation);
      }
      return '0x' as Hex;
    },
    async signMessage() {
      throw new Error('signMessage not implemented for Rhinestone V2');
    },
    async signTypedData() {
      throw new Error('signTypedData not implemented for Rhinestone V2');
    },
    async signUserOperation(parameters) {
      if (!signUserOperationParam) {
        throw new Error('signUserOperation is required for getSmartAccountRhinestoneV2');
      }
      return signUserOperationParam({
        userOperation: parameters,
        chainId: parameters.chainId ?? client.chain?.id,
      });
    },
  });
}
