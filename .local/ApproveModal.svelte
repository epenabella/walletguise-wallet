<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";
    import type { Transaction } from "@solana/web3.js";
    import { walletStore } from "~shared/utils/kpStore";
    // import {sendSignedTx} from "~shared/utils/solana";

    export let open = false;
    export let tx: Transaction | null = null;

    const approve = async () => {
        if (!tx) return;
        const kp = $walletStore;
        if (!kp) return;
        tx.feePayer = kp.publicKey;
        tx.partialSign(kp);
        // const sig = await sendSignedTx(tx);
        // console.log("Tx sent:", sig);
        // open = false;
    };
</script>

<Modal bind:open>
    <div slot="header" class="text-xl font-semibold">Approve Transaction</div>
    <pre class="text-xs max-h-52 overflow-auto bg-gray-100 rounded p-2 mb-4">{JSON.stringify(tx, null, 2)}</pre>
    <div class="flex gap-2">
        <Button class="flex-1" on:click={approve}>Approve</Button>
        <Button color="red" class="flex-1" on:click={() => (open = false)}>Reject</Button>
    </div>
</Modal>