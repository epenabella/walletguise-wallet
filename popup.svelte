<script lang="ts">
  import "~assets/style.css" // Tailwind base
  import Login from "~features/popup/pages/Login.svelte"
  import Balance from "~shared/components/Balance.svelte"
  import { Keypair } from "@solana/web3.js"
  import bs58 from "bs58"
  import { secureStore, STORAGE_KEYS } from "~shared/utils/secureStore"
  import { onMount } from "svelte"
  import WgLogo from "~shared/components/icons/WgLogo.svelte"
  import SendMoneyIcon from "~shared/components/icons/SendMoneyIcon.svelte"
  import SettingsIcon from "~shared/components/icons/SettingsIcon.svelte"
  import QrIcon from "~shared/components/icons/QrIcon.svelte"
  import MenuButton from "~shared/components/buttons/MenuButton.svelte"

  /* ---------- secure-storage setup ---------- */

  let kp: Keypair | null = null
  // $: {
  //     console.log('kp changed: ' + JSON.stringify(kp?.publicKey))
  // }
  // current decrypted key-pair
  let showQr = false


  chrome.storage.session.get("wg_session_wallet", async (obj) => {
    console.log("session obj: " + JSON.stringify(obj))
    if (obj.wg_session_wallet) {
      kp = Keypair.fromSecretKey(bs58.decode(obj.wg_session_wallet))
      console.log("kp found: " + JSON.stringify(kp?.publicKey))

      await chrome.runtime.sendMessage({
        type: "walletguise#restore",
        secretKey: obj.wg_session_wallet        // same base-58 string
      })
    }
  })


  chrome.storage.onChanged.addListener((c, a) => {

    const storageKey = Object.keys(c)[0]
    const secureKey = storageKey.split("|").at(-1)

    if (!storageKey || !secureKey) return

    console.log("storageKey: " + storageKey)
    console.log("secureKey: " + secureKey)

    if (secureKey !== STORAGE_KEYS.ENC_WALLET) return

    try {
      // This call *decrypts* because setPassword() was done in Login
      secureStore.get<string>(STORAGE_KEYS.ENC_WALLET).then(enc => {
        kp = enc
          ? Keypair.fromSecretKey(bs58.decode(enc))  // enc is now base-58
          : null

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
  })
</script>

<div
  class="flex w-full bg-white  dark:bg-gray-700 min-w-[350px] max-w-[350px] min-h-[380px] max-h-[380px]">
    {#if !kp}
        <div
          class="flex flex-col min-h-[380px] max-h-[380px] min-w-[350px] max-w-[350px] z-50 gap-2 py-2  bg-white border-r border-gray-200 dark:bg-gray-700 dark:border-gray-600">

            <Login bind:kp={kp} />
        </div>
    {:else}
        <div
          class="flex flex-col min-w-[56px] max-w-[56px] min-h-[380px] max-h-[380px] z-50 gap-2 py-2  bg-white border-r border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <MenuButton title="Main">
                <WgLogo width={24} height={24} />
            </MenuButton>
            <MenuButton title="Send">
                <SendMoneyIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
            </MenuButton>
            <MenuButton title="Receive">
                <QrIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
            </MenuButton>
            <MenuButton title="Settings">
                <SettingsIcon width={24} height={24} className="text-gray-500 dark:text-gray-400" />
            </MenuButton>
        </div>
        <div class="min-h-[380px] max-h-[380px] min-w-[294px] max-w-[294px]">
            <Balance {kp}/>
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
