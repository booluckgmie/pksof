// Not a full file — src/components/pk/UploadsPanel.tsx stays as it is almost entirely (it's
// also shared by Data Entry's own Uploads tab, so it's worth keeping as one small, precise
// diff rather than a full-file replacement). Only its download link changes, because
// uploadFileUrl() is now async (downloads require auth — see src/lib/api/uploads.ts's adapter
// and its own comment on why). Two edits:
//
// 1. Add a small per-row "downloading" state near the file's other per-row state
//    (confirmingId/deletingId, around where those are declared):
//
//      const [downloadingId, setDownloadingId] = useState<string | null>(null);
//
//      const handleDownload = async (u: UploadEvent) => {
//        if (!u.filePath) return;
//        setDownloadingId(u.id);
//        try {
//          const blobUrl = await uploadFileUrl(u.filePath);
//          const a = document.createElement("a");
//          a.href = blobUrl;
//          a.download = u.fileName;
//          document.body.appendChild(a);
//          a.click();
//          a.remove();
//          URL.revokeObjectURL(blobUrl);
//        } catch (err) {
//          toast.error("Couldn't download the file", { description: err instanceof Error ? err.message : String(err) });
//        } finally {
//          setDownloadingId(null);
//        }
//      };
//
// 2. Replace the download `<a>` (currently around line 298-308 — the cell right after the
//    Row(s) column, before the delete button) from:
//
//      {u.filePath && (
//        <a
//          href={uploadFileUrl(u.filePath)}
//          download={u.fileName}
//          title="Download the uploaded Excel file"
//          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
//        >
//          <Download className="h-3.5 w-3.5" />
//        </a>
//      )}
//
// to:
//
//      {u.filePath && (
//        <button
//          onClick={() => handleDownload(u)}
//          disabled={downloadingId === u.id}
//          title="Download the uploaded Excel file"
//          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors disabled:opacity-50"
//        >
//          {downloadingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
//        </button>
//      )}
//
// (Loader2 is already imported in this file.) Nothing else in UploadsPanel.tsx changes.
export {};
