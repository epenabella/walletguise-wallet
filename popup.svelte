<script lang="ts">
  import "~assets/style.css" // Tailwind base
  import Login from "~features/popup/views/LoginView.svelte"
  import AuthView from "~features/popup/views/AuthView.svelte"
  import { Keypair } from "@solana/web3.js"
  import bs58 from "bs58"
  import { wgLocalSecureStore } from "~shared/utils/wgAppStore"
  import { onMount } from "svelte"
  import NavMenu from "~shared/components/NavMenu.svelte"
  import {kpStore} from '~shared/utils/kpStore'
  import Balance from "~shared/components/sub-views/Balance.svelte"
  import { clusterStore } from "~shared/utils/networkStore"
  import { restoreWallet } from "~shared/utils/backgroundHelper"
  import { STORAGE_KEYS } from "~shared/utils/constants"

  let mounted = false;

  chrome.storage.onChanged.addListener((c, a) => {

    const storageKey = Object.keys(c)[0]
    const secureKey = storageKey.split("|").at(-1)

    if (!storageKey || !secureKey) return

    console.log("storageKey: " + storageKey)
    console.log("secureKey: " + secureKey)

    if (secureKey !== STORAGE_KEYS.ENC_WALLET) return

    try {
      // This call *decrypts* because setPassword() was done in Login
      wgLocalSecureStore.get<string>(STORAGE_KEYS.ENC_WALLET).then(enc => {
        const kp = enc
          ? Keypair.fromSecretKey(bs58.decode(enc))  // enc is now base-58
          : null

          kpStore.set(kp);

        console.log("Restored kp:", kp?.publicKey?.toBase58())
      }).catch(e => {
        console.log(e)
      })
    } catch {
      // Happens on first popup load before user typed password
      console.log("Password not set yet – waiting for unlock")
    }
  })


  onMount(() => {
      document.documentElement.classList.toggle("dark", true)
      document.documentElement.classList.toggle("bg-white", true)
      document.documentElement.classList.toggle("dark:bg-gray-700", true)
      document.body.classList.toggle("relative", true)

      chrome.storage.session.get("wg_session_wallet", async (obj) => {
          if (obj.wg_session_wallet) {
              await restoreWallet(obj.wg_session_wallet);
              kpStore.set(Keypair.fromSecretKey(bs58.decode(obj.wg_session_wallet)))
          }
          mounted = true;
          return;
      })
  })
</script>

<div
  class="flex w-full bg-white  dark:bg-gray-700 min-w-[350px] max-w-[350px] min-h-[380px] max-h-[380px]">
    {#if !$clusterStore || !mounted}
        <div class="min-h-[380px] max-h-[380px] min-w-[350px] max-w-[350px] flex">

        </div>

    {:else if !$kpStore}
        <!-- This branch will only execute if $kpStore is truthy AND someOtherCondition is truthy -->
        <div
          class="flex flex-col justify-center min-h-[380px] max-h-[380px] min-w-[350px] max-w-[350px] z-50 gap-2 py-2  bg-white border-r border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <Login />
        </div>

    {:else}

        <div class="min-h-[380px] max-h-[380px] min-w-[350px] max-w-[350px] flex">
            <NavMenu />
            <div class="flex flex-col min-h-[380px] max-h-[380px] min-w-[296px] max-w-[296px] w-[296px]">
                <Balance />
                <AuthView />
            </div>
        </div>
    {/if}
</div>


<!--<div style="min-width: 300px !important;">-->
<!--    {#if !kp}-->
<!--        <Login bind:kp={kp}/>-->
<!--    {:else}-->
<!--        <div class="flex flex-col">-->
<!--            <div class="flex">-->
<!--                &lt;!&ndash; TODO ADD NAVIGATION  &ndash;&gt;-->
<!--            </div>-->
<!--        <Balance {kp}/>-->
<!--        </div>-->
<!--    {/if}-->
<!--</div>-->


<!--        <button class="mt-4 mx-auto block px-4 py-2 bg-purple-600 text-white rounded" on:click={() => (showQr = true)}>-->
<!--            Show QR-->
<!--        </button>-->
<!--        <QrModal bind:open={showQr} {kp} />-->


<!--<li class="border-b border-gray-100 dark:border-gray-600">-->
<!--    <a href="#" class="flex items-center justify-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">-->
<!--        <img class="me-3 rounded-full w-11 h-11" src="/docs/images/people/profile-picture-1.jpg" alt="Jese Leos Avatar">-->
<!--        <div>-->
<!--            <p class="text-sm text-gray-500 dark:text-gray-400">New message from <span class="font-medium text-gray-900 dark:text-white">Jese Leos</span>: "Hey, what's up? All set for the presentation?"</p>-->
<!--            <span class="text-xs text-blue-600 dark:text-blue-500">a few moments ago</span>-->
<!--        </div>-->
<!--    </a>-->
<!--</li>-->
<!--<li class="border-b border-gray-100 dark:border-gray-600">-->
<!--    <a href="#" class="flex items-center justify-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">-->
<!--        <img class="me-3 rounded-full w-11 h-11" src="/docs/images/people/profile-picture-2.jpg" alt="Joseph McFall Avatar">-->
<!--        <div>-->
<!--            <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">Joseph McFall</span> and <span class="font-medium text-gray-900 dark:text-white">5 others</span> started following you.</p>-->
<!--            <span class="text-xs text-blue-600 dark:text-blue-500">10 minutes ago</span>-->
<!--        </div>-->
<!--    </a>-->
<!--</li>-->
<!--<li class="border-b border-gray-100 dark:border-gray-600">-->
<!--    <a href="#" class="flex items-center justify-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">-->
<!--        <img class="me-3 rounded-full w-11 h-11" src="/docs/images/people/profile-picture-3.jpg" alt="Bonnie Green Avatar">-->
<!--        <div>-->
<!--            <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">Bonnie Green</span> and <span class="font-medium text-gray-900 dark:text-white">141 others</span> love your story. See it and view more stories.</p>-->
<!--            <span class="text-xs text-blue-600 dark:text-blue-500">23 minutes ago</span>-->
<!--        </div>-->
<!--    </a>-->
<!--</li>-->
<!--<li class="border-b border-gray-100 dark:border-gray-600">-->
<!--    <a href="#" class="flex items-center justify-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">-->
<!--        <img class="me-3 rounded-full w-11 h-11" src="/docs/images/people/profile-picture-4.jpg" alt="Leslie Livingston Avatar">-->
<!--        <div>-->
<!--            <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">Leslie Livingston</span> mentioned you in a comment: <span class="font-medium text-blue-600 dark:text-blue-500 hover:underline">@bonnie.green</span> what do you say?</p>-->
<!--            <span class="text-xs text-blue-600 dark:text-blue-500">23 minutes ago</span>-->
<!--        </div>-->
<!--    </a>-->
<!--</li>-->
<!--<li>-->
<!--    <a href="#" class="flex items-center justify-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">-->
<!--        <img class="me-3 rounded-full w-11 h-11" src="/docs/images/people/profile-picture-5.jpg" alt="Robert Brown Avatar">-->
<!--        <div>-->
<!--            <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">Robert Brown</span> posted a new video: Glassmorphism - learn how to implement the new design trend. </p>-->
<!--            <span class="text-xs text-blue-600 dark:text-blue-500">23 minutes ago</span>-->
<!--        </div>-->
<!--    </a>-->
<!--</li>-->
