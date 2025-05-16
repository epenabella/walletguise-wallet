<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte'
  import { Modal } from 'flowbite'
  import { showMnemonicModal } from "~shared/utils/kpStore"

  const dispatch = createEventDispatcher()

  // Parent passes the mnemonic and optional callback
  export let mnemonic: string = ''

  // ---- Flowbite modal instance ----
  let modalElement: HTMLElement | undefined
  let modal: Modal | undefined

  /** Allow the parent to open() / close() the modal imperatively */
  export function open() {
    modal?.show()
  }

  export function close() {
    modal?.hide()
  }

  onMount(() => {
    if (modalElement) {
      modal = new Modal(modalElement, {
        closable: false, // Prevent closing without confirmation
        backdrop: 'static' // Prevent closing by clicking backdrop
      })
      open();
    }
  })

  // ---- Confirmation gate ----
  let confirmationValue = ''
  $: isMatch = confirmationValue === 'I HAVE WRITTEN IT DOWN'

  function handleConfirm() {
    showMnemonicModal.set(false)
    dispatch('confirm')
    close()
  }

  // ---- Copy to clipboard functionality ----
  let copySuccess = false
  async function copyMnemonic() {
    try {
      await navigator.clipboard.writeText(mnemonic)
      copySuccess = true
      setTimeout(() => copySuccess = false, 2000)
    } catch (err) {
      console.error('Failed to copy mnemonic:', err)
    }
  }
</script>

<!-- Wrapper needed by Flowbite -->
<div id="mnemonic-modal" bind:this={modalElement} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full backdrop-blur-sm">
  <div class="relative w-full max-w-lg max-h-full">
    <!-- Modal content -->
    <div class="relative bg-white rounded-lg shadow dark:bg-gray-800">
      <!-- Header -->
      <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Save Your Recovery Phrase
        </h3>
      </div>
      <!-- Body -->
      <div class="p-6 space-y-4">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/20 dark:border-amber-700">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-amber-800 dark:text-amber-200">
                Important: Write down your recovery phrase
              </h3>
              <div class="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <p>This is the only way to recover your wallet if you lose access. Store it securely and never share it with anyone.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Your Recovery Phrase</h3>
          <div class="relative">
            <div class="p-4 text-sm bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 font-mono">
              {mnemonic}
            </div>
            <button
              type="button"
              on:click={copyMnemonic}
              class="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              title="Copy to clipboard"
            >
              {#if copySuccess}
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• Write down these words in order on paper</p>
          <p>• Store the paper in a safe place</p>
          <p>• Never store it digitally or share it online</p>
          <p>• Anyone with this phrase can access your wallet</p>
        </div>

        <div>
          <label for="confirmation" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            Type <span class="font-mono font-semibold">I HAVE WRITTEN IT DOWN</span> to continue
          </label>
          <input
            id="confirmation"
            bind:value={confirmationValue}
            placeholder="I HAVE WRITTEN IT DOWN"
            class="block w-full p-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
      </div>
      <!-- Footer -->
      <div class="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-700">
        <button
          type="button"
          on:click={handleConfirm}
          disabled={!isMatch}
          class="py-2.5 px-5 text-sm font-medium text-white bg-purple-600 rounded-lg enabled:hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 disabled:opacity-60 dark:bg-purple-600 dark:enabled:hover:bg-purple-700 dark:focus:ring-purple-800 cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</div>