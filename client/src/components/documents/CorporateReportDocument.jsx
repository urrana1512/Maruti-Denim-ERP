import React from 'react';
import { safeFormatDate } from '../../utils/dateUtils';
import { formatINR } from '../../utils/gstCalculator';

const CorporateReportDocument = ({
  reportType = 'gate-pass',
  reportTitle = 'Executive MIS Report',
  filters = {},
  records = [],
  kpis = {}
}) => {
  const istNow = safeFormatDate(new Date(), 'dd/MM/yyyy, hh:mm a');
  const fromStr = filters.fromDate ? safeFormatDate(filters.fromDate, 'dd/MM/yyyy') : 'Beginning';
  const toStr = filters.toDate ? safeFormatDate(filters.toDate, 'dd/MM/yyyy') : 'Present';

  // Format filter summary string
  const filterSummary = [];
  if (filters.party && filters.party !== 'All') filterSummary.push(`Party: ${filters.party}`);
  if (filters.gatePassStatus && filters.gatePassStatus !== 'All') filterSummary.push(`GP Status: ${filters.gatePassStatus}`);
  if (filters.returnStatus && filters.returnStatus !== 'All') filterSummary.push(`Return Status: ${filters.returnStatus}`);
  if (filters.materialType && filters.materialType !== 'All') filterSummary.push(`Material Type: ${filters.materialType}`);
  if (filters.gatePassNumber) filterSummary.push(`GP No: ${filters.gatePassNumber}`);
  if (filters.materialInwardNumber) filterSummary.push(`Inward No: ${filters.materialInwardNumber}`);
  if (filters.item) filterSummary.push(`Item: ${filters.item}`);

  const filterSummaryText = filterSummary.length > 0 ? filterSummary.join(' | ') : 'All Records Included (No Specific Filters)';

  const renderStatusTag = (status) => {
    if (!status) return '-';
    let bg = '#F1F5F9';
    let color = '#334155';
    let label = status;
    if (status === 'OPEN' || status === 'PENDING' || status === 'Pending') { bg = '#FEF3C7'; color = '#92400E'; label = status === 'Pending' ? 'PENDING' : status; }
    if (status === 'CLOSED' || status === 'FULLY_RETURNED' || status === 'Approved') { bg = '#D1FAE5'; color = '#065F46'; label = status === 'FULLY_RETURNED' ? 'FULL RETURN' : status === 'Approved' ? 'APPROVED' : 'CLOSED'; }
    if (status === 'PARTIALLY_RETURNED') { bg = '#DBEAFE'; color = '#1E40AF'; label = 'PARTIAL RET'; }
    if (status === 'CANCELLED' || status === 'Cancelled') { bg = '#FEE2E2'; color = '#991B1B'; label = 'CANCELLED'; }

    return (
      <span style={{
        display: 'inline-block',
        padding: reportType === 'combined' ? '1px 4px' : '2px 6px',
        borderRadius: '10px',
        fontSize: reportType === 'combined' ? '7.5px' : '9.5px',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color,
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    );
  };

  return (
    <div 
      data-ready="true"
      className="corporate-report-document bg-white text-slate-800 font-sans p-0 print:p-0 mx-auto flex flex-col justify-between"
      style={{
        width: '210mm',
        minHeight: '280mm',
        padding: '8mm 10mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      <div>
        {/* Corporate Header / Letterhead */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
          <div className="flex items-center space-x-3">
            <img 
              src="/Maruti denim logo.png" 
              alt="Maruti Denim Logo" 
              style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0F2A47', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Maruti Nandan Denim Pvt Ltd
              </h1>
              <p style={{ fontSize: '10.5px', color: '#475569', margin: '1px 0 0 0' }}>
                Corporate ERP System — Management Information System (MIS) Report
              </p>
            </div>
          </div>
          <div className="text-right" style={{ fontSize: '10.5px', color: '#475569' }}>
            <p className="font-bold text-slate-800">CONFIDENTIAL REPORT</p>
            <p>Generated: {istNow}</p>
          </div>
        </div>

        {/* Report Title Banner */}
        <div style={{ backgroundColor: '#0F2A47', color: '#ffffff', padding: '6px 10px', borderRadius: '4px', textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            {reportTitle}
          </h2>
        </div>

        {/* Metadata & Applied Filters Box */}
        <div style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '5px', marginBottom: '8px', fontSize: '10.5px' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>
              <span className="font-semibold text-slate-500">Report Period:</span>{' '}
              <strong className="text-slate-800">{fromStr} to {toStr}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Total Records:</span>{' '}
              <strong className="text-slate-800">{records.length}</strong>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-500">Applied Filters:</span>{' '}
              <span className="text-slate-700 italic">{filterSummaryText}</span>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Block */}
        {kpis && Object.keys(kpis).length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3" style={{ fontSize: '10.5px' }}>
            {Object.entries(kpis).map(([kKey, kVal]) => {
              const label = kKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={kKey} style={{ border: '1px solid #e2e8f0', borderRadius: '5px', padding: '5px 8px', backgroundColor: '#ffffff' }}>
                  <p style={{ color: '#64748b', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F2A47', marginTop: '1px' }}>
                    {typeof kVal === 'number' && (kKey.toLowerCase().includes('total') || kKey.toLowerCase().includes('grand') || kKey.toLowerCase().includes('taxable')) && kKey.toLowerCase().includes('gst')
                      ? formatINR(kVal)
                      : String(kVal)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Formal Data Table */}
        <table className="w-full border-collapse mb-6" style={{ border: '1px solid #0F2A47', tableLayout: reportType === 'combined' ? 'fixed' : 'auto', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
              <th style={{ padding: reportType === 'combined' ? '4px 2px' : '6px 8px', border: '1px solid #0F2A47', fontSize: reportType === 'combined' ? '8.5px' : '11px', fontWeight: 'bold', textAlign: 'center', width: reportType === 'combined' ? '3%' : '35px' }}>Sr.</th>

              {reportType === 'gate-pass' && (
                <>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Total Qty</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Created By</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Approval</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP Status</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Return Status</th>
                </>
              )}

              {reportType === 'material-inward' && (
                <>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Inward No.</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Inward Date</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>GST Amt (₹)</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Grand Total (₹)</th>
                </>
              )}

              {(reportType === 'returnable-material' || reportType === 'pending-returns') && (
                <>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>GP Qty</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Pending Qty</th>
                  {reportType === 'pending-returns' && <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Days</th>}
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Status</th>
                </>
              )}

              {reportType === 'gate-pass-closure' && (
                <>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Ret. Qty</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Final Inward</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Days</th>
                </>
              )}

              {reportType === 'party-summary' && (
                <>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company Name</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Passes</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Open</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Closed</th>
                  <th style={{ padding: '5px 6px', border: '1px solid #0F2A47', fontSize: '10px', fontWeight: 'bold', textAlign: 'right' }}>Pend. Qty</th>
                </>
              )}

              {reportType === 'combined' && (
                <>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>GP No.</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>GP Date</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 600, textAlign: 'left', width: '13.5%' }}>Party / Company</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 600, textAlign: 'left', width: '13.5%' }}>Item</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>Inward No.</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'right', width: '5%' }}>Rec. Qty</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'right', width: '6.5%' }}>Rate (₹)</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'right', width: '7.5%' }}>Taxable (₹)</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '4.5%' }}>GST%</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'right', width: '7.5%' }}>GST Amt (₹)</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'right', width: '8.5%' }}>Grand Total (₹)</th>
                  <th style={{ padding: '4px 2px', border: '1px solid #0F2A47', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                  No records found matching the applied filter criteria.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', color: '#475569' }}>{idx + 1}</td>

                  {reportType === 'gate-pass' && (
                    <>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right' }}>{r.totalQuantity}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'left', fontWeight: 500 }}>{r.createdBy || 'System Staff'}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{renderStatusTag(r.approvalStatus || (r.gatePassStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'))}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{renderStatusTag(r.gatePassStatus)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}

                  {reportType === 'material-inward' && (
                    <>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.inwardNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{safeFormatDate(r.inwardDate, 'dd/MM/yyyy')}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 600 }}>{r.partyName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', fontWeight: 'bold' }}>{r.receivedQuantity}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#92400E' }}>{formatINR(r.totalGst || r.gstAmount)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>{formatINR(r.grandTotal)}</td>
                    </>
                  )}

                  {(reportType === 'returnable-material' || reportType === 'pending-returns') && (
                    <>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px' }}>{r.itemName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#1E40AF', fontWeight: 'bold' }}>{r.returnableQuantity || r.originalQuantity}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#991B1B', fontWeight: 'bold' }}>{r.pendingQuantity}</td>
                      {reportType === 'pending-returns' && <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: '#991B1B' }}>{r.daysPending}d</td>}
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}

                  {reportType === 'gate-pass-closure' && (
                    <>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#065F46', fontWeight: 'bold' }}>{r.totalReturnedQuantity}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', fontWeight: 600 }}>{r.finalInwardNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: '#065F46' }}>{r.totalDaysToClose}d</td>
                    </>
                  )}

                  {reportType === 'party-summary' && (
                    <>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 'bold', color: '#0F2A47' }}>{r.partyName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right' }}>{r.totalGatePasses}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#92400E' }}>{r.openGatePasses}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', color: '#065F46' }}>{r.closedGatePasses}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'right', fontWeight: 'bold', color: '#991B1B' }}>{r.totalPendingQuantity}</td>
                    </>
                  )}

                  {reportType === 'combined' && (
                    <>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center', wordBreak: 'break-all' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', fontWeight: 600, wordBreak: 'break-word' }}>{r.partyName}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', wordBreak: 'break-word' }}>{r.itemDescription}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'center', wordBreak: 'break-all' }}>{r.inwardNumber}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'right', color: '#065F46' }}>{r.receivedQuantity}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'right' }}>{formatINR(r.rate)}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'right' }}>{formatINR(r.taxableAmount)}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'center' }}>{r.gstPercentage || 0}%</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'right', color: '#92400E' }}>{formatINR(r.gstAmount || r.totalGst)}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>{formatINR(r.grandTotal)}</td>
                      <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', fontSize: '8.5px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Corporate Footer & Signatures Block */}
      <div className="pt-6 mt-auto flex-shrink-0 border-t border-slate-300" style={{ pageBreakInside: 'avoid', marginTop: 'auto' }}>
        <div className="grid grid-cols-3 gap-6 text-center mb-3">
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0F2A47' }}>Prepared By</p>
            <p style={{ fontSize: '10.5px', color: '#64748b' }}>MIS Accounts Staff</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0F2A47' }}>Checked By</p>
            <p style={{ fontSize: '10.5px', color: '#64748b' }}>Store / Logistics Manager</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0F2A47' }}>Authorised Signatory</p>
            <p style={{ fontSize: '10.5px', color: '#64748b' }}>For Maruti Nandan Denim Pvt Ltd</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-2 pb-1">
          <span>This is an official computer-generated management report.</span>
          <span className="font-semibold text-slate-500">Maruti Nandan Denim Pvt Ltd</span>
        </div>
      </div>
    </div>
  );
};

export default CorporateReportDocument;
