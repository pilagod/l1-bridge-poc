import { expect } from "chai";
import Chain, { getChain } from "./chain";

describe("chain", () => {
  describe("getChain", () => {
    it("should return chain from chain name", () => {
      const chain = getChain("Rinkeby");
      expect(chain).to.be.equal(Chain.Rinkeby);
    });

    it("should return chain from chain id", () => {
      const chain = getChain(4);
      expect(chain).to.be.equal(Chain.Rinkeby);
    });
  });
});
