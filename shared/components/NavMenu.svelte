<script lang="ts">
  import WgLogo from "~shared/components/icons/WgLogo.svelte"
  import SendMoneyIcon from "~shared/components/icons/SendMoneyIcon.svelte"
  import SettingsIcon from "~shared/components/icons/SettingsIcon.svelte"
  import QrIcon from "~shared/components/icons/QrIcon.svelte"
  import MenuButton from "~shared/components/buttons/MenuButton.svelte"
  import { selectedAuthTab, type AuthTab } from "~shared/utils/navStore"

  function setTab(e: MouseEvent, tab: AuthTab) {
    e.preventDefault()
    selectedAuthTab.set(tab)
  }
</script>
<div
  class="flex flex-col min-w-[56px] max-w-[56px] min-h-[380px] max-h-[380px] z-50 gap-2 py-2  bg-white border-r border-gray-200 dark:bg-gray-700 dark:border-gray-600">
  <MenuButton title="Main" onClick={e => setTab(e, 'balance')}>
    <WgLogo width={24} height={24} />
  </MenuButton>
  <MenuButton title="Send" onClick={e => setTab(e, 'send')}>
    <SendMoneyIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
  </MenuButton>
  <MenuButton title="Receive" onClick={e => setTab(e, 'receive')}>
    <QrIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
  </MenuButton>
  <MenuButton title="Settings" onClick={e => setTab(e, 'settings')}>
    <SettingsIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
  </MenuButton>
</div>

<!--<div class="border-b border-gray-200 dark:border-gray-700">-->
<!--  <ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 ">-->
<!--    <li class="me-2">-->
<!--      <button-->
<!--        class="inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-150"-->
<!--        class:border-transparent={$selectedAuthTab !== 'balance'}-->
<!--        class:hover:text-gray-600={$selectedAuthTab !== 'balance'}-->
<!--        class:hover:border-gray-300={$selectedAuthTab !== 'balance'}-->
<!--        class:dark:hover:text-gray-300={$selectedAuthTab !== 'balance'}-->
<!--        class:text-blue-600={$selectedAuthTab === 'balance'}-->
<!--        class:border-blue-600={$selectedAuthTab === 'balance'}-->
<!--        class:dark:text-blue-500={$selectedAuthTab === 'balance'}-->
<!--        class:dark:border-blue-500={$selectedAuthTab === 'balance'}-->
<!--        on:click={() => $selectedAuthTab = 'balance'}-->
<!--      >-->
<!--        Balance-->
<!--      </button>-->
<!--    </li>-->
<!--    <li class="me-2">-->
<!--      <button-->
<!--        class="inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-150"-->
<!--        class:border-transparent={$selectedAuthTab !== 'send'}-->
<!--        class:hover:text-gray-600={$selectedAuthTab !== 'send'}-->
<!--        class:hover:border-gray-300={$selectedAuthTab !== 'send'}-->
<!--        class:dark:hover:text-gray-300={$selectedAuthTab !== 'send'}-->
<!--        class:text-blue-600={$selectedAuthTab === 'send'}-->
<!--        class:border-blue-600={$selectedAuthTab === 'send'}-->
<!--        class:dark:text-blue-500={$selectedAuthTab === 'send'}-->
<!--        class:dark:border-blue-500={$selectedAuthTab === 'send'}-->
<!--        on:click={() => $selectedAuthTab = 'send'}-->
<!--      >-->
<!--        Send-->
<!--      </button>-->
<!--    </li>-->
<!--    <li class="me-2">-->
<!--      <button-->
<!--        class="inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-150"-->
<!--        class:border-transparent={$selectedAuthTab !== 'history'}-->
<!--        class:hover:text-gray-600={$selectedAuthTab !== 'history'}-->
<!--        class:hover:border-gray-300={$selectedAuthTab !== 'history'}-->
<!--        class:dark:hover:text-gray-300={$selectedAuthTab !== 'history'}-->
<!--        class:text-blue-600={$selectedAuthTab === 'history'}-->
<!--        class:border-blue-600={$selectedAuthTab === 'history'}-->
<!--        class:dark:text-blue-500={$selectedAuthTab === 'history'}-->
<!--        class:dark:border-blue-500={$selectedAuthTab === 'history'}-->
<!--        on:click={() => $selectedAuthTab = 'history'}-->
<!--      >-->
<!--        History-->
<!--      </button>-->
<!--    </li>-->
<!--  </ul>-->
<!--</div>-->