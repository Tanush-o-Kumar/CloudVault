import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cloud,
  Lock,
  Share2,
  HardDrive,
  Database,
  ArrowRight,
  Server,
  Key,
  CheckCircle2,
  FileCheck2,
  Cpu
} from 'lucide-react';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-radial-gradient from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              AWS Cloud Architecture • Major Mini-Project
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Enterprise Cloud Storage & Secure File Sharing with <span className="text-blue-600">CloudVault</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A full-stack, production-grade cloud storage platform engineered with FastAPI, PostgreSQL, and Amazon S3. Store, manage, and share documents with zero public bucket exposure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition duration-150"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-7 py-3.5 rounded-xl border border-slate-200 transition duration-150"
              >
                <span>Live Demo Sign In</span>
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Amazon S3 SSE-AES256
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Argon2id Password Hashing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Credential Leakage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Engineered for High Reliability & Zero-Trust Security
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Purpose-built cloud storage architecture demonstrating modern cloud computing paradigms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Amazon S3 Object Storage</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Stores binary payload in private S3 buckets. Utilizes server-side encryption (SSE-S3) with S3 Block Public Access strictly enabled.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Granular Access & Sharing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Authenticated, user-to-user file sharing with read-only rules. Immediate revocation takes effect across all backend authorization checks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Argon2id & JWT Auth</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                State-of-the-art RFC 9106 Argon2id password hashing protects against GPU and ASIC cracking. Short-lived signed JWT access tokens ensure secure API access.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">PostgreSQL Metadata Engine</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Relational schema managed by SQLAlchemy ORM and Alembic migrations. Tracks file checksums, sizes, timestamps, and ownership permissions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">FastAPI on Amazon EC2</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                High-performance asynchronous Python REST backend deployed on Amazon EC2 with IAM roles, eliminating hardcoded access keys.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">IDOR & Anti-Tamper Protection</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Rigorous server-side ownership validation prevents Insecure Direct Object References (IDOR). Storage keys use randomized UUID prefixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Architecture Explanation Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6 text-slate-700">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-6">
              How CloudVault Handles Your Files
            </h2>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Decoupled Storage Architecture
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Unlike legacy architectures that store binary blobs inside relational databases, CloudVault strictly adheres to AWS cloud computing best practices:
              </p>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Amazon S3</strong> stores immutable binary file objects, protected by bucket policies and AES-256 server-side encryption.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>PostgreSQL (RDS)</strong> stores structured metadata, including cryptographic SHA-256 digests, MIME types, and relational sharing constraints.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>EC2 IAM Roles</strong> grant the backend temporary, rotating security credentials through AWS Security Token Service (STS).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span>CloudVault</span>
          </div>
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Cloud Computing Major Mini-Project • Developed with React, FastAPI, PostgreSQL & AWS S3.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
