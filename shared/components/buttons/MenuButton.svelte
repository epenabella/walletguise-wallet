<script lang="ts">
  export let title: string
  export let onClick: (e: MouseEvent) => void;
</script>
<button type="button" style="margin-top: 4px;" on:click={onClick}
        class="w-full max-h-[48px] h-[48px] inline-flex flex-col items-center justify-center font-medium px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group hover:rounded-md cursor-pointer">
  <slot />
  <span style="margin-top: 2px;"
    class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">{title}</span>
</button>