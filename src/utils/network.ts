import { Chain, createPublicClient, defineChain, http } from 'viem';
import {
  mainnet,
  base,
  baseSepolia,
  bsc,
  optimism,
  polygon,
  polygonAmoy,
  sepolia,
  arbitrum,
  gnosis,
  unichain,
  avalanche,
  worldchain,
  sonic,
  scroll,
  celo,
  monadTestnet,
  etherlink,
} from 'viem/chains';


export const monad = /*#__PURE__*/ defineChain({
  id: 143,
  name: 'Monad',
  blockTime: 400,
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz', 'https://rpc1.monad.xyz'],
      webSocket: ['wss://rpc.monad.xyz', 'wss://rpc1.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://monadvision.com',
    },
    monadscan: {
      name: 'Monadscan',
      url: 'https://monadscan.com',
      apiUrl: 'https://api.monadscan.com/api',
    },
  },
  testnet: false,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 9248132,
    },
  },
})


export const getChain = (chainId: number): Chain => {
  return [
    mainnet,
    base,
    polygon,
    polygonAmoy,
    baseSepolia,
    optimism,
    arbitrum,
    sepolia,
    bsc,
    gnosis,
    unichain,
    avalanche,
    worldchain,
    sonic,
    scroll,
    celo,
    monad,
    monadTestnet,
    etherlink,
  ].find((chain: any) => chain.id == chainId) as Chain;
};

export const getPublicClient = (chainId: number, rpcEndpoint: string): any => {
  return createPublicClient({
    chain: getChain(chainId),
    transport: http(rpcEndpoint),
  });
};
