const BOOK_SPRITE_COUNT = 10;

// Escolhe um sprite de livro de forma estável por documento (mesmo id sempre cai no mesmo sprite).
export function bookSpriteFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const index = (hash % BOOK_SPRITE_COUNT) + 1;
  return `/books/book-${index}.png`;
}
