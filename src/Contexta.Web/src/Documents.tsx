import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Close from '@mui/icons-material/Close';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Download from '@mui/icons-material/DownloadOutlined';
import FileIcon from '@mui/icons-material/DescriptionOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import type { SearchResult } from './hooks/use-search';

function extension(filename: string) {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : '';
}

function FileType({ name }: { name: string }) {
  const type = extension(name);
  return <span className="file-type" data-type={type}><FileIcon /><b>{type || 'File'}</b></span>;
}

export function DocumentList({ files, onOpen, showScore = false }: {
  files: SearchResult[]; onOpen: (file: SearchResult) => void; showScore?: boolean;
}) {
  return <ul className="document-list">{files.map(file => <li key={file.id}>
    <button className="document-row" onClick={() => onOpen(file)}>
      <FileType name={file.filename} />
      <span className="file-name"><strong>{file.filename}</strong>
        <small><FolderIcon />{file.folderPath || 'Folder unavailable'}</small>
      </span>
      {showScore && <span className="score">{Math.round(file.score * 100)}% match</span>}
      <ArrowForward className="row-arrow" />
    </button>
  </li>)}</ul>;
}

export function Modal({ title, onClose, children, wide = false }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={wide ? 'modal wide' : 'modal'} aria-labelledby="dialog-title"
    onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-inner">
      <header className="modal-bar"><h2 id="dialog-title">{title}</h2>
        <button autoFocus className="icon-button" aria-label="Close dialog" onClick={onClose}><Close /></button>
      </header>
      {children}
    </div>
  </dialog>;
}

function InlinePreview({ file, type }: { file: SearchResult; type: string }) {
  const [preview, setPreview] = useState<{ state: 'ready' | 'error'; text?: string; partial?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  const url = `/api/files/${encodeURIComponent(file.id)}`;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      // Check PDFs with a single-byte range before handing streaming to the browser.
      const res = await fetch(url, {
        headers: { Range: type === 'pdf' ? 'bytes=0-0' : 'bytes=0-65535' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Preview unavailable');
      if (type === 'pdf') {
        await res.body?.cancel();
        if (!controller.signal.aborted) setPreview({ state: 'ready' });
      } else {
        const text = await res.text();
        const total = Number(res.headers.get('Content-Range')?.split('/')[1]);
        if (!controller.signal.aborted) setPreview({ state: 'ready', text, partial: total > 65536 });
      }
    }
    load().catch(() => { if (!controller.signal.aborted) setPreview({ state: 'error' }); });
    return () => controller.abort();
  }, [url, type, attempt]);
  if (!preview) return <p className="preview-message" role="status">Loading preview…</p>;
  if (preview.state === 'error') return <div className="preview-message" role="status">
    <strong>Couldn’t load the original file</strong><p>It may have moved or the file service may be offline.</p>
    <button className="secondary" onClick={() => { setPreview(undefined); setAttempt(attempt + 1); }}>Retry preview</button>
  </div>;
  return type === 'pdf'
    ? <iframe className="pdf-preview" src={url} title={`Preview of ${file.filename}`} />
    : <div className="text-preview"><pre>{preview.text}</pre>{preview.partial && <p>Showing the first 64 KB. Download to read the full file.</p>}</div>;
}

export function FilePreview({ file, onClose }: { file: SearchResult; onClose: () => void }) {
  const type = extension(file.filename);
  const canPreview = ['pdf', 'txt', 'md'].includes(type);
  const date = file.createdAt ? new Date(file.createdAt) : null;
  return <Modal title="File preview" onClose={onClose} wide>
    <div className="preview-details">
      <div className="preview-heading"><FileType name={file.filename} /><h3>{file.filename}</h3></div>
      <dl>
        <div><dt>Folder</dt><dd>{file.folderPath || 'Unavailable'}</dd></div>
        {file.author && <div><dt>Author</dt><dd>{file.author}</dd></div>}
        {date && Number.isFinite(date.getTime()) && <div><dt>Created</dt><dd>{date.toLocaleDateString(undefined, { dateStyle: 'medium' })}</dd></div>}
      </dl>
      <a className="primary" download={file.filename} href={`/api/files/${encodeURIComponent(file.id)}?download=true`}><Download />Download original</a>
    </div>
    {canPreview ? <InlinePreview file={file} type={type} /> : <div className="preview-message">
      <FileIcon /><strong>Open this file in its application</strong>
      <p>Download the original to view this {type.toUpperCase() || 'document'} file.</p>
    </div>}
  </Modal>;
}
