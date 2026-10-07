import * as SecureStore from "expo-secure-store";

const chunkSize = 1800;
const manifest = (key: string) => `${key}__manifest`;
const chunk = (key: string, index: number) => `${key}__${index}`;

export const sessionStorage = {
  async getItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(manifest(key)));
    if (!Number.isInteger(count) || count < 1 || count > 32) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunk(key, index))));
    return parts.every((part): part is string => part !== null) ? parts.join("") : null;
  },
  async setItem(key: string, value: string) {
    const previous = Number(await SecureStore.getItemAsync(manifest(key))) || 0;
    const parts = value.match(new RegExp(`.{1,${chunkSize}}`, "gs")) ?? [""];
    await Promise.all(parts.map((part, index) => SecureStore.setItemAsync(chunk(key, index), part)));
    await SecureStore.setItemAsync(manifest(key), String(parts.length));
    await Promise.all(Array.from({ length: Math.max(0, previous - parts.length) }, (_, offset) => SecureStore.deleteItemAsync(chunk(key, parts.length + offset))));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(manifest(key))) || 0;
    await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunk(key, index))));
    await SecureStore.deleteItemAsync(manifest(key));
  },
};
