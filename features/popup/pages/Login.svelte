<script lang="ts">
    import { Input, Button } from "flowbite-svelte";
    import { Keypair } from "@solana/web3.js";
    import {createEventDispatcher, onMount} from "svelte";
    import { saveNewWallet } from "~shared/utils/wallet"
    import { STORAGE_KEYS } from "~shared/utils/secureStore"
    import bs58 from "bs58"
    import { sha256 } from "~shared/utils/crypto"
    import type { SecureStorage } from "@plasmohq/storage/secure"

    export let secure: SecureStorage

    const dispatch = createEventDispatcher();
    let password = "";
    let hasWallet = false

    // let savedHash = '';
    let mode: "create" | "unlock";
    $: mode = hasWallet ? "unlock" : "create"        // "create" | "unlock"

    // secure.get<string>(STORAGE_KEYS.HASH).then(h => {
    //     hasWallet = !!h
    //     if (hasWallet) {
    //          alert('has wallet login');
    //     }
    // });

    chrome.storage.local.get(null, items => {
        Object.keys(items).forEach(key => {
            console.log(`${key}: ${items[key]}`);
            const maybeHashKey = key.split('|').at(-1);
            if (maybeHashKey !== STORAGE_KEYS.HASH) return;
            const walletKey = key.replace(STORAGE_KEYS.HASH, STORAGE_KEYS.ENC_WALLET);
            const enc = items[walletKey];

            if (enc) {
                hasWallet = !!enc;
            }

            // console.log(`try restore enc:\n${enc}`)
            //
            // kp = Keypair.fromSecretKey(bs58.decode(enc));

            // if (kp) {
            //     console.log('restored on outset')
            // }
        })
    })


    const handleSubmit = async () => {
        // e.preventDefault();

        if (!password) return;
        let kp = null;
        if (mode === "create") {
            // const hash = await sha256(password);
            // await storage.set(storage.STORAGE_KEYS.HASH, hash);
            kp = Keypair.generate();
            await secure.setPassword(password)
            await secure.set(STORAGE_KEYS.ENC_WALLET, bs58.encode(kp.secretKey))
            console.log('created kp: ' + kp.publicKey)

            await secure.set(STORAGE_KEYS.HASH, await sha256(password))
            hasWallet = true;
            // dispatch("success");
        } else {
            // ------- unlock ----------
            await secure.setPassword(password)
            // prime AES key
            const enc = await secure.get<string>(STORAGE_KEYS.ENC_WALLET)
            console.log('unlock enc: ' + enc.toLowerCase())

            if (!enc) return alert("Stored wallet not found")

            kp = Keypair.fromSecretKey(bs58.decode(enc))
            console.log('unlock kp: ' + kp.publicKey)
            await secure.set(STORAGE_KEYS.ENC_WALLET, enc)
            hasWallet = true;
            // dispatch("success")
        }

        await chrome.storage.session.set({
            wg_session_wallet: bs58.encode(kp.secretKey)
        })
        dispatch("success");
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