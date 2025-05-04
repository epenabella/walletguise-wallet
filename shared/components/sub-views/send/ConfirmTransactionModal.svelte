<!--<button data-modal-target="tx-confirm-modal" data-modal-toggle="tx-confirm-modal" class="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">-->
<!--  Toggle modal-->
<!--</button>-->

<script>
  import { onMount } from 'svelte';
  import { Modal } from 'flowbite';

  export let recipient = '';
  export let amount = '';
  export let onConfirm = () => {}; // Callback function for confirmation

  let modalElement;
  let modal;

  // Export these methods for parent components
  export function open() {
    if (modal) modal.show();
  }

  export function close() {
    if (modal) modal.hide();
  }

  export function getModalElement() {
    return modalElement;
  }

  function formatAddress(address) {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  function handleConfirm() {
    onConfirm();
    close();
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

<div style="z-index: 51 !important;" id="tx-confirm-modal" bind:this={modalElement} tabindex="-1" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full">
  <div class="relative m-auto max-w-[calc(100%-1.5rem)]">
    <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
      <button on:click={close} type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="tx-confirm-modal">
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
        <span class="sr-only">Close modal</span>
      </button>
      <div class="p-4 md:p-5 text-center">
        <svg class="mx-auto mb-4 text-yellow-400 w-6 h-6 dark:text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-200">Confirm Transaction</h3>

        <div class="text-left mb-5">
          <div class="mb-3">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Sending</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">{amount} SOL</p>
          </div>

          <div class="mb-3">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">To Address</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white break-all">{formatAddress(recipient)}</p>
            <button type="button" class="text-xs text-blue-600 hover:underline dark:text-blue-400">View Full Address</button>
          </div>

          <div class="mb-3">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Network</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Solana Devnet</p>
          </div>
        </div>

        <div class="flex">
          <button
            on:click={handleConfirm}
            type="button"
            class="text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
          >
            Confirm Transaction
          </button>
          <button
            on:click={close}
            type="button"
            class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  </div>
</div>