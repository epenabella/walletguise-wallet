<script lang="ts">
    import {toasts, type ToastType} from '~/shared/utils/toasts';

    export let id: string;
    export let message: string;
    export let type: ToastType;

    const toastStyles = {
        success: {
            icon: `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>`,
            bgColor: '', //bg-green-100 dark:bg-green-600
            textColor: 'text-green-500 dark:text-green-200',
            srText: 'Success'
        },
        error: {
            icon: `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 14.793L10 11.586l-3.707 3.707a1 1 0 0 1-1.414-1.414L8.586 10 4.879 6.293a1 1 0 0 1 1.414-1.414L10 8.586l3.707-3.707a1 1 0 0 1 1.414 1.414L11.414 10l3.707 3.707a1 1 0 0 1-1.414 1.414Z"/>`,
            bgColor: '', //bg-red-100 dark:bg-red-800
            textColor: 'text-red-500 dark:text-red-200',
            srText: 'Error'
        },
        warning: {
            icon: `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>`,
            bgColor: '', //bg-yellow-100 dark:bg-yellow-800
            textColor: 'text-yellow-500 dark:text-yellow-200',
            srText: 'Warning'
        },
        info: {
            icon: `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>`,
            bgColor: '', //bg-blue-100 dark:bg-blue-800
            textColor: 'text-blue-500 dark:text-blue-200',
            srText: 'Info'
        }
    };

    const style = toastStyles[type];

    function remove(): void {
        toasts.remove(id);
    }
</script>

<div class="bg-white dark:bg-oilslick flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 rounded-sm border border-[1px] border-[gray] shadow dark:text-gray-400"
        role="alert"
>
    <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg {style.bgColor} {style.textColor}"
>
        <svg
                class="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
        >
            {@html style.icon}
        </svg>
        <span class="sr-only">{style.srText}</span>
    </div>
    <div class="ms-3 text-sm font-normal">{message}</div>

    <!-- bg-white dark:bg-gray-800  -->
    <button
            type="button"
            class="ms-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-1 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-700"
            on:click={remove}
            aria-label="Close"
    >
        <span class="sr-only">Close</span>
        <svg
                class="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
        >
            <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
        </svg>
    </button>
</div>