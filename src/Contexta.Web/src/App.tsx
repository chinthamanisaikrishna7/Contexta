import { useEffect, useRef, useState } from 'react';
import Search from '@mui/icons-material/Search';
import History from '@mui/icons-material/HistoryOutlined';
import Shield from '@mui/icons-material/GppGoodOutlined';
import Help from '@mui/icons-material/HelpOutlineOutlined';
import Grid from '@mui/icons-material/GridViewOutlined';
import Chevron from '@mui/icons-material/ChevronRight';
import Arrow from '@mui/icons-material/ArrowForward';
import Outward from '@mui/icons-material/ArrowOutward';
import Layers from '@mui/icons-material/LayersOutlined';
import Plans from '@mui/icons-material/AccountTreeOutlined';
import Invoice from '@mui/icons-material/ReceiptLongOutlined';
import People from '@mui/icons-material/GroupsOutlined';
import Close from '@mui/icons-material/Close';
import Folder from '@mui/icons-material/FolderOpenOutlined';
import Warning from '@mui/icons-material/ErrorOutlineOutlined';
import { Terrain } from './Terrain';
import { DocumentList, FilePreview, Modal } from './Documents';
import { useSearch } from './hooks/use-search';
import type { SearchResult } from './hooks/use-search';
import './App.css';

const suggestions = [
  { title: 'Project risk mitigation', category: 'Project planning', icon: Plans, color: 'sage' },
  { title: 'Quarterly invoices', category: 'Finance', icon: Invoice, color: 'sand' },
  { title: 'Employee compensation', category: 'People & policy', icon: People, color: 'lilac' },
];

function Suggestions({ onPick }: { onPick: (term: string) => void }) {
  return <section className="section" aria-labelledby="suggested-title">
    <div className="section-head"><div><h2 id="suggested-title">Suggested searches</h2>
      <p>Pick a topic to explore your documents.</p></div></div>
    <div className="suggestions">{suggestions.map(({ title, category, icon: Icon, color }) =>
      <button key={title} className="suggestion" onClick={() => onPick(title)}>
        <span className={`tile-icon ${color}`}><Icon /></span><Outward className="suggestion-arrow" />
        <span className="category">{category}</span><strong>{title}</strong>
      </button>)}</div>
  </section>;
}

function Recent({ files, onOpen, full = false }: { files: SearchResult[]; onOpen: (file: SearchResult) => void; full?: boolean }) {
  const Heading = full ? 'h1' : 'h2';
  return <section className={full ? 'recent-page' : 'section'} aria-labelledby="recent-title">
    <div className="section-head"><div><Heading id="recent-title">{full ? 'Recent files' : 'Recently opened'}</Heading>
      <p>Documents you’ve opened during this session.</p></div>
      {!full && files.length > 0 && <a href="#recent" className="text-link">View all <Arrow /></a>}
    </div>
    {files.length ? <DocumentList files={full ? files : files.slice(0, 3)} onOpen={onOpen} /> :
      <div className="recent-empty"><span className="empty-icon"><History /></span><div><strong>No recently opened files</strong>
        <p>Open a search result and you’ll find it here.</p></div>{full && <a className="secondary" href="#search">Go to search</a>}</div>}
  </section>;
}

function folderKey(path: string | null) {
  return (path ?? '').replaceAll('\\', '/').split('/').filter(Boolean).join('/');
}

function Results({ search, onOpen }: { search: ReturnType<typeof useSearch>; onOpen: (file: SearchResult) => void }) {
  const [folder, setFolder] = useState('');
  const [name, setName] = useState('');
  const folders = new Set<string>();
  for (const file of search.results) {
    const parts = folderKey(file.folderPath).split('/').filter(Boolean);
    parts.forEach((_, i) => folders.add(parts.slice(0, i + 1).join('/')));
  }
  const visible = search.results.filter(file => {
    const path = folderKey(file.folderPath);
    return (!folder || path === folder || path.startsWith(folder + '/')) &&
      file.filename.toLowerCase().includes(name.trim().toLowerCase());
  });
  return <section className="section results" aria-labelledby="results-title" aria-busy={search.status === 'loading'}>
    <div className="section-head"><div><h2 id="results-title">Search results</h2>
      <p className="result-summary" role="status">{search.status === 'ready'
        ? `${visible.length} of ${search.results.length} matching files for “${search.query.trim()}”`
        : search.status === 'loading' ? 'Searching your document index…' : 'The search service is unavailable.'}</p></div></div>
    {search.status === 'loading' && <div className="skeletons" aria-hidden="true"><i /><i /><i /></div>}
    {search.status === 'error' && <div className="state-panel service-error"><Warning /><h3>Couldn’t complete this search</h3>
      <p>Check your connection and try the same query again.</p>
      <button className="secondary" onClick={() => search.search(search.query, true)}>Retry search</button></div>}
    {search.status === 'ready' && <>
      {search.results.length > 0 && <div className="filters">
        <label className="filter-field"><Search /><input aria-label="Filter by filename" placeholder="Filter by filename" value={name} onChange={e => setName(e.target.value)} /></label>
        {folders.size > 0 && <label className="filter-field"><Folder /><select aria-label="Filter by folder" value={folder} onChange={e => setFolder(e.target.value)}>
          <option value="">All folders</option>{Array.from(folders).sort().map(path => <option key={path} value={path}>{path}</option>)}</select></label>}
      </div>}
      {visible.length ? <DocumentList files={visible} onOpen={onOpen} showScore /> :
        <div className="state-panel"><Search /><h3>{search.results.length ? 'No files match these filters' : 'No matching documents'}</h3>
          <p>{search.results.length ? 'Clear the filters to see your search results.' : 'Try a broader topic, a filename, or words from the document.'}</p>
          {search.results.length > 0 && <button className="secondary" onClick={() => { setFolder(''); setName(''); }}>Clear filters</button>}
        </div>}
    </>}
  </section>;
}

