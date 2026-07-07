import { useEffect, useRef, useState } from 'react';

import { uploadFile, type Attachment } from '../../lib/api';
import { CloseIcon, FileIcon, PaperclipIcon } from '../ui/icons';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf';
const MAX_FILES = 5;
const MAX_TEXTAREA_HEIGHT = 140;

// On touch devices Enter should insert a newline (send is a tap); on desktop
// Enter sends and Shift+Enter inserts a newline — same as Telegram.
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

interface ChatComposerProps {
  onSend: (body: string, attachments: Attachment[]) => Promise<void>;
  onError: (message: string) => void;
  placeholder?: string;
}

export const ChatComposer = ({ onSend, onError, placeholder }: ChatComposerProps) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a max height, then scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (input.trim().length > 0 || files.length > 0) && !isBusy;

  const handleSend = async () => {
    if (!canSend) return;
    setIsBusy(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of files) {
        uploaded.push(await uploadFile(file));
      }
      await onSend(input.trim(), uploaded);
      setInput('');
      setFiles([]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="border-t border-line/70 p-3 bg-[#f5f8fd]">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-2.5 pr-1 text-xs text-ink"
            >
              <FileIcon className="h-3.5 w-3.5 text-muted" />
              <span className="max-w-[140px] truncate">{file.name}</span>
              <button
                aria-label={`Убрать ${file.name}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
                onClick={() => removeFile(index)}
                type="button"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          accept={ACCEPT}
          className="hidden"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <button
          aria-label="Прикрепить файл"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-line bg-white text-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
          disabled={isBusy || files.length >= MAX_FILES}
          onClick={() => fileInputRef.current?.click()}
          title="Прикрепить чек или изображение"
          type="button"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>

        <textarea
          aria-label="Сообщение"
          className="max-h-[140px] min-h-[2.75rem] min-w-0 flex-1 resize-none rounded-[18px] border border-line bg-white px-4 py-2.5 text-sm leading-relaxed text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          disabled={isBusy}
          maxLength={4000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Desktop: Enter sends, Shift+Enter = newline. Touch: Enter = newline.
            if (e.key === 'Enter' && !e.shiftKey && !isTouchDevice()) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={placeholder ?? 'Введите сообщение...'}
          ref={textareaRef}
          rows={1}
          value={input}
        />
        <button
          aria-label="Отправить сообщение"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          disabled={!canSend}
          onClick={() => void handleSend()}
          type="button"
        >
          {isBusy ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
};
