<!-- QrCodeView.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import {kpStore} from "~shared/utils/kpStore"
  import WgLogo from "~shared/components/icons/WgLogo.svelte"

  let canvas: HTMLCanvasElement;
  let qrCodeUrl = '';
  let showCopied = false;

  // Generate QR code when component mounts or public key changes
  onMount(() => {
    console.log(`kp qr out: ${$kpStore.publicKey.toString()}`)
    if ($kpStore && canvas) {
      console.log(`kp qr in: ${$kpStore.publicKey.toString()}`)
      try {
        QRCode.toDataURL(canvas, $kpStore.publicKey.toString(), {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 256,
          color: {
            dark: "#1f2937", // Tailwind gray-800
            light: "#ffffff" // White background
          }
        }).then(url => {
          qrCodeUrl = url;
        })
      } catch (err) {
        console.error("QR gen failed", err)
      }
    }
  });

  function copyToClipboard() {
    if ($kpStore) {
      navigator.clipboard.writeText($kpStore.publicKey.toString());
      showCopied = true;
      setTimeout(() => showCopied = false, 2000);
    }
  }

  $: {
    console.log('qr code url: ', qrCodeUrl)
  }
</script>

<div class="p-2 flex flex-col">
  <h2 class="text-lg font-semibold mb-2 dark:text-white">Receive Funds</h2>

  {#if $kpStore}
    <!-- hidden drawing surface -->
    <canvas bind:this={canvas} class="hidden" />

    <!-- qr code container -->
    <div class="relative mb-4 p-1 bg-white rounded-md max-w-[196px] max-h-[196px] self-center">
      <img
        src={qrCodeUrl}
        alt="Wallet Address QR Code"
        class="w-full h-auto mx-auto"
      />
      <!--  logo  -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div class="bg-white p-2 rounded-full">
          <WgLogo width={32} height={32} blackAndWhite/>
        </div>
      </div>
    </div>

    <!-- address & copy button -->
    <div class="space-y-2">
      <p class="text-sm text-gray-600 dark:text-gray-300 text-center mb-2">
        Scan QR code or copy address below
      </p>

      <div class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-md p-2">
        {#if showCopied}
          <span class="text-center text-sm text-green-600 dark:text-green-400">
            Address copied to clipboard!
          </span>
        {:else}
          <span class="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
          {$kpStore.publicKey.toString()}
        </span>
        {/if}


        <button
          on:click={copyToClipboard}
          class="ml-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
          title="Copy address"
        >
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <div class="text-center p-4 text-gray-600 dark:text-gray-400">
      Connect your wallet to display QR code
    </div>
  {/if}
</div>