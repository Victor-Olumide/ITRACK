
import { useRef, useState } from 'react';
import { FileImage, FileText, Trash2, Upload } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload({
  files,
  onChange,
  disabled = false,
  maxFiles = 5,
  maxFileSize = MAX_FILE_SIZE,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setError('');

    const incoming = Array.from(selectedFiles);
    const nextFiles = [...files];

    for (const file of incoming) {
      if (
        !file.type.startsWith('image/') &&
        file.type !== 'application/pdf'
      ) {
        setError(`${file.name} is not an image or PDF.`);
        continue;
      }

      if (file.size > maxFileSize) {
        setError(`${file.name} exceeds the 10 MB file size limit.`);
        continue;
      }

      if (nextFiles.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      )) {
        continue;
      }

      if (nextFiles.length >= maxFiles) {
        setError(`You can attach a maximum of ${maxFiles} files.`);
        break;
      }

      nextFiles.push(file);
    }

    onChange(nextFiles);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
    setError('');
  };

  const formatFileSize = (size: number) => {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(0)} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-slate-600">
        Attach images or PDF documents
      </p>

      <button
        type="button"
        disabled={disabled || files.length >= maxFiles}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] bg-slate-50 p-4 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload size={17} />
        Select files
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
      />

      <p className="mt-2 text-xs text-slate-500">
        Images and PDF only. Maximum {maxFiles} files, 10 MB each.
      </p>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              {file.type === 'application/pdf' ? (
                <FileText size={19} className="shrink-0 text-red-500" />
              ) : (
                <FileImage size={19} className="shrink-0 text-blue-500" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
