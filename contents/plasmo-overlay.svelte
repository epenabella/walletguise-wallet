<script context="module" lang="ts">
    import cssText from "data-text:~/contents/plasmo-overlay.css"
    import type { PlasmoCSConfig } from "plasmo"

    export const config: PlasmoCSConfig = {
        matches: ["https://www.plasmo.com/*"]
    }

    export const getStyle = () => {
        const style = document.createElement("style")
        style.textContent = cssText
        return style
    }



    // onMount(() => {
    //   // debugger;
    //   // console.log(`debugger???`)
    // })
</script>

<span class="hw-top">Every living thing wants to survivessss</span>

<style>
    .hw-top {
        background: red;
        color: white;
        font-family: "Fascinate";
        width: 200px;
        border: 8px solid aqua;
    }
</style>