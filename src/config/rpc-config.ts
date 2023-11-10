import * as rpcTestnet from "./rpc-testnet.json";
import * as rpcLocal from "./rpc-local.json";

export default () => {
  switch (process.env.NODE_ENV) {
    case "local":
      return rpcLocal;
    case "testnet":
      return rpcTestnet;
  }
};
