<script lang="ts">
  import DarkModeToggle from "~shared/components/settings-toggles/DarkModeToggle.svelte"
  import { onMount } from "svelte"
  import NetworkToggle from "~shared/components/settings-toggles/NetworkToggle.svelte"

  let dropdownOpen = false;

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('#networkDropdown') && !target.closest('#networkDropdownButton')) {
      dropdownOpen = false
    }
  }

</script>

<svelte:window on:click={handleClickOutside} />

<div class="p-2 flex flex-col">
  <h2 class="text-lg font-semibold mb-4 dark:text-white">Settings</h2>
  <div class="flex flex-col gap-3">
    <DarkModeToggle />
    <NetworkToggle bind:dropdownOpen={dropdownOpen}/>
  </div>
  <!-- Network Dropdown Toggle -->


  <!-- Future wallet extension settings can be added here -->
</div>