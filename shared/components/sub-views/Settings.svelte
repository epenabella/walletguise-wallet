<script lang="ts">
  import DarkModeToggle from "~shared/components/settings-toggles/DarkModeToggle.svelte"
  import NetworkToggle from "~shared/components/settings-toggles/NetworkToggle.svelte"
  import DeletePrivateKeysModal from "~shared/components/settings-toggles/DeleteWallet/DeletePrivateKeysModal.svelte"
  import { deleteKeys } from "~shared/utils/backgroundHelper"

  let dropdownOpen = false
  let deleteModal: DeletePrivateKeysModal;   // reference to modal instance


  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest("#networkDropdown") && !target.closest("#networkDropdownButton")) {
      dropdownOpen = false
    }
  }

</script>

<svelte:window on:click={handleClickOutside} />

<div class="p-2 flex flex-col">
  <h2 class="text-lg font-semibold mb-4 dark:text-white">Settings</h2>
  <div class="flex flex-col gap-3 justify-start !h-[284px]">
    <DarkModeToggle />
    <NetworkToggle bind:dropdownOpen={dropdownOpen} />
    <div class="grow"></div>
    <div class="pb-1 flex justify-end">
      <button
        on:click={() => deleteModal?.open()}
        class="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900">
                <span class="flex items-center">
          <svg class="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 18 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z" />
          </svg>
          Delete Wallet
        </span>
      </button>
    </div>
  </div>
  <!-- Future wallet extension settings can be added here -->
  <DeletePrivateKeysModal
    bind:this={deleteModal}
    on:confirm={deleteKeys}/>
</div>