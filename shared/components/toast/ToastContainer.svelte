<script lang="ts">
    import { toasts } from '~shared/utils/toasts';
    import Toast from './Toast.svelte';
</script>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-100 flex flex-col-reverse gap-2 bg-gray-500 ">
    {#each $toasts as toast (toast.id)}
        <Toast {...toast} />
    {/each}
</div>