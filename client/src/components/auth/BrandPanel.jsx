import React from 'react';
import { ShieldCheck, FileCheck, ArrowRightLeft, Sparkles, Building2 } from 'lucide-react';

const BrandPanel = () => {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] xl:w-[48%] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800 shadow-2xl">
      {/* Decorative Textile Pattern Background with Ambient Motion */}
      <div className="absolute inset-0 bg-textile-pattern opacity-20 pointer-events-none animate-ambient-drift" />
      
      {/* Ambient Radial Gradient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Logo Header */}
      <div className="relative z-10 animate-fade-left">
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-sm mb-8">
          <img
            src="/Maruti denim logo.png"
            alt="Maruti Denim Logo"
            className="h-10 w-auto object-contain filter drop-shadow brightness-110"
          />
          <div className="h-5 w-px bg-white/20" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Enterprise Operations</span>
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Maruti Denim
          <span className="block text-2xl xl:text-3xl font-semibold text-blue-300 mt-1">
            Gate Pass Management System
          </span>
        </h1>
        <p className="mt-4 text-sm xl:text-base text-slate-300/90 leading-relaxed max-w-lg font-normal">
          Securely manage gate passes, inward materials, approvals, and operational workflows from one centralized platform.
        </p>
      </div>

      {/* Center Feature Highlights */}
      <div className="relative z-10 my-8 space-y-4 max-w-lg">
        <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-0.5">Secure & Controlled Access</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Multi-tenant boundary security with role-based authorizations and verified email OTP authentication.
            </p>
          </div>
        </div>

        <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
            <FileCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-0.5">Digital Gate Pass Workflows</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Instant generation, digital approvals, returnable materials tracking, and PDF document dispatch.
            </p>
          </div>
        </div>

        <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <ArrowRightLeft size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-0.5">Material Inward & Audit Logging</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Real-time gate inward logs, supplier invoice verification, and executive MIS reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Badge */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Multi-Company Architecture</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">v2.4 Enterprise</span>
      </div>
    </div>
  );
};

export default BrandPanel;
