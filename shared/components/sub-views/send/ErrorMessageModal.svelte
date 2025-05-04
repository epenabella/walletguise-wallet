<script>
  import { onMount } from 'svelte';
  import { Modal } from 'flowbite';

  // Reference to the modal element
  let modalElement;
  // Modal instance
  let modal;

  // Error data props
  export let errorTitle = 'Error';
  export let errorMessage = '';
  export let errorDetails = '';
  export let onDismiss = () => {}; // Callback function for dismissal

  // Export these methods for parent components
  export function open() {
    if (modal) modal.show();
  }

  export function close() {
    if (modal) modal.hide();
    onDismiss();
  }

  export function getModalElement() {
    return modalElement;
  }

  onMount(() => {
    modal = new Modal(modalElement, {
      placement: 'center',
      closable: true,
      backdrop: 'dynamic',
      backdropClasses: '!bg-black opacity-[.8] w-[350px] h-[380px] absolute top-0 left-0 z-[50]'
    });
  });
</script>

<div style="z-index: 51 !important;" id="error-message-modal" bind:this={modalElement} tabindex="-1" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full">
  <div class="relative m-auto max-w-[calc(100%-1.5rem)]">
    <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
      <button on:click={close} type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="error-message-modal">
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
        <span class="sr-only">Close modal</span>
      </button>
      <div class="p-4 md:p-5 text-center">
        <svg class="mx-auto mb-4 text-red-500 w-6 h-6 dark:text-red-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        <h3 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">{errorTitle}</h3>

        <div class="text-left mb-5">
          <div class="p-2 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <p class="font-medium">{errorMessage}</p>
            {#if errorDetails}
              <div class="mt-2 text-xs overflow-auto max-h-32 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                <code>{errorDetails}</code>
              </div>
            {/if}
          </div>

          <div class="text-xs text-gray-600 dark:text-gray-400">
            <p>If this issue persists, please try the following:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Check your wallet connection</li>
              <li>Verify you have enough SOL for the transaction and fees</li>
              <li>Make sure you're connected to the correct network</li>
            </ul>
          </div>
        </div>

        <button
          on:click={close}
          type="button"
          class="text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
        >
          OK, Got It
        </button>
      </div>
    </div>
  </div>
</div>