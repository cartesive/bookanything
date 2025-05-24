// Re-export admin functions from duckdb-wasm.ts
export { 
  fetchAllBookings, 
  updateBookingStatus, 
  getBookingStats 
} from './duckdb-wasm';