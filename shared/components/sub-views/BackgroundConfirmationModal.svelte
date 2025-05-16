<script lang="ts">
  import { onMount } from "svelte"
  import { Modal } from "flowbite"
  import type { ConfirmationRequest } from "~shared/utils/confirmationManager"
  import { formatDisplayData, parseTransactionForDisplay } from "~shared/utils/transaction"
  import { Transaction } from "@solana/web3.js"

  // Bind to the current request from the store
  export let request: ConfirmationRequest
  export let onApprove = () => {
  } // Callback function for approval
  export let onReject = () => {
  } // Callback function for rejection

  let modalElement
  let modal

  // Export these methods for parent components
  export function open() {
    if (modal) modal.show()
  }

  export function close() {
    if (modal) modal.hide()
  }

  function formatAddress(address) {
    if (!address) return ""
    if (address.length <= 12) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  function getRequestTitle() {
    switch (request?.type) {
      case "signIn":
        return "Confirm Sign In"
      case "signMessage":
        return "Confirm Message Signing"
      case "signTransaction":
        return "Confirm Transaction"
      case "signAndSend":
        console.log(`confirmationModal request`, request)
        return "Confirm & Send Transaction"
      default:
        return "Confirm Request"
    }
  }

  function handleApprove() {
    onApprove()
    close()
  }

  function handleReject() {
    onReject()
    close()
  }

  onMount(() => {
    modal = new Modal(modalElement, {
      placement: "center",
      closable: true,
      backdrop: "dynamic",
      backdropClasses: "!bg-black opacity-[.8] w-[350px] h-[380px] absolute top-0 left-0 z-[50]"
    })

    // Open automatically on mount
    open()
    console.log(`request type: `)
  })
</script>

<div style="z-index: 51 !important;" id="request-confirm-modal" bind:this={modalElement} tabindex="-1"
     class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full">
  <div class="relative m-auto max-w-[calc(100%-1.5rem)]">
    <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
      <button on:click={handleReject} type="button"
              class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="request-confirm-modal">
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
        <span class="sr-only">Close modal</span>
      </button>
      <div class="p-4 md:p-5 text-center">
        <svg class="mx-auto mb-4 text-yellow-400 w-6 h-6 dark:text-yellow-300" aria-hidden="true"
             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-200">{getRequestTitle()}</h3>

        <div class="text-left mb-5">
          <!-- Different content based on request type -->
          {#if request.type === 'signMessage'}
            <div class="mb-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Message</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white break-all">
                {formatDisplayData(request.payload?.message)}
              </p>
              <button type="button" class="text-xs text-blue-600 hover:underline dark:text-blue-400">View Full Message
              </button>
            </div>
          {:else if request.type === 'signTransaction'}
            {#if request.payload?.tx}
              {@const parsedTx = parseTransactionForDisplay(request.payload.tx)}

              <!-- Transfer Details -->
              {#if parsedTx.transfers.length > 0}
                <div class="mb-4">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Transfer Details</p>
                  {#each parsedTx.transfers as transfer}
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">Amount</span>
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                          {transfer.amount} SOL
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500 dark:text-gray-400">To</span>
                        <span class="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {transfer.recipient.slice(0, 8)}...{transfer.recipient.slice(-8)}
                        </span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

              <details class="mb-3">
                <summary class="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer">Transaction
                  Details
                </summary>
                <div class="mt-2 space-y-1 text-sm text-gray-900 dark:text-white">
                  <div><strong>Fee Payer:</strong> {parsedTx.details.feePayer}</div>
                  <div><strong>Blockhash:</strong> {parsedTx.details.recentBlockhash}</div>
                  <div><strong>Instructions:</strong> {parsedTx.details.instructionCount}</div>
                  <div><strong>Programs:</strong> {parsedTx.details.programs.join(', ')}</div>
                  <div><strong>Est. Fee:</strong> {parsedTx.details.estimatedFee} SOL</div>
                </div>
              </details>
            {/if}
          {:else if request.type === 'signAndSend'}
            {#if request.payload?.tx}
              {@const parsedTx = parseTransactionForDisplay(request.payload.tx)}

              <!-- Transfer Details -->
              {#if parsedTx.transfers.length > 0}
                <div class="mb-4">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Transfer Details</p>
                  {#each parsedTx.transfers as transfer}
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">Amount</span>
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                          {transfer.amount} SOL
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500 dark:text-gray-400">To</span>
                        <span class="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {transfer.recipient.slice(0, 8)}...{transfer.recipient.slice(-8)}
                        </span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

              <details class="mb-3">
                <summary class="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer">Transaction
                  Details
                </summary>
                <div class="mt-2 space-y-1 text-sm text-gray-900 dark:text-white">
                  <div><strong>Fee Payer:</strong> {parsedTx.details.feePayer}</div>
                  <div><strong>Blockhash:</strong> {parsedTx.details.recentBlockhash}</div>
                  <div><strong>Instructions:</strong> {parsedTx.details.instructionCount}</div>
                  <div><strong>Programs:</strong> {parsedTx.details.programs.join(', ')}</div>
                  <div><strong>Est. Fee:</strong> {parsedTx.details.estimatedFee} SOL</div>
                </div>
              </details>
            {/if}
            {#if request.payload?.options?.commitment}
              <div class="mb-3">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Commitment</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{request.payload.options.commitment}</p>
              </div>
            {/if}
          {:else if request.type === 'signIn'}
            <div class="mb-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Sign In Request</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Allow this site to access your wallet?</p>
            </div>
          {/if}

          <!-- Show account info if available -->
          {#if request.payload?.account}
            <div class="mb-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Account</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white break-all">
                {formatAddress(request.payload.account)}
              </p>
            </div>
          {/if}

          <!-- Origin information -->
          <div class="mb-3 w-full overflow-x-auto">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Origin</p>
            <div class="flex items-center">
              {#if request.favicon}
                <img src={request.favicon} alt="Site favicon" class="w-4 h-4 mr-2" />
              {/if}
              <p class="text-sm font-medium text-gray-900 dark:text-white">{request.origin}</p>
            </div>
          </div>

          <!-- Program IDs if available -->
          {#if request.programIds && request.programIds.length > 0}
            <div class="mb-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Programs</p>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {#each request.programIds as programId}
                  <div>{formatAddress(programId)}</div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="flex">
          <button
            on:click={handleApprove}
            type="button"
            class="text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
          >
            Approve
          </button>
          <button
            on:click={handleReject}
            type="button"
            class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</div>