import { useEffect, useState } from 'react';

export interface SearchResult {
  id: string;
  filename: string;
  folderPath: string | null;
  author: string | null;
  createdAt: string | null;
  nasPath: string;
  score: number;
}

type ResponseState = {
  request: SearchRequest;
  results: SearchResult[];
  status: 'ready' | 'error';
};
type SearchRequest = { query: string; delay: number };

export function useSearch() {
  const [request, setRequest] = useState<SearchRequest>({ query: '', delay: 0 });
  const [response, setResponse] = useState<ResponseState | null>(null);
  const term = request.query.trim();

  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: term, top: '10' });
        const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Search failed');
        const results: SearchResult[] = await res.json();
        if (!controller.signal.aborted) setResponse({ request, results, status: 'ready' });
      } catch {
        if (!controller.signal.aborted) setResponse({ request, results: [], status: 'error' });
      }
    }, request.delay);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [request, term]);

  const current = response?.request === request ? response : null;
  return {
    query: request.query,
    search: (query: string, immediate = false) => setRequest({ query, delay: immediate ? 0 : 400 }),
    status: !term ? 'idle' as const : current?.status ?? 'loading' as const,
    results: current?.results ?? [],
  };
}
