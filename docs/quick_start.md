---
title: Quick start
author: Simon Boissonneault-Robert
---

## Installing the library

> For quick-start, you may also like to try out our template/boilerplate app [here][boilerplate]

The following instructions assume you have a project already created, and you have `npm` installed and operable.

```sh
npm install @taquito/taquito
```

## Import the library in your project
You can access Tezos Toolkit in one of two ways.

### Import `Tezos` (a singleton object) from `@taquito/taquito`

```js
import { Tezos } from '@taquito/taquito';
```

### Import `TezosToolkit` from `@taquito/taquito` and instantiate it
This approach is only required if you need to instantiate more than one toolkit.

```js
import { TezosToolkit } from '@taquito/taquito';

const tezos = new TezosToolkit();
```

## Configuration

### Changing the underlying rpc

```js
import { Tezos } from '@taquito/taquito';

Tezos.setProvider({ rpc: 'your_rpc' });
```

### Changing the underlying signer

```js
import { Tezos } from '@taquito/taquito';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

Tezos.setProvider({ signer: new TezBridgeSigner() });
```

## Example

### Get balance

```js live noInline
Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/mainnet' });
Tezos.tz.getBalance('tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw')
  .then(balance => render(`${balance.toNumber() / 1000000} ꜩ`))
  .catch(error => render(JSON.stringify(error)));
```

### Get balance history

```js live noInline
Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/mainnet' });
Tezos.query.balanceHistory('tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw')
  .then(history => render(JSON.stringify(history)))
  .catch(error => render(JSON.stringify(error)));
```

### Import a key
This will import your private key in memory and sign operations using this key.

#### Private key

```js
Tezos.importKey('p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1');
```

#### Faucet Key
A faucet key can be generated at https://faucet.tzalpha.net/

```js
const FAUCET_KEY = {
  "mnemonic": [
    "cart",
    "will",
    "page",
    "bench",
    "notice",
    "leisure",
    "penalty",
    "medal",
    "define",
    "odor",
    "ride",
    "devote",
    "cannon",
    "setup",
    "rescue"
  ],
  "secret": "35f266fbf0fca752da1342fdfc745a9c608e7b20",
  "amount": "4219352756",
  "pkh": "tz1YBMFg1nLAPxBE6djnCPbMRH5PLXQWt8Mg",
  "password": "Fa26j580dQ",
  "email": "jxmjvauo.guddusns@tezos.example.org"
};

Tezos.importKey(
  FAUCET_KEY.email,
  FAUCET_KEY.password,
  FAUCET_KEY.mnemonic.join(' '),
  FAUCET_KEY.secret
);
```

### Transfer

The transfer operation requires a configured signer. In this example we will use a faucet key.

```js live noInline
// A new faucet key can be generated at https://faucet.tzalpha.net/
const FAUCET_KEY = {
  "mnemonic": [
    "cart",
    "will",
    "page",
    "bench",
    "notice",
    "leisure",
    "penalty",
    "medal",
    "define",
    "odor",
    "ride",
    "devote",
    "cannon",
    "setup",
    "rescue"
  ],
  "secret": "35f266fbf0fca752da1342fdfc745a9c608e7b20",
  "amount": "4219352756",
  "pkh": "tz1YBMFg1nLAPxBE6djnCPbMRH5PLXQWt8Mg",
  "password": "Fa26j580dQ",
  "email": "jxmjvauo.guddusns@tezos.example.org"
};

Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/babylonnet' });
Tezos.importKey(
  FAUCET_KEY.email,
  FAUCET_KEY.password,
  FAUCET_KEY.mnemonic.join(' '),
  FAUCET_KEY.secret
).then(() => {
  const amount = 2;
  const address = 'tz1h3rQ8wBxFd8L9B3d7Jhaawu6Z568XU3xY';

  render(`Transfering ${amount} ꜩ to ${address}...`);

  Tezos.contract.transfer({ to: address, amount: amount })
    .then(op => op.confirmation())
    .then(block => render(`Block height: ${block}`))
    .catch(error => render(`Error: ${JSON.stringify(error, null, 2)}`));
});
```

### Interact with a smart contract
Calling smart contract operations require a configured signer, in this example we will use a faucet key. The source for the smart contract [KT1LjpCPTqGajeaXfLM3WV7csatSgyZcTDQ8][smart_contract_on_better_call_dev] used in this example can be found in a [Ligo Web IDE][smart_contract_source].

```js live noInline
const FAUCET_KEY = {
  "mnemonic": [
    "join",
    "angry",
    "steak",
    "input",
    "spider",
    "pulse",
    "lady",
    "damp",
    "embrace",
    "effort",
    "announce",
    "woman",
    "garden",
    "wood",
    "hover"
  ],
  "secret": "32fe36a9cc80dfb6dde62828e02bd174438072a4",
  "amount": "19197234016",
  "pkh": "tz1QdWcKyBD2qY85tNxn7aQT3pVcYndgtT3R",
  "password": "hXZ0WiIty5",
  "email": "ohmziant.rhbmsklp@tezos.example.org"
};

Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/babylonnet' });
Tezos.importKey(
  FAUCET_KEY.email,
  FAUCET_KEY.password,
  FAUCET_KEY.mnemonic.join(' '),
  FAUCET_KEY.secret
).then(() => {
  const i = 7;

  render(`Incrementing storage value by ${i}...`);

  Tezos.contract.at('KT1LjpCPTqGajeaXfLM3WV7csatSgyZcTDQ8')
    .then(contract => contract.methods.increment(i).send())
    .then(op => op.confirmation())
    .then(block => render(`Block height: ${block}`))
    .catch(error => render(`Error: ${JSON.stringify(error, null, 2)}`));
});
```

[boilerplate]: https://github.com/ecadlabs/taquito-boilerplate
[smart_contract_source]: https://ide.ligolang.org/p/CelcoaDRK5mLFDmr5rSWug
[smart_contract_on_better_call_dev]: https://better-call.dev/babylon/KT1LjpCPTqGajeaXfLM3WV7csatSgyZcTDQ8/operations
