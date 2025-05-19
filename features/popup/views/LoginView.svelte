<script lang="ts">
  import { Keypair } from "@solana/web3.js";
  import { createEventDispatcher } from "svelte";
  import { wgLocalSecureStore } from "~shared/utils/wgAppStore";
  import bs58 from "bs58";
  import { importFromMnemonic, sha256 } from "~shared/utils/crypto";
  import WgLogo from "~shared/components/icons/WgLogo.svelte";
  import { isClueGrinding, showMoneyGif, kpStore, showMnemonicModal } from "~shared/utils/kpStore"
  import { getBalanceBackground, saveWallet } from "~shared/utils/backgroundHelper"
  import { getClientPublicKey, STORAGE_KEYS } from "~shared/utils/constants"
  import { createPreloadedWallet } from "@wallet-guise/core"
  import MnemonicModal from "~shared/components/sub-views/MnemonicModal.svelte"
  import {LOADING_MESSAGES} from "~shared/utils/constants";
  import { sleep } from "~shared/utils/misc"

  const dispatch = createEventDispatcher();

  // ---- UI state ----
  let password = "";
  let mnemonic = "";            // only used when importing
  let hasWallet = false;         // filled from storage snapshot
  let action: "create" | "import" | null = null;   // only relevant when mode === "create"
  let mnemonicModal: MnemonicModal
  let newWalletMnemonic = "";   // store mnemonic from created wallet
  let loadingMessageIndex = 0;
  let loadingInterval: NodeJS.Timeout;
  let currentLoadingMessage = LOADING_MESSAGES[0];
  import oldMoneyGif from '~assets/oldmoney.gif'
  import { clusterStore, rpcUrl } from "~shared/utils/networkStore"
  import { get } from "svelte/store"

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

    // Start loading
    isClueGrinding.set(true);

    // Cycle through loading messages
    loadingInterval = setInterval(() => {
      loadingMessageIndex = (loadingMessageIndex + 1) % LOADING_MESSAGES.length;
      currentLoadingMessage = LOADING_MESSAGES[loadingMessageIndex];
    }, 2000);

    try {


      const { success, newWallet, confirmationResult  } = await createPreloadedWallet(getClientPublicKey($clusterStore), get(rpcUrl));


      if (success && newWallet && newWallet?.keypair) {
        // Show money gif after successful wallet creation
        isClueGrinding.set(false);
        clearInterval(loadingInterval);
        showMoneyGif.set(true);

        await persistKeypair(newWallet.keypair);
        newWalletMnemonic = newWallet.mnemonic;

        // Show the gif for 4 seconds before opening modal
        await sleep(4000);

        // Get balance and retry up to 4 times if lamports is 0
        let lamports = await getBalanceBackground();
        let retryCount = 0;
        const maxRetries = 4;

        while (lamports === 0 && retryCount < maxRetries) {
          console.log(`Balance is 0, retrying... (${retryCount + 1}/${maxRetries})`);
          await sleep(4000);
          lamports = await getBalanceBackground();
          retryCount++;
        }


        showMoneyGif.set(false);
        showMnemonicModal.set(true);
      }
      else {
        isClueGrinding.set(false);
        clearInterval(loadingInterval);
        // confResult is err
        alert('something went wrong '+ JSON.stringify(confirmationResult));
      }
    } catch (error) {
      isClueGrinding.set(false);
      clearInterval(loadingInterval);
      showMoneyGif.set(false);
      alert('Error creating wallet');
      console.error(error);
    }
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
<div id="logo" class="w-full flex justify-center pt-8">
  <WgLogo width={64} height={64} />
</div>

{#if !action}
  <h2 class="font-mono text-xl font-semibold text-center h-[28px]"
  ><span class="text-gray-900 dark:text-white">Wallet</span><span class="text-[#6682BF]">Guise</span></h2>
{/if}

{#if action === "create"}
  <h2 class="text-xl font-semibold text-center text-gray-900 dark:text-white"
      class:mb-[10px]={action === "create"}
  >{$showMoneyGif ? "Adding money" : "Create Wallet Password"}</h2>
{/if}

{#if mode === "create"}
  <form class="p-4 flex flex-col gap-4 w-full" on:submit|preventDefault={action === "import" ? handleImport : handleCreate}
        class:mt-[2px]={action === "create"}
  >
    {#if action && !$isClueGrinding && !$showMoneyGif}
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        required
        class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      />
    {/if}

    {#if action === null}
      <!-- Choice buttons -->
      <div class="flex flex-col gap-3 mt-4">
        <button
          type="button"
          class="w-full py-2.5 text-lg font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800 cursor-pointer"
          on:click={() => (action = "create")}
        >
          Create New Wallet
        </button>
        <button
          type="button"
          class="w-full py-2.5 text-lg font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 cursor-pointer"
          on:click={() => (action = "import")}
        >
          Import Wallet
        </button>
      </div>
    {:else if action === "create"}
      <!-- Create wallet loading, money gif, or buttons -->
      {#if $showMoneyGif}
        <div class="flex items-center justify-center w-full h-40 mt-2 max-h-[109px]">
          <img src={oldMoneyGif} alt="Success!" class="max-w-full max-h-full object-contain opacity-80" />
        </div>
      {:else if $isClueGrinding}
        <div class="flex items-center justify-center w-full h-24" style="margin-top: 18px;">
          <div
            class="px-3 py-1 text-lg font-medium leading-none text-center text-gray-900  rounded-full animate-pulse  dark:text-white">
            {currentLoadingMessage}
          </div>
        </div>
      {:else}
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
            class="flex-1 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 cursor-pointer"
            on:click={() => (action = null)}
          >
            Back
          </button>
        </div>
      {/if}
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
          class="flex-1 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 focus:ring-4 focus:ring-green-200 dark:from-green-400 dark:to-blue-500 cursor-pointer"
        >
          Import Wallet
        </button>
        <button
          type="button"
          class="flex-1 py-2 font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 cursor-pointer"
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
      class="w-full mt-2 py-2.5 text-lg font-medium text-white rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:ring-4 focus:ring-emerald-300 dark:from-emerald-500 dark:to-emerald-600 cursor-pointer"
    >
      Unlock
    </button>
  </form>
{/if}
<!-- Mnemonic Modal -->
{#if $showMnemonicModal}
  <MnemonicModal
    bind:this={mnemonicModal}
    mnemonic={newWalletMnemonic}
  />
{/if}
