import { toArray } from "@util/enum";

enum Chain {
  Kovan = 42,
  Rinkeby = 4,
}

export function getChains(): Chain[] {
  return toArray<Chain>(Chain);
}

export function getChainName(chain: Chain): string {
  return Chain[chain];
}

export default Chain;
