import React from 'react';
import { X, Clock, User, Shield, Tag, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const AuditDetailModal = ({ isOpen, onClose, auditLog }) => {
  if (!isOpen || !auditLog) return null;

  const getStatusBadge = (status) => {
    const isSuccess = status === 'SUCCESS' || status === 'COMPLETED';
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isSuccess ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
      }`}>
        {isSuccess ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
        {status || 'SUCCESS'}
      </span>
    );
  };

  const renderDiff = () => {
    if (!auditLog.oldValue && !auditLog.newValue) return null;

    const oldObj = auditLog.oldValue || {};
    const newObj = auditLog.newValue || {};

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    if (allKeys.length === 0) return null;

    return (
      <div className="mt-4 border border-[#EBEFF2] rounded-xl overflow-hidden bg-[#FAFCFE]">
        <div className="bg-[#F3F4F6] px-4 py-2.5 border-b border-[#EBEFF2] flex items-center justify-between">
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw size={13} className="text-[#6B7280]" /> Value Changes (Before / After)
          </span>
        </div>
        <div className="divide-y divide-[#EBEFF2] text-xs">
          {allKeys.map((key) => {
            const valOld = typeof oldObj[key] === 'object' ? JSON.stringify(oldObj[key]) : String(oldObj[key] ?? '-');
            const valNew = typeof newObj[key] === 'object' ? JSON.stringify(newObj[key]) : String(newObj[key] ?? '-');
            const isChanged = valOld !== valNew;

            return (
              <div key={key} className={`p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 ${isChanged ? 'bg-[#FFFBEB]/40' : ''}`}>
                <div className="font-semibold text-[#374151] truncate">{key}</div>
                <div className="text-[#DC2626] bg-[#FEF2F2] px-2 py-1 rounded font-mono text-[11px] break-all">
                  - {valOld}
                </div>
                <div className="text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded font-mono text-[11px] break-all">
                  + {valNew}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EBEFF2] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111827] text-white uppercase">
                {auditLog.action || 'ACTION'}
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">in {auditLog.module || 'GENERAL'}</span>
            </div>
            <h3 className="text-base font-bold text-[#111827] mt-1">
              Audit Event Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#EBEFF2] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status and Action Summary */}
          <div className="flex items-center justify-between p-3.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
            <div className="text-xs font-medium text-[#374151]">
              Result Status
            </div>
            {getStatusBadge(auditLog.status)}
          </div>

          {/* Description */}
          {auditLog.description && (
            <div>
              <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                Event Description
              </label>
              <div className="p-3 bg-[#F9FAFB] border border-[#EBEFF2] rounded-xl text-xs text-[#111827] font-medium leading-relaxed">
                {auditLog.description}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border border-[#EBEFF2] rounded-xl bg-white space-y-1">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase flex items-center gap-1">
                <User size={12} /> Actor / User
              </span>
              <div className="text-xs font-bold text-[#111827]">
                {auditLog.actorName || auditLog.actorUserId?.name || auditLog.actorUserId || 'System'}
              </div>
              <div className="text-[11px] text-[#6B7280] capitalize">
                Role: {auditLog.actorRole || 'N/A'}
              </div>
            </div>

            <div className="p-3 border border-[#EBEFF2] rounded-xl bg-white space-y-1">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase flex items-center gap-1">
                <Clock size={12} /> Timestamp
              </span>
              <div className="text-xs font-bold text-[#111827]">
                {auditLog.timestamp ? new Date(auditLog.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'medium'
                }) : 'N/A'}
              </div>
            </div>

            <div className="p-3 border border-[#EBEFF2] rounded-xl bg-white space-y-1">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase flex items-center gap-1">
                <Tag size={12} /> Entity Type & ID
              </span>
              <div className="text-xs font-bold text-[#111827]">
                {auditLog.entityType || 'N/A'}
              </div>
              <div className="text-[11px] text-[#6B7280] font-mono truncate">
                ID: {auditLog.entityId || auditLog._id}
              </div>
            </div>

            <div className="p-3 border border-[#EBEFF2] rounded-xl bg-white space-y-1">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase flex items-center gap-1">
                <Shield size={12} /> Security Verification
              </span>
              <div className="text-[11px] text-[#059669] font-semibold">
                ✓ Immutable Log
              </div>
              {auditLog.hash && (
                <div className="text-[10px] text-[#6B7280] font-mono truncate" title={auditLog.hash}>
                  Hash: {auditLog.hash.substring(0, 16)}...
                </div>
              )}
            </div>
          </div>

          {/* Value Changes Diff */}
          {renderDiff()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EBEFF2] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailModal;
