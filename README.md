# L1 Bridge PoC

Cross L1 bridge PoC

## Setup

### Installation

```sh
yarn install
yarn build
yarn migration:up
```

### Environment Variables

Check `.env.example` for required environment variables and fill them in your own `.env`.

`WALLET_ADDRESS`: Wallet address shared for L1
`WALLET_PRIVATE_KEY`: Wallet private key shared for L1
`KOVAN_RPC_URL`: Kovan rpc url
`RINKEBY_RPC_URL`: Rinkeby rpc url

> This project is aim for EVM-compatible chains, currently it supports `Kovan` and `Rinkeby`. Chains can be expanded easily, please refer to [Expand Chains](#expand-chains) for more details.

### Prepare ETH

You need to get ETH to the wallet set in environment for chains you want to operate.

- Kovan faucet: [https://github.com/kovan-testnet/faucet](https://github.com/kovan-testnet/faucet)
- Rinkeby faucet: [https://faucet.rinkeby.io/](https://faucet.rinkeby.io/)

## L1 Bridge

Start a L1 bridge with following command:

```sh
yarn execute bridge/L1
```

This command will spin up a watcher and a worker:

- Watcher: Wait for withdraws and record them.
- Worker: Confirm and finalize withdraws and deposit them to destination on other chain.

After bridge starts, you can mint `TKN`, which is our test token, on specific chain by below command:

```sh
yarn execute scripts/mint.ts --help

Options:
    --version      Show version number                                   [boolean]
    -c, --chain    Chain name or id                            [string] [required]
    -h, --help     Show help                                             [boolean]

# mint 100 TKN for Rinkeby
yarn execute scripts/mint.ts -c 4

# mint 100 TKN for Kovan
yarn execute scripts/mint.ts -c 42
```

With enough `TKN`, you can withdraw them cross chains with below command:

```sh
yarn execute scripts/withdraw.ts --help

Options:
    --version      Show version number                                   [boolean]
    -f, --from     From chain name or id                       [string] [required]
    -t, --to       To chain name or id                         [string] [required]
    -h, --help     Show help                                             [boolean]

# withdraw 10 TKN from Rinkeby to Kovan
yarn execute scripts/withdraw.ts -f 4 -t 42
```

Go and check the terminal running bridge or `logger/logger.log` to see what is happening.

## Expand Chains

To support new EVM-compatible chain, here are the steps:

1. Add `{CHAIN}_RPC_URL` to environment variable.
2. Add new chain to `network/chain.ts`.
3. Add new chain network to `hardhat.config.ts`.
4. Deploy `TKN` to that chain via `hardhat --network {chain} deploy --no-compile`.
5. Register new deployed `TKN` contract to `network/contract.ts`.

That's it. You can withdraw `TKN` to this new chain.
