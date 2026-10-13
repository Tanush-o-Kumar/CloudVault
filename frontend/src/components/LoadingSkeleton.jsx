import React from 'react';

export const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 w-20 bg-slate-200 rounded"></div>
      <div className="w-9 h-9 rounded-xl bg-slate-100"></div>
    </div>
    <div className="h-7 w-28 bg-slate-200 rounded mb-2"></div>
    <div className="h-3 w-36 bg-slate-100 rounded"></div>
  </div>
);

export const FileCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse flex flex-col justify-between h-44">
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded-lg bg-slate-100"></div>
          <div className="w-6 h-6 rounded-lg bg-slate-100"></div>
        </div>
      </div>
      <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
    </div>
    <div className="pt-3 border-t border-slate-100 flex justify-between">
      <div className="h-3 w-16 bg-slate-100 rounded"></div>
      <div className="h-3 w-10 bg-slate-100 rounded"></div>
    </div>
  </div>
);

export const FileRowSkeleton = () => (
  <div className="flex items-center justify-between p-3.5 bg-white border-b border-slate-100 animate-pulse">
    <div className="flex items-center gap-3.5 flex-1">
      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0"></div>
      <div className="space-y-1.5 flex-1 max-w-md">
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        <div className="h-3 w-32 bg-slate-100 rounded"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-lg bg-slate-100"></div>
      <div className="w-7 h-7 rounded-lg bg-slate-100"></div>
      <div className="w-7 h-7 rounded-lg bg-slate-100"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex justify-between">
      <div className="h-4 w-32 bg-slate-200 rounded"></div>
      <div className="h-4 w-20 bg-slate-100 rounded"></div>
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <FileRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default {
  StatCardSkeleton,
  FileCardSkeleton,
  FileRowSkeleton,
  TableSkeleton,
};
