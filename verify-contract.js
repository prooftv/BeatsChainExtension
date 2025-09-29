
// Verification script for Thirdweb
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Mumbai } from "@thirdweb-dev/chains";

const sdk = ThirdwebSDK.fromReadOnlyRPC(Mumbai.rpc[0], Mumbai);
const contract = await sdk.getContract("0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B");

console.log("Contract Name:", await contract.call("name"));
console.log("Contract Symbol:", await contract.call("symbol"));
console.log("Total Supply:", await contract.call("totalSupply"));
