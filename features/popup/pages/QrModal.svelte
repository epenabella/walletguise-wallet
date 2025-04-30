<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";
    import { walletStore } from "~shared/utils/wallet";
    import { onMount } from "svelte";
    import QRCode from "qrcode";
    export let open = false;
    let dataUrl: string | null = null;

    onMount(async () => {
        const unsub = walletStore.subscribe(async (kp) => {
            if (!kp) return;
            dataUrl = await QRCode.toDataURL(kp.publicKey.toBase58());
        });
        return () => unsub();
    });
</script>

<Modal bind:open>
    <div slot="header" class="text-xl font-semibold">Receive SOL</div>
    {#if dataUrl}
        <img alt="QR" src={dataUrl} class="mx-auto my-4 w-40 h-40" />
        <p class="text-center break-all text-sm">{$walletStore?.publicKey.toBase58()}</p>
    {/if}
    <Button on:click={() => (open = false)} class="w-full mt-4">Close</Button>
</Modal>
