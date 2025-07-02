import { Chain, createPublicClient, defineChain, http } from 'viem';
import {
  mainnet,
  base,
  baseSepolia,
  bsc,
  optimism,
  polygon,
  sepolia,
  arbitrum,
  gnosis,
  monadTestnet
} from 'viem/chains';

export const polygonsandbox = /*#__PURE__*/ defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'Polygon', symbol: 'POLY', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.buildbear.io/shallow-ikaris-0eb67f87'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polygon',
      url: 'https://polygonscan.com/',
      apiUrl: 'https://api.polygonscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7654707,
    },
  },
});

export const getChain = (chainId: number): Chain => {
  return [
    mainnet,
    base,
    polygon,
    baseSepolia,
    optimism,
    arbitrum,
    sepolia,
    bsc,
    gnosis,
    monadTestnet
  ].find((chain: any) => chain.id == chainId) as Chain;
};

export const getPublicClient = (chainId: number, rpcEndpoint: string): any => {
  return createPublicClient({
    chain: getChain(chainId),
    transport: http(rpcEndpoint),
  });
};
