import React, { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DocumentCategory, SiteDocument } from '../../types/construction';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { EmptyState } from '../ui/EmptyState';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const DOC_CATEGORIES: DocumentCategory[] = [
  'Construction Drawings',
  'Site Photographs',
  'Work Orders',
  'Contracts',
  'Safety Documents',
  'Inspection Certificates',
  'Project Reports',
];

export const DocumentsView: React.FC = () => {
  const {
    data,
    uploadDocumentFile,
    addDocument,
    deleteDocument,
    requestConfirm,
    showToast,
  } = useStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | DocumentCategory>('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SiteDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Construction Drawings');
  const [projectId, setProjectId] = useState(data.projects[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.documents.filter((doc) => {
      if (categoryFilter !== 'All' && doc.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.uploadedBy.toLowerCase().includes(q)
      );
    });
  }, [data.documents, categoryFilter, search]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    try {
      let url = '';
      let sizeLabel = '1.2 MB';
      let fileType = 'PDF';

      if (selectedFile) {
        const uploaded = await uploadDocumentFile(selectedFile);
        url = uploaded.url;
        sizeLabel = uploaded.sizeLabel;
        fileType = uploaded.fileType;
      }

      addDocument({
        title: title.trim(),
        category,
        projectId,
        uploadDate: new Date().toISOString().slice(0, 10),
        fileSize: sizeLabel,
        fileType,
        uploadedBy: data.settings.profile.name,
        fileUrl: url,
      });

      setUploadOpen(false);
      setTitle('');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (docItem: SiteDocument) => {
    if (docItem.fileUrl) {
      const a = document.createElement('a');
      a.href = docItem.fileUrl;
      a.download = `${docItem.title}.${docItem.fileType.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading "${docItem.title}"...`, 'info');
      return;
    }

    // Generate structured text specification file for sample records without binary URLs
    const project = data.projects.find((p) => p.id === docItem.projectId);
    const content = [
      `BuildGrid Document Record`,
      `Title: ${docItem.title}`,
      `Category: ${docItem.category}`,
      `Project: ${project?.name || docItem.projectId}`,
      `Uploaded By: ${docItem.uploadedBy}`,
      `Upload Date: ${docItem.uploadDate}`,
      `Format: ${docItem.fileType} (${docItem.fileSize})`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.title.replace(/[^a-zA-Z0-9]+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded metadata summary for "${docItem.title}".`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Document Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Central repository for blueprints, site photos, contracts, work orders, and safety certificates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <MotionSection delayIndex={0} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title, uploader, category..."
            aria-label="Search documents"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', ...DOC_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </MotionSection>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents match your filter"
          description="Upload construction drawings, site photographs, or compliance files."
          actionLabel="Upload Document"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <MotionStaggerGrid className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocs.map((docItem) => {
            const project = data.projects.find((p) => p.id === docItem.projectId);
            const isImage =
              docItem.fileType === 'JPG' ||
              docItem.fileType === 'PNG' ||
              docItem.fileUrl?.startsWith('data:image') ||
              docItem.fileUrl?.endsWith('.jpg');
            return (
              <MotionStaggerItem key={docItem.id} className="h-full">
                <article
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                <div>
                  {isImage && docItem.fileUrl ? (
                    <ImageWithFallback
                      src={docItem.fileUrl}
                      alt={docItem.title}
                      className="mb-3 h-36 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-24 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-blue-700">{docItem.category}</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-slate-900">
                    {docItem.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{project?.projectCode || 'Site'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{docItem.fileType} ({docItem.fileSize})</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatDate(docItem.uploadDate)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">By {docItem.uploadedBy}</span>
                  <div className="flex items-center gap-1.5">
                    {isImage && docItem.fileUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(docItem)}
                        aria-label={`Preview ${docItem.title}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(docItem)}
                      aria-label={`Download ${docItem.title}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm({
                          title: 'Delete Document?',
                          message: `Delete "${docItem.title}" from project files?`,
                          onConfirm: () => deleteDocument(docItem.id),
                        })
                      }
                      aria-label={`Delete ${docItem.title}`}
                      className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                </article>
              </MotionStaggerItem>
            );
          })}
        </MotionStaggerGrid>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Project Document"
        subtitle="Attach drawings, site photos, contracts, or inspection certificates."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="block text-xs font-medium text-slate-700">
              Document Title *
            </label>
            <input
              id="doc-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Basement Retaining Wall Structural Detail"
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-cat" className="block text-xs font-medium text-slate-700">
                Category *
              </label>
              <select
                id="doc-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="doc-proj" className="block text-xs font-medium text-slate-700">
                Project *
              </label>
              <select
                id="doc-proj"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} · {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="doc-file" className="block text-xs font-medium text-slate-700">
              Select File (PDF, PNG, JPG, DWG, XLSX)
            </label>
            <input
              id="doc-file"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Save Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || 'Document Preview'}
        subtitle={previewDoc ? `${previewDoc.category} · ${formatDate(previewDoc.uploadDate)}` : ''}
      >
        {previewDoc && (
          <ImageWithFallback
            src={previewDoc.fileUrl}
            alt={previewDoc.title}
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        )}
      </Modal>
    </div>
  );
};
