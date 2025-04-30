<script lang="ts">
    import { Input, Button } from "flowbite-svelte";
    import { Keypair } from "@solana/web3.js";
    import {createEventDispatcher, onMount} from "svelte";
    import { saveNewWallet } from "~shared/utils/wallet"
    import { STORAGE_KEYS, secureStore } from "~shared/utils/secureStore"
    import bs58 from "bs58"
    import { importFromMnemonic, sha256 } from "~shared/utils/crypto"
    import type { SecureStorage } from "@plasmohq/storage/secure"

    // export let secure: SecureStorage
    export let kp: Keypair | null = null;
    const dispatch = createEventDispatcher();
    let password = "";
    let hasWallet = false

    // let savedHash = '';
    let mode: "create" | "unlock";
    $: mode = hasWallet ? "unlock" : "create"        // "create" | "unlock"

    // secureStore.get<string>(STORAGE_KEYS.HASH).then(h => {
    //     hasWallet = !!h
    //     if (hasWallet) {
    //          alert('has wallet login');
    //     }
    // });

    // chrome.storage.local.get(null, items => {
    //     Object.keys(items).forEach(key => {
    //         const maybeHashKey = key.split('|').at(-1);
    //         if (maybeHashKey !== STORAGE_KEYS.HASH) return;
    //         const walletKey = key.replace(STORAGE_KEYS.HASH, STORAGE_KEYS.ENC_WALLET);
    //         // const enc = items[walletKey];
    //         if (items[walletKey]) {
    //             hasWallet = !!items[walletKey];
    //         }
    //     })
    // })

    chrome.storage.session.get(null, items => {
        Object.keys(items).forEach(key => {
            if (key === "wg_session_wallet") {
                hasWallet = true;
            }
        })
    })


    const handleSubmit = async () => {
        // e.preventDefault();

        if (!password) return;
        let tempKp: Keypair | null = null;
        if (mode === "create") {
            // const hash = await sha256(password);
            // await storage.set(storage.STORAGE_KEYS.HASH, hash);
            const input = prompt("Please enter seed phrase", '');

            tempKp = input ? importFromMnemonic(input).keypair : Keypair.generate();

            await secureStore.setPassword(password)
            await secureStore.set(STORAGE_KEYS.ENC_WALLET, bs58.encode(tempKp.secretKey))
            console.log('created kp: ' + tempKp.publicKey)

            await secureStore.set(STORAGE_KEYS.HASH, await sha256(password))
            hasWallet = true;
            // dispatch("success");
        } else {
            // ------- unlock ----------
            await secureStore.setPassword(password)
            // prime AES key
            const enc = await secureStore.get<string>(STORAGE_KEYS.ENC_WALLET)
            console.log('unlock enc: ' + enc.toLowerCase())

            if (!enc) return alert("Stored wallet not found")

            tempKp = Keypair.fromSecretKey(bs58.decode(enc))
            console.log('unlock kp: ' + tempKp.publicKey)
            await secureStore.set(STORAGE_KEYS.ENC_WALLET, enc)
            hasWallet = true;
            // dispatch("success")
        }

        await chrome.storage.session.set({
            wg_session_wallet: bs58.encode(tempKp.secretKey)
        })

        chrome.runtime.sendMessage({ type: "walletguise#unlock", password }).then(r => {
            console.log('unlock then(): ' + JSON.stringify(r))

            console.log('unlock res: ' + JSON.stringify(r));

            if (tempKp) {
                kp = tempKp;
            }

            dispatch("success");

        }).catch(e => {
            console.log('unlock error: ' + JSON.stringify(e))
        });


    };

    // onMount(() => {
    //     secureStorage.get<string>(secureStorage.STORAGE_KEYS.HASH).then(res => {
    //         savedHash = res;
    //     })
    // })
</script>

<form class="p-4 flex flex-col gap-4 w-64" on:submit|preventDefault={handleSubmit}>
    <h2 class="text-xl font-semibold text-center">
        {mode === "create" ? "Create Wallet Password" : "Unlock Wallet"}
    </h2>
    <Input type="password" bind:value={password} placeholder="Password" required class="w-full" />
    <Button type="submit" class="w-full mt-2" style="background-color: red;">
        {mode === "create" ? "Create" : "Unlock"}
    </Button>
</form>