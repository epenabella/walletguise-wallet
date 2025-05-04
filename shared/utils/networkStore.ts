import { writable, get } from "svelte/store";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export type Cluster = "mainnet-beta" | "devnet" | "testnet";
export const clusterStore = writable<Cluster>("devnet");

export const connectionStore = writable<Connection>(
  new Connection(clusterApiUrl(get(clusterStore)), "confirmed")
);

clusterStore.subscribe((c) =>
  connectionStore.set(new Connection(clusterApiUrl(c), "confirmed"))
);