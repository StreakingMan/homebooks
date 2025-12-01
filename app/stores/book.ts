import { defineStore } from 'pinia';

interface Book {
  _id: string;
  title: string;
  author?: string;
  isbn?: string;
  img?: string;
  publisher?: string;
  pubdate?: string;
  summary?: string;
  position?: {
    row: number;
    col: number;
    order?: number;
  };
}

interface WallConfig {
  rows: number;
  cols: number;
  name: string;
}

export const useBookStore = defineStore('book', {
  state: () => ({
    books: [] as Book[],
    config: null as WallConfig | null,
    isLoading: false,
    searchQuery: '', // Global search query state
  }),

  getters: {
    // Get books filtered by search query
    filteredBooks(state) {
      if (!state.searchQuery) return state.books;
      const q = state.searchQuery.toLowerCase();
      return state.books.filter((b) => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.includes(q));
    },

    // Get grid cells with books
    cells(state) {
      if (!state.config) return [];
      const { rows, cols } = state.config;
      const grid = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellBooks = state.books
            .filter((b) => b.position && b.position.row === r && b.position.col === c)
            .sort((a, b) => (a.position?.order || 0) - (b.position?.order || 0));

          grid.push({
            id: `${r}-${c}`,
            row: r,
            col: c,
            books: cellBooks,
          });
        }
      }
      return grid;
    },
  },

  actions: {
    async fetchAll() {
      this.isLoading = true;
      try {
        const [configRes, booksRes] = await Promise.all([$fetch('/api/wall/config'), $fetch('/api/books')]);

        this.config = (configRes as any).config;
        this.books = (booksRes as any) || [];
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        this.isLoading = false;
      }
    },

    async addBook(book: Book) {
      this.books.push(book);
    },

    async removeBook(isbn: string) {
      this.books = this.books.filter((b) => b.isbn !== isbn);
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },
  },
});
