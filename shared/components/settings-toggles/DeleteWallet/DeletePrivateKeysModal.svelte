<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte'
  import { Modal } from 'flowbite'

  const dispatch = createEventDispatcher()

  // Parent can pass a callback or listen for the `confirm` event
  export let onConfirm: () => void = () => {}

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
      modal = new Modal(modalElement)
    }
  })

  // ---- Confirmation gate ----
  let confirmationValue = ''
  $: isMatch = confirmationValue === 'DELETE'

  function handleConfirm() {
    onConfirm()
    dispatch('confirm')
    close()
  }
</script>

<!-- Wrapper needed by Flowbite -->
<div id="delete-keys-modal" bind:this={modalElement} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full backdrop-blur-sm">
  <div class="relative w-full max-w-md max-h-full">
    <!-- Modal content -->
    <div class="relative bg-white rounded-lg shadow dark:bg-gray-800">
      <!-- Header -->
      <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Delete all private keys?
        </h3>
        <button type="button" on:click={close} class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
          <svg aria-hidden="true" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span class="sr-only">Close modal</span>
        </button>
      </div>
      <!-- Body -->
      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-300">
          <span class="font-semibold text-red-600">Removing all private keys</span> from this browser is <span class="font-semibold">irreversible</span>- losing access to any accounts not backed‑up.
        </p>
        <div>
          <label for="confirmation" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Type <span class="font-mono">DELETE</span> to continue</label>
          <input id="confirmation" bind:value={confirmationValue} placeholder="DELETE" class="block w-full p-2 text-xs text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
        </div>
      </div>
      <!-- Footer -->
      <div class="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-700">
        <button type="button" on:click={close} class="py-2.5 px-5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">Cancel</button>
        <button type="button" on:click={handleConfirm} disabled={!isMatch} class="py-2.5 px-5 text-sm font-medium text-white bg-red-600 rounded-lg enabled:hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-60 dark:bg-red-600 dark:enabled:hover:bg-red-700 dark:focus:ring-red-800">Delete</button>
      </div>
    </div>
  </div>
</div>

<!--<style>-->
<!--    /* Optional: smoother fade for backdrop */-->
<!--    .backdrop-blur-sm::before {-->
<!--        content: '';-->
<!--        position: fixed;-->
<!--        inset: 0;-->
<!--        backdrop-filter: blur(4px);-->
<!--        -webkit-backdrop-filter: blur(4px);-->
<!--    }-->
<!--</style>-->