<script lang="ts">
  import { clusterStore, type Cluster } from "~shared/utils/networkStore"

  export let dropdownOpen = false

  // Toggle dropdown visibility
  function toggleDropdown() {
    dropdownOpen = !dropdownOpen
  }

  function setCluster(newCluster: Cluster) {
    clusterStore.set(newCluster)
    dropdownOpen = false

    // Send message to background script to rebuild Connection
    // chrome.runtime.sendMessage({ type: "walletguise#setCluster", cluster: newCluster })
  }

  // Helper to format cluster name for display
  function formatClusterName(cluster: Cluster): string {
    if (cluster === "mainnet-beta") return "Mainnet-beta"
    if (cluster === "devnet") return "Devnet"
    return "Testnet"
  }

</script>

<div class="p-2">
  <div class="flex justify-between items-center">
  <label class="block text-sm font-medium mb-1 dark:text-white">Network</label>
  <div class="relative">
    <button
      id="networkDropdownButton"
      on:click={toggleDropdown}
      class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      type="button">
      {formatClusterName($clusterStore)}
      <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
      </svg>
    </button>

    <!-- Dropdown menu -->
    <div
      id="networkDropdown"
      class="{dropdownOpen ? '' : 'hidden'} absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-full mt-1 dark:bg-gray-700">
      <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="networkDropdownButton">
        <li>
          <button
            on:click={() => setCluster("mainnet-beta")}
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white {$clusterStore === 'mainnet-beta' ? 'bg-gray-100 dark:bg-gray-600' : ''}">
            Mainnet-beta
          </button>
        </li>
        <li>
          <button
            on:click={() => setCluster("testnet")}
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white {$clusterStore === 'testnet' ? 'bg-gray-100 dark:bg-gray-600' : ''}">
            Testnet
          </button>
        </li>
        <li>
          <button
            on:click={() => setCluster("devnet")}
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white {$clusterStore === 'devnet' ? 'bg-gray-100 dark:bg-gray-600' : ''}">
            Devnet
          </button>
        </li>
      </ul>
    </div>
  </div>
  </div>
</div>