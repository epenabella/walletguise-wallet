<script lang="ts">
    import "./style.css";            // Tailwind base
    import Login from "./features/popup/pages/Login.svelte";
    import Balance from "./shared/components/Balance.svelte";
    import QrModal from "./features/popup/pages/QrModal.svelte";
    import { onMount } from "svelte";
    import { writable } from "svelte/store"
    import * as sess from "@plasmohq/storage"
    import { Keypair } from "@solana/web3.js"
    import bs58 from "bs58"
    import { SecureStorage } from "@plasmohq/storage/secure"
    import { STORAGE_KEYS } from "~shared/utils/secureStore"

    /* ---------- secure-storage setup ---------- */
    const secure      = new SecureStorage({ area: "local" })

    let kp: Keypair | null = null          // current decrypted key-pair
    let showQr = false

    chrome.storage.session.get("wg_session_wallet", async (obj) => {
        console.log('session obj: ' + JSON.stringify(obj))
        if (obj.wg_session_wallet) {
            kp = Keypair.fromSecretKey(bs58.decode(obj.wg_session_wallet))

            await chrome.runtime.sendMessage({
                type: "walletguise#restore",
                secretKey: obj.wg_session_wallet        // same base-58 string
            })
        }
    })

    //session obj:
    // {"wg_session_wallet":"XqXHArJz95D8Vi36LUiFSkxRMnR5MiuEV4XuUmGZhkLCwy9CoN8PKMjVHRVGm4jVQC5mi7kUqjVpDZW58RDUQbx"}



    // chrome.storage.local.get(null, items => {
    //     Object.keys(items).forEach(key => {
    //         console.log(`${key}: ${items[key]}`);
    //         const maybeHashKey = key.split('|').at(-1);
    //         if (maybeHashKey !== STORAGE_KEYS.HASH) return;
    //         const walletKey = key.replace(STORAGE_KEYS.HASH, STORAGE_KEYS.ENC_WALLET);
    //         const enc = items[walletKey];
    //
    //         console.log(`try restore enc:\n${enc}`)
    //
    //         kp = Keypair.fromSecretKey(bs58.decode(enc));
    //
    //         if (kp) {
    //             console.log('restored on outset')
    //         }
    //     })
    // })


    // secure.get<string>(STORAGE_KEYS.HASH).then(async h => {
    //     console.log('h: ' + h);
    //     if (h) {
    //         const enc = await secure.get<string>(STORAGE_KEYS.ENC_WALLET)
    //         kp = Keypair.fromSecretKey(bs58.decode(enc))
    //
    //         if (kp) {
    //             console.log('has wallet get popup: ' + kp.publicKey);
    //         }
    //     }
    // });

    /* live listener – fires in every popup when ENC_WALLET changes */

    chrome.storage.onChanged.addListener((c,a)=>{

        const storageKey = Object.keys(c)[0];
        const secureKey = storageKey.split('|').at(-1);

        console.log('storageKey: ' + storageKey);
        console.log('secureKey: ' + secureKey);

        if (secureKey !== STORAGE_KEYS.ENC_WALLET) return;

        try {
            // This call *decrypts* because setPassword() was done in Login
            secure.get<string>(STORAGE_KEYS.ENC_WALLET).then(enc => {
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

        // if (secureKey === STORAGE_KEYS.ENC_WALLET) {
        //     const val = c[storageKey]
        //     console.log("val:")
        //     console.log(val)
        //     const enc = val.newValue
        //     kp = enc ? Keypair.fromSecretKey(bs58.decode(enc)) : null
        //     console.log("kp: " + kp.publicKey)
        // }
        // console.log("changed c + a:\n" + JSON.stringify(c) + "\na " + JSON.stringify(a))
    })

    // secure.watch({
    //     "walletguise_encrypted_wallet": (a,b) => {
    //         try {
    //             console.debug('secure watch:' + JSON.stringify(b))
    //             alert('kp watch: ' + kp.publicKey)
    //             secure.get<string>(STORAGE_KEYS.ENC_WALLET).then(enc => {
    //                 kp = enc ? Keypair.fromSecretKey(bs58.decode(enc)) : null
    //             })   // auto-decrypts
    //
    //         } catch {
    //             // happens if setPassword() has not been called yet
    //             kp = null
    //         }
    //     }
    // })
    /* ---------------------------------------------------------- */

    /** called by Login.svelte once it has a decrypted Keypair */
    // async function setKeypair(k: Keypair) {
    //     kp = k
    //     await secure.set(ENC_WALLET, bs58.encode(k.secretKey))       // encrypt + store
    // }


</script>
<div>
    {#if kp === null}
        <Login {secure} />
    {:else}
        <Balance {kp}/>
<!--        <button class="mt-4 mx-auto block px-4 py-2 bg-purple-600 text-white rounded" on:click={() => (showQr = true)}>-->
<!--            Show QR-->
<!--        </button>-->
<!--        <QrModal bind:open={showQr} {kp} />-->
    {/if}
</div>