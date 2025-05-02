<script lang="ts">
    import "~assets/style.css" // Tailwind base
    import Login from "~features/popup/pages/Login.svelte";
    import Balance from "~shared/components/Balance.svelte";
    import { Keypair } from "@solana/web3.js"
    import bs58 from "bs58"
    import { secureStore, STORAGE_KEYS } from "~shared/utils/secureStore"

    /* ---------- secure-storage setup ---------- */

    let kp: Keypair | null = null
    // $: {
    //     console.log('kp changed: ' + JSON.stringify(kp?.publicKey))
    // }
    // current decrypted key-pair
    let showQr = false



    chrome.storage.session.get("wg_session_wallet", async (obj) => {
        console.log('session obj: ' + JSON.stringify(obj))
        if (obj.wg_session_wallet) {
            kp = Keypair.fromSecretKey(bs58.decode(obj.wg_session_wallet))
            console.log('kp found: ' + JSON.stringify(kp?.publicKey))

            await chrome.runtime.sendMessage({
                type: "walletguise#restore",
                secretKey: obj.wg_session_wallet        // same base-58 string
            })
        }
    })


    chrome.storage.onChanged.addListener((c,a)=>{

        const storageKey = Object.keys(c)[0];
        const secureKey = storageKey.split('|').at(-1);

        if (!storageKey || !secureKey) return;

        console.log('storageKey: ' + storageKey);
        console.log('secureKey: ' + secureKey);

        if (secureKey !== STORAGE_KEYS.ENC_WALLET) return;

        try {
            // This call *decrypts* because setPassword() was done in Login
            secureStore.get<string>(STORAGE_KEYS.ENC_WALLET).then(enc => {
                kp  = enc
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


</script>
<div>
    {#if !kp}
        <Login bind:kp={kp}/>
    {:else}
        <Balance {kp}/>
<!--        <button class="mt-4 mx-auto block px-4 py-2 bg-purple-600 text-white rounded" on:click={() => (showQr = true)}>-->
<!--            Show QR-->
<!--        </button>-->
<!--        <QrModal bind:open={showQr} {kp} />-->
    {/if}
</div>