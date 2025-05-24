'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeDuckDB } from '@/lib/duckdb-wasm';

interface DuckDBContextType {
  isReady: boolean;
  error: Error | null;
}

const DuckDBContext = createContext<DuckDBContextType>({
  isReady: false,
  error: null,
});

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDuckDB();
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize database'));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DuckDBContext.Provider value={{ isReady, error }}>
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDuckDB() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error('useDuckDB must be used within a DuckDBProvider');
  }
  return context;
}