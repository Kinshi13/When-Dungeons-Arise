const PREFIX = "lembretes-app:";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(PREFIX + key, JSON.stringify(items));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function table<T extends { id: string }>(key: string) {
  return {
    list(): T[] {
      return read<T>(key);
    },
    save(items: T[]) {
      write(key, items);
    },
    insert(item: T): T {
      const items = read<T>(key);
      items.push(item);
      write(key, items);
      return item;
    },
    update(id: string, patch: Partial<T>): T | undefined {
      const items = read<T>(key);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...patch };
      write(key, items);
      return items[idx];
    },
    remove(id: string) {
      write(
        key,
        read<T>(key).filter((i) => i.id !== id)
      );
    },
    get(id: string): T | undefined {
      return read<T>(key).find((i) => i.id === id);
    },
  };
}
