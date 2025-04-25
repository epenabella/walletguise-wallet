<script lang="ts">
    import './style.css';
    import 'flowbite';
    export let count = 0
    let action: string = null
    function increment() {
        count += 1
        action = "increment"
    }
    function decrement() {
        count -= 1
        action = "decrement"
    }
</script>

<div>
    <h2 class="text-center">
        Welcome to your <a href="https://www.plasmo.com" target="_blank">Plasmo</a> Extension!
    </h2>
    <div class="container min-w-[470px] flex place-content-center gap-[47px]">
        <button on:click={decrement} type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/>
            </svg>
            <span class="sr-only">Icon description</span>
        </button>
        <p>Current count: <b>{count}</b></p>
<!--        <button >+</button>-->

        <button on:click={increment} type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
            </svg>
            <span class="sr-only">Icon description</span>
        </button>
    </div>
    {#if action}<p class="action text-center">{action}</p>{/if}
    <a href="https://docs.plasmo.com" target="_blank"> View Docs </a>
</div>

<style>
    /*.container {*/
    /*    min-width: 470px;*/
    /*    display: flex;*/
    /*    align-items: center;*/
    /*    justify-content: center;*/
    /*    gap: 47px;*/
    /*}*/
    .action {
        color: #470;
        font-weight: bold;
    }
    .text-center {
        text-align: center;
    }
</style>