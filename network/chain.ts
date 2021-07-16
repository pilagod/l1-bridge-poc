import { toArray } from "@util/enum";

enum Chain {
  Kovan = 42,
  Rinkeby = 4,
}

export function getChain(chainIdOrName: string | number): Chain {
  if (!Chain[chainIdOrName as any]) {
    throw new Error(`Unsupported chain: ${chainIdOrName}`);
  }
  if (typeof chainIdOrName === "string") {
    return Chain[chainIdOrName as any] as unknown as Chain;
  }
  return chainIdOrName as Chain;
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
