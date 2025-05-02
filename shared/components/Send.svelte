<script lang="ts">
  import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
  import type { SendTransactionOptions } from "~shared/types/WalletGuiseConnect.types"
  import { balanceStore, fetchBalance } from "~shared/utils/balanceStore"
  import {kpStore} from "~shared/utils/kpStore"

  let recipient = '';
  let amount = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';


  async function handleSendTransaction() {
    // Clear previous messages
    errorMessage = '';
    successMessage = '';

    // --- Input Validation ---
    if (!recipient || !amount) {
      errorMessage = 'Please fill all fields';
      return;
    }

    try {
      // Validate recipient address format (basic check)
      new PublicKey(recipient); // Throws error if invalid format
    } catch (err) {
      errorMessage = 'Invalid recipient address format';
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errorMessage = 'Amount must be a positive number';
      return;
    }

    const lamportsToSend = numericAmount * 1_000_000_000;
    if (lamportsToSend > $balanceStore) {
      errorMessage = 'Insufficient balance';
      return;
    }

    // --- Transaction Sending ---
    try {
      isLoading = true;

      const commitment = 'confirmed';

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: $kpStore.publicKey,
          toPubkey: new PublicKey(recipient), // Validate address format before calling this function if needed
          lamports: lamportsToSend // Convert SOL to lamports, ensure integer
        })
      );
      transaction.feePayer = $kpStore.publicKey;
      const connection = new Connection('https://api.devnet.solana.com', commitment); // Use appropriate network and commitment
      const { blockhash } = await connection.getLatestBlockhash(commitment);
      transaction.recentBlockhash = blockhash;

      const options: SendTransactionOptions = {
        preflightCommitment: commitment,
        skipPreflight: false // Usually false for better error checking
      };

      console.log("Sending transaction via WalletGuise provider:", transaction);
      // const { signature, error } = await chrome.runtime.sendMessage({
      //   type: "walletguise#signAndSend"
      // })

      transaction.partialSign($kpStore);

      const serializedTx = transaction.serialize();
      const signature = await connection.sendRawTransaction(
        serializedTx,
        options
      );

      successMessage = `Transaction sent successfully! Signature: ${signature.substring(0, 10)}...`; // Show partial signature
      recipient = ''; // Clear form
      amount = '';
      // Optionally, refresh balance after sending
      // balance = await getBalance();
      setTimeout(fetchBalance, 750);
    } catch (err) {
      console.error("Transaction Error:", err);
      errorMessage = `Transaction failed: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="p-2">
  <h2 class="text-lg font-semibold mb-2 dark:text-white">Send</h2>

  {#if errorMessage}
    <div class="p-3 mb-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      {errorMessage}
    </div>
  {/if}
  {#if successMessage}
    <div class="p-3 mb-3 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
      {successMessage}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSendTransaction} class="space-y-4">
    <div>
      <label for="token-send" class="block mb-1 text-xs font-medium text-gray-900 dark:text-white">Token</label>
      <div id="token-send" class="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
        SOL </div>
    </div>

    <div>
      <label for="recipient-send" class="block mb-1 text-xs font-medium text-gray-900 dark:text-white">Recipient Address</label>
      <input
        id="recipient-send"
        bind:value={recipient}
        type="text"
        placeholder="Paste address (e.g., $sol...)"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    </div>

    <div>
      <label for="amount-send" class="block mb-1 text-xs font-medium text-gray-900 dark:text-white">Amount (SOL)</label>
      <input
        id="amount-send"
        bind:value={amount}
        type="number"
        step="any" min="0"
        placeholder="0.00"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    </div>

    <button
      type="submit"
      class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
    >
      {#if isLoading}
        <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
        </svg>
        Sending...
      {:else}
        Send
      {/if}
    </button>
  </form>
</div>