import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Code,
  File,
  Download,
  Trash2,
  Share2,
  Clock,
  Star,
  Film,
  Music
} from 'lucide-react';

export const getFileIcon = (contentType) => {
  const ct = (contentType || '').toLowerCase();
  if (ct.startsWith('image/')) {
    return <ImageIcon className="w-5 h-5 text-purple-600" />;
  }
  if (ct.includes('pdf')) {
    return <FileText className="w-5 h-5 text-red-600" />;
  }
  if (ct.includes('zip') || ct.includes('tar') || ct.includes('compressed')) {
    return <Archive className="w-5 h-5 text-amber-600" />;
  }
  if (ct.includes('text') || ct.includes('json') || ct.includes('csv') || ct.includes('javascript') || ct.includes('python')) {
    return <Code className="w-5 h-5 text-emerald-600" />;
  }
  if (ct.startsWith('video/')) {
    return <Film className="w-5 h-5 text-cyan-600" />;
  }
  if (ct.startsWith('audio/')) {
    return <Music className="w-5 h-5 text-pink-600" />;
  }
  return <File className="w-5 h-5 text-blue-600" />;
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const FileCard = ({ file, onDownload, onShare, onDelete, isStarred = false, onToggleStar }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 hover:shadow-md hover:border-blue-300 transition duration-150 flex flex-col justify-between group relative select-none">
      <div>
        {/* Card Header: Icon & Action Tools */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {getFileIcon(file.content_type)}
          </div>

          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
            {onToggleStar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(file);
                }}
                title={isStarred ? 'Unstar' : 'Star file'}
                className={`p-1.5 rounded-lg transition ${
                  isStarred
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(file);
                }}
                title="Share file"
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
              title="Download file"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            >
              <Download className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                }}
                title="Delete file"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* File Name & Metadata */}
        <h4
          className="font-semibold text-slate-900 text-sm truncate mb-1 hover:text-blue-600 cursor-pointer"
          title={file.original_filename}
          onClick={() => onDownload && onDownload(file)}
        >
          {file.original_filename}
        </h4>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{formatBytes(file.file_size)}</span>
          {file.share_count > 0 && (
            <>
              <span>•</span>
              <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                {file.share_count} shared
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(file.created_at)}
        </span>
        <span className="font-mono uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
          {file.original_filename.split('.').pop() || 'FILE'}
        </span>
      </div>
    </div>
  );
};

export default FileCard;
