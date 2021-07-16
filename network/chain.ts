import { toArray } from "@util/enum";

enum Chain {
  Kovan = 42,
  Rinkeby = 4,
}

export function getChain(chainIdOrName: string | number): Chain {
  const chain = parseInt(`${chainIdOrName}`, 10);
  if (isNaN(chain)) {
    const chainName = chainIdOrName as string;
    return Chain[
      (chainName.charAt(0).toUpperCase() +
        chainName.slice(1).toLowerCase()) as any
    ] as unknown as Chain;
  }
  return chain as Chain;
}

export function getChains(): Chain[] {
  return toArray<Chain>(Chain);
}

export function getChainName(chain: Chain): string {
  return Chain[chain];
}

export function getChainRequiredConfirmations(_: Chain): number {
  return 6;
}

export default Chain;
