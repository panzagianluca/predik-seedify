const store = new Map<string, string>();

const AsyncStorage = {
  async getItem(key: string) {
    return store.has(key) ? store.get(key)! : null;
  },
  async setItem(key: string, value: string) {
    store.set(key, value);
  },
  async removeItem(key: string) {
    store.delete(key);
  },
  async clear() {
    store.clear();
  },
  async getAllKeys() {
    return Array.from(store.keys());
  }
};

export default AsyncStorage;
export { AsyncStorage };
