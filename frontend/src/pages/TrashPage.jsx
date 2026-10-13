import React from 'react';
import { Trash2, ShieldCheck, Info } from 'lucide-react';
import AppLayout from '../components/AppLayout';

const TrashPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trash & Data Retention</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            CloudVault zero-retention security & compliance specifications
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mx-auto">
            <Trash2 className="w-8 h-8" />
          </div>

          <h3 className="font-bold text-slate-900 text-lg">Trash is Empty</h3>

          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            CloudVault implements an <strong>immediate permanent purge</strong> security policy. When you delete a file, its encrypted binary payload is immediately removed from Amazon S3, and all relational metadata and share mappings are permanently deleted from PostgreSQL.
          </p>

          <div className="pt-4 border-t border-slate-100">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Zero-Retention AWS S3 Security Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TrashPage;
