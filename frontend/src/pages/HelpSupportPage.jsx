import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Cloud,
  Share2,
  Lock,
  Server,
  FileCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

const faqs = [
  {
    q: 'How does CloudVault securely store files in Amazon S3?',
    a: 'CloudVault decouples file binary payload storage from metadata. File contents are uploaded directly to a private Amazon S3 bucket protected with AWS Server-Side Encryption (SSE-S3 AES-256) and S3 Block Public Access. File metadata, sizes, and ownership records are stored in PostgreSQL.'
  },
  {
    q: 'How does file sharing and access revocation work?',
    a: 'When you share a file with another registered user, a record is created linking your file ID to the recipient user ID. When you click "Revoke Access", the record is marked revoked immediately in the PostgreSQL database, and all subsequent download and viewing requests return HTTP 403 Forbidden.'
  },
  {
    q: 'What is Argon2id and why is it used?',
    a: 'Argon2id is the winner of the Password Hashing Competition and recommended by RFC 9106. Unlike legacy MD5, SHA-1, or standard bcrypt, Argon2id requires high memory (64MB) and multiple computational passes, rendering GPU and ASIC brute-force attacks practically impossible.'
  },
  {
    q: 'What are the file upload limits?',
    a: 'By default, individual file uploads are capped at 10 MB per file. This ceiling is configurable via the MAX_UPLOAD_SIZE_BYTES environment variable.'
  },
  {
    q: 'Are AWS credentials exposed in the web browser?',
    a: 'Never. All AWS S3 operations are handled by the FastAPI backend using temporary IAM instance profile credentials (STS). The frontend only interacts with the backend REST endpoints.'
  }
];

const HelpSupportPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Help & Cloud Security Documentation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Architecture overview, cloud computing FAQ, and security protocols for CloudVault
          </p>
        </div>

        {/* Cloud Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Cloud className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Amazon S3 Decoupling</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Files are isolated with randomized UUIDs in private S3 buckets. S3 Block Public Access is strictly enforced.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Argon2id & JWT</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Passwords hashed using RFC 9106 memory-hard algorithms; API calls verified via short-lived JWTs.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Instant Revocation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              File shares take effect immediately and revocation denies subsequent backend access in real time.
            </p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base mb-4">Frequently Asked Questions</h3>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3.5">
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
                >
                  <span>{faq.q}</span>
                  {openIdx === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {openIdx === idx && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HelpSupportPage;