function Guide({ onClose }: { onClose: () => void }) {
  return <Modal title="Search guide" onClose={onClose}><div className="guide-content">
    <h3>Describe the document</h3><p>Search for a topic, a phrase, or a filename. For example, “how employees are paid” can surface a compensation policy even when the title uses different words.</p>
    <h3>Narrow the matches</h3><p>Search returns up to ten files. Filter those results by filename or folder. The match score reflects the search ranking.</p>
    <h3>Open the original</h3><p>Select a result for its details. Preview supported files in the browser or download the original. Recent files keeps track of what you open until you reload or close this tab.</p>
    <div className="guide-note"><Shield /><p>Your workspace processes document text locally. The search index stores embeddings and file metadata.</p></div>
  </div></Modal>;
}

function currentPage() { return window.location.hash === '#recent' ? 'recent' : 'search'; }

export default function App() {
  const search = useSearch();
  const input = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(currentPage);
  const [guide, setGuide] = useState(false);
  const [preview, setPreview] = useState<SearchResult | null>(null);
  const [recent, setRecent] = useState<SearchResult[]>([]);
  useEffect(() => {
    function navigate() { setPage(currentPage()); window.scrollTo(0, 0); }
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${page === 'search' ? 'Document search' : 'Recent files'} · Contexta`;
    function shortcut(e: KeyboardEvent) {
      if (guide || preview || e.ctrlKey || e.altKey || e.metaKey || e.key !== '/' ||
        (e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.closest('input,select,textarea')))) return;
      e.preventDefault();
      if (page !== 'search') { window.location.hash = 'search'; setPage('search'); }
      requestAnimationFrame(() => input.current?.focus());
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [page, guide, preview]);
  function open(file: SearchResult) {
    setPreview(file);
    setRecent(previous => [file, ...previous.filter(item => item.id !== file.id)]);
  }
  const label = page === 'recent' ? 'Recent files' : 'Search';
  return <div className="app">
    <a className="skip" href="#main-content" onClick={event => {
      event.preventDefault();
      document.getElementById('main-content')?.focus();
    }}>Skip to content</a>
    <header className="topbar"><div className="header-inner">
      <a href="#search" className="brand" aria-label="Contexta search"><img src="/favicon.svg" alt="" />Contexta</a>
      <nav className="nav" aria-label="Workspace"><a href="#search" aria-current={page === 'search' ? 'page' : undefined}><Search />Search</a>
        <a href="#recent" aria-current={page === 'recent' ? 'page' : undefined}><History />Recent files</a></nav>
      <div className="header-tools"><span className="local"><Shield />Local workspace</span>
        <button className="icon-button" aria-label="Open search guide" title="Search guide" onClick={() => setGuide(true)}><Help /></button></div>
    </div></header>
    <main id="main-content" tabIndex={-1} className="container">
      <div className="breadcrumb"><Grid />Workspace <Chevron /><strong>{label}</strong></div>
      {page === 'recent' ? <Recent files={recent} onOpen={open} full /> : <>
        <section className="hero" aria-labelledby="hero-title">
          <div className="art"><Terrain /></div>
          <div className="hero-content">
            <div className="eyebrow"><Layers /> Semantic workspace</div>
            <h1 id="hero-title">Document search<span>.</span></h1>
            <p>Find files by what they mean, even when you don’t know the filename.</p>
            <form role="search" className="search-box" onSubmit={e => { e.preventDefault(); if (search.query.trim()) search.search(search.query, true); else input.current?.focus(); }}>
              <Search /><input ref={input} aria-label="Search documents" placeholder="Search by topic or keyword…" value={search.query} onChange={e => search.search(e.target.value)} />
              {search.query ? <button type="button" className="clear" aria-label="Clear search" onClick={() => { search.search(''); input.current?.focus(); }}><Close /></button> : <kbd>/</kbd>}
              <button className="search-submit" type="submit" aria-label="Search documents"><span>Search</span><Arrow /></button>
            </form>
          </div>
        </section>
        {search.status === 'idle' ? <><Suggestions onPick={term => search.search(term, true)} /><Recent files={recent} onOpen={open} /></> :
          <Results key={search.query.trim()} search={search} onOpen={open} />}
      </>}
    </main>
    <footer className="footer"><span><Layers />Contexta</span><button className="text-link" onClick={() => setGuide(true)}>Search guide <Outward /></button></footer>
    {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    {guide && <Guide onClose={() => setGuide(false)} />}
  </div>;
}
