<script lang="ts">
    import { Keypair } from "@solana/web3.js";
    import { createEventDispatcher } from "svelte";
    import { wgLocalSecureStore } from "~shared/utils/wgAppStore";
    import bs58 from "bs58";
    import { importFromMnemonic, sha256 } from "~shared/utils/crypto";
    import WgLogo from "~shared/components/icons/WgLogo.svelte";
    import { kpStore } from "~shared/utils/kpStore";
    import { saveWallet } from "~shared/utils/backgroundHelper";
    import { STORAGE_KEYS } from "~shared/utils/constants";

    const dispatch = createEventDispatcher();

    // ---- UI state ----
    let password = "";
    let mnemonic = "";            // only used when importing
    let hasWallet = false;         // filled from storage snapshot
    let action: "create" | "import" | null = null;   // only relevant when mode === "create"

    // computed from hasWallet
    $: mode = hasWallet ? ("unlock" as const) : ("create" as const);

    // ---- discover if a wallet already exists ----
    chrome.storage.local.get(null, (items) => {
        hasWallet = Object.keys(items).some((k) => k.includes(STORAGE_KEYS.ENC_WALLET));
    });

    // ---- helpers ----
    async function persistKeypair(kp: Keypair) {
        await wgLocalSecureStore.setPassword(password);
        await wgLocalSecureStore.set(STORAGE_KEYS.ENC_WALLET, bs58.encode(kp.secretKey));
        await wgLocalSecureStore.set(STORAGE_KEYS.HASH, await sha256(password));

        await chrome.storage.session.set({
            wg_session_wallet: bs58.encode(kp.secretKey)
        });

        await saveWallet(password, bs58.encode(kp.secretKey), await sha256(password));
        kpStore.set(kp);
        dispatch("success");
    }

    // ---- create new wallet ----
    async function handleCreate() {
        if (!password) return;
        const kp = Keypair.generate();
        await persistKeypair(kp);
    }

    // ---- import existing wallet ----
    async function handleImport() {
        if (!password || !mnemonic) return;
        const { keypair } = importFromMnemonic(mnemonic.trim());
        await persistKeypair(keypair);
    }

    // ---- unlock existing wallet ----
    async function handleUnlock() {
        if (!password) return;
        await wgLocalSecureStore.setPassword(password);     // primes AES key
        const enc = await wgLocalSecureStore.get<string>(STORAGE_KEYS.ENC_WALLET);
        if (!enc) return alert("Stored wallet not found");
        const kp = Keypair.fromSecretKey(bs58.decode(enc));
        await persistKeypair(kp);
    }
</script>

<!-- ---------- MARKUP ---------- -->
<div class="w-full flex justify-center pt-8">
    <WgLogo width={64} height={64} />
</div>

{#if mode === "create"}
    <form class="p-4 flex flex-col gap-4 w-full" on:submit|preventDefault={action === "import" ? handleImport : handleCreate}>
        <h2 class="text-xl font-semibold text-center text-gray-900 dark:text-white">Create Wallet Password</h2>

        <input
          type="password"
          bind:value={password}
          placeholder="Password"
          required
          class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />

        {#if action === null}
            <!-- Choice buttons -->
            <div class="flex flex-col gap-3 mt-4">
                <button
                  type="button"
                  class="w-full py-2.5 text-lg font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800"
                  on:click={() => (action = "create")}
                >
                    Create New Wallet
                </button>
                <button
                  type="button"
                  class="w-full py-2.5 text-lg font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600"
                  on:click={() => (action = "import")}
                >
                    Import Wallet
                </button>
            </div>
        {:else if action === "create"}
            <!-- Create wallet buttons in row -->
            <div class="flex gap-3 mt-2">
                <button
                  type="submit"
                  class="flex-1 py-2.5 text-lg font-medium text-white rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-300 dark:from-purple-600 dark:to-purple-700"
                >
                    Create Wallet
                </button>
                <button
                  type="button"
                  class="flex-1 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600"
                  on:click={() => (action = null)}
                >
                    Back
                </button>
            </div>
        {:else}
            <!-- import -->
            <textarea
              rows="3"
              bind:value={mnemonic}
              placeholder="Seed phrase (space-separated)"
              required
              class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            ></textarea>
            <!-- Import wallet buttons in row -->
            <div class="flex gap-3 mt-2">
                <button
                  type="submit"
                  class="flex-1 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 focus:ring-4 focus:ring-green-200 dark:from-green-400 dark:to-blue-500"
                >
                    Import Wallet
                </button>
                <button
                  type="button"
                  class="flex-1 py-2 font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600"
                  on:click={() => (action = null)}
                >
                    Back
                </button>
            </div>
        {/if}
    </form>
{:else}
    <!-- unlock mode -->
    <form class="p-4 flex flex-col gap-4 w-full" on:submit|preventDefault={handleUnlock}>
        <h2 class="text-xl font-semibold text-center text-gray-900 dark:text-white">Unlock Wallet</h2>
        <input
          type="password"
          bind:value={password}
          placeholder="Password"
          required
          class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />
        <button
          type="submit"
          class="w-full mt-2 py-2.5 text-lg font-medium text-white rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:ring-4 focus:ring-emerald-300 dark:from-emerald-500 dark:to-emerald-600"
        >
            Unlock
        </button>
    </form>
{/if}