import React from 'react';
import { Download, Trash2, Share2, Clock, Star } from 'lucide-react';
import { getFileIcon, formatBytes, formatDate } from './FileCard';

const FileRow = ({ file, onDownload, onShare, onDelete, isStarred = false, onToggleStar, showOwner = false }) => {
  return (
    <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-b-0 transition group select-none">
      {/* File info */}
      <div className="flex items-center gap-3.5 overflow-hidden flex-1 min-w-0 pr-4">
        {onToggleStar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file);
            }}
            title={isStarred ? 'Unstar' : 'Star file'}
            className={`p-1 rounded-lg transition shrink-0 ${
              isStarred
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {getFileIcon(file.content_type)}
        </div>

        <div className="truncate min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-blue-600 transition"
            title={file.original_filename}
            onClick={() => onDownload && onDownload(file)}
          >
            {file.original_filename}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>{formatBytes(file.file_size)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(file.created_at)}
            </span>
            {file.share_count > 0 && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                  {file.share_count} shared
                </span>
              </>
            )}
            {showOwner && file.owner_name && (
              <>
                <span>•</span>
                <span className="text-slate-600">Owner: {file.owner_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onShare && (
          <button
            onClick={() => onShare(file)}
            title="Share file"
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDownload(file)}
          title="Download file"
          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
        >
          <Download className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(file)}
            title="Delete file"
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FileRow;
