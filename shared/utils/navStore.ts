import { writable } from "svelte/store"

export type AuthTab = 'balance' | 'send' | 'history' | 'settings' | 'receive';

export const selectedAuthTab = writable<AuthTab>('balance');
