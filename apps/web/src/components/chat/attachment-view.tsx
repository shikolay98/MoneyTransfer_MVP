import { useEffect, useState } from 'react';

import { fetchAttachmentObjectUrl, type Attachment } from '../../lib/api';
import { FileIcon } from '../ui/icons';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

interface AttachmentViewProps {
  attachment: Attachment;
  // e.g. "/api/chats/<threadId>" or "/api/admin/chats/<threadId>"
  basePath: string;
  onDark?: boolean;
}

export const AttachmentView = ({ attachment, basePath, onDark }: AttachmentViewProps) => {
  const isImage = attachment.mime.startsWith('image/');
  const path = `${basePath}/attachments/${attachment.token}`;
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;

    fetchAttachmentObjectUrl(path)
      .then((u) => {
        if (!active) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (isImage && !failed) {
    return (
      <a
        className="mt-2 block overflow-hidden rounded-xl border border-black/5"
        href={url ?? undefined}
        rel="noreferrer"
        target="_blank"
      >
        {url ? (
          <img
            alt={attachment.name}
            className="max-h-56 w-auto max-w-full object-cover"
            src={url}
          />
        ) : (
          <div className="h-32 w-48 animate-pulse bg-black/5" />
        )}
      </a>
    );
  }

  // Non-image or failed image → file chip / download link.
  return (
    <a
      className={[
        'mt-2 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition',
        onDark
          ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          : 'border-line bg-white text-ink hover:border-brand/50',
      ].join(' ')}
      download={attachment.name}
      href={url ?? undefined}
      rel="noreferrer"
      target="_blank"
    >
      <FileIcon className="h-5 w-5 shrink-0 opacity-70" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{attachment.name}</span>
        <span className={onDark ? 'text-white/60' : 'text-muted'}>{formatSize(attachment.size)}</span>
      </span>
    </a>
  );
};
