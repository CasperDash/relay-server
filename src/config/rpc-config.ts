import * as rpcTestnet from "./rpc-testnet.json";
import * as rpcLocal from "./rpc-local.json";
import * as rpcMainnet from "./rpc-mainnet.json";

export default () => {
  switch (process.env.NODE_ENV) {
    case "local":
      return rpcLocal;
    case "testnet":
      return rpcTestnet;
    case "mainnet":
      return rpcMainnet;
  }
};
