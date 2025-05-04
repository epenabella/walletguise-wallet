<script lang="ts">
    import { Input, Button } from "flowbite-svelte"
    import { Keypair } from "@solana/web3.js"
    import { createEventDispatcher } from "svelte"
    import { wgLocalSecureStore } from "~shared/utils/wgAppStore"
    import bs58 from "bs58"
    import { importFromMnemonic, sha256 } from "~shared/utils/crypto"
    import type { SecureStorage } from "@plasmohq/storage/secure"
    import WgLogo from "~shared/components/icons/WgLogo.svelte"
    import { kpStore } from "~shared/utils/kpStore"
    import { unlockWallet } from "~shared/utils/backgroundHelper"
    import { STORAGE_KEYS } from "~shared/utils/constants"

    // export let secure: SecureStorage
    const dispatch = createEventDispatcher()
    let password = "";
    let hasWallet = false

    // let savedHash = '';
    let mode: "create" | "unlock";
    $: mode = hasWallet ? "unlock" : "create"        // "create" | "unlock"


    chrome.storage.local.get(null, items => {
        Object.keys(items).forEach(key => {
            if (key.indexOf(STORAGE_KEYS.ENC_WALLET) >= 0) {
                debugger;
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

            //import or createNew()?  input seedphrase or grindClue to create

            // if createNew(), then grind clue, then special transcaction


            tempKp = input ? importFromMnemonic(input).keypair : Keypair.generate();

            await wgLocalSecureStore.setPassword(password)
            await wgLocalSecureStore.set(STORAGE_KEYS.ENC_WALLET, bs58.encode(tempKp.secretKey))
            console.log('created kp: ' + tempKp.publicKey)

            await wgLocalSecureStore.set(STORAGE_KEYS.HASH, await sha256(password))
            hasWallet = true;
            // dispatch("success");
        } else {
            // ------- unlock ----------
            await wgLocalSecureStore.setPassword(password)
            // prime AES key
            const enc = await wgLocalSecureStore.get<string>(STORAGE_KEYS.ENC_WALLET)
            console.log('unlock enc: ' + enc.toLowerCase())

            if (!enc) return alert("Stored wallet not found")

            tempKp = Keypair.fromSecretKey(bs58.decode(enc))
            console.log('unlock kp: ' + tempKp.publicKey)
            await wgLocalSecureStore.set(STORAGE_KEYS.ENC_WALLET, enc)
            hasWallet = true;
            // dispatch("success")
        }

        await chrome.storage.session.set({
            wg_session_wallet: bs58.encode(tempKp.secretKey)
        }).then(res => {
            unlockWallet(password).then(r => {
                if (tempKp) {
                    kpStore.set(tempKp);
                }
                dispatch("success");
            }).catch(e => {
                console.error('login unlock error: ' + JSON.stringify(e))
            });
        })


    };

</script>


<div class="w-full flex justify-center">
    <WgLogo width={64} height={64} />
</div>
<form class="p-4 flex flex-col gap-4 w-full" on:submit|preventDefault={handleSubmit}>
    <h2 class="text-xl font-semibold text-center text-gray-900 dark:text-white">
        {mode === "create" ? "Create Wallet Password" : "Unlock Wallet"}
    </h2>
    <Input type="password" bind:value={password} placeholder="Password" required class="w-full" />
    <Button type="submit" class="w-full mt-2" style="background-color: red;">
        {mode === "create" ? "Create" : "Unlock"}
    </Button>
</form>