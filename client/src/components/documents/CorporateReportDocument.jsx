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
    if (status === 'OPEN' || status === 'PENDING') { bg = '#FEF3C7'; color = '#92400E'; }
    if (status === 'CLOSED' || status === 'FULLY_RETURNED') { bg = '#D1FAE5'; color = '#065F46'; }
    if (status === 'PARTIALLY_RETURNED') { bg = '#DBEAFE'; color = '#1E40AF'; }
    if (status === 'CANCELLED') { bg = '#FEE2E2'; color = '#991B1B'; }

    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color
      }}>
        {status}
      </span>
    );
  };

  return (
    <div 
      data-ready="true"
      className="bg-white text-slate-800 font-sans p-6 print:p-0 mx-auto"
      style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* Corporate Header / Letterhead */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/Maruti denim logo.png" 
              alt="Maruti Denim Logo" 
              style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F2A47', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Maruti Nandan Denim Pvt Ltd
              </h1>
              <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0 0 0' }}>
                Corporate ERP System — Management Information System (MIS) Report
              </p>
            </div>
          </div>
          <div className="text-right" style={{ fontSize: '11px', color: '#475569' }}>
            <p className="font-bold text-slate-800">CONFIDENTIAL REPORT</p>
            <p>Generated: {istNow}</p>
          </div>
        </div>

        {/* Report Title Banner */}
        <div style={{ backgroundColor: '#0F2A47', color: '#ffffff', padding: '8px 12px', borderRadius: '4px', textAlign: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            {reportTitle}
          </h2>
        </div>

        {/* Metadata & Applied Filters Box */}
        <div style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '11.5px' }}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
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
          <div className="grid grid-cols-4 gap-3 mb-4" style={{ fontSize: '11px' }}>
            {Object.entries(kpis).map(([kKey, kVal]) => {
              const label = kKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={kKey} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#ffffff' }}>
                  <p style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2A47', marginTop: '2px' }}>
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
        <table className="w-full border-collapse mb-6" style={{ border: '1px solid #0F2A47', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '35px' }}>Sr.</th>

              {reportType === 'gate-pass' && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Purpose</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Total Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Ret. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP Status</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Return Status</th>
                </>
              )}

              {reportType === 'material-inward' && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Inward No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Inward Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Taxable (₹)</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>GST (₹)</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Grand Total (₹)</th>
                </>
              )}

              {(reportType === 'returnable-material' || reportType === 'pending-returns') && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Ret. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Pend. Qty</th>
                  {reportType === 'pending-returns' && <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Days Pending</th>}
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Return Status</th>
                </>
              )}

              {reportType === 'gate-pass-closure' && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Total Returned Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Final Inward No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Closure Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Days to Close</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Status</th>
                </>
              )}

              {reportType === 'party-summary' && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company Name</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Total Passes</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Open</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Closed</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Ret. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Pend. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Grand Value (₹)</th>
                </>
              )}

              {reportType === 'combined' && (
                <>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>GP Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Party / Company</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Ret. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Inward No.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Inward Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Rec. Qty</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Bal. Qty</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '11.5px', fontStyle: 'italic' }}>
                  No records found matching the applied filter criteria.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', color: '#475569' }}>{idx + 1}</td>

                  {reportType === 'gate-pass' && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px' }}>{r.purpose}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right' }}>{r.totalQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#1E40AF' }}>{r.returnableQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#065F46' }}>{r.returnedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{renderStatusTag(r.gatePassStatus)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}

                  {reportType === 'material-inward' && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.inwardNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.inwardDate, 'dd/MM/yyyy, hh:mm a')}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }}>{r.partyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold' }}>{r.receivedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right' }}>{formatINR(r.subtotal)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#92400E' }}>{formatINR(r.totalGst)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>{formatINR(r.grandTotal)}</td>
                    </>
                  )}

                  {(reportType === 'returnable-material' || reportType === 'pending-returns') && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px' }}>{r.itemName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#1E40AF' }}>{r.returnableQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#065F46' }}>{r.returnedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#991B1B' }}>{r.pendingQuantity}</td>
                      {reportType === 'pending-returns' && <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', color: '#991B1B' }}>{r.daysPending} Days</td>}
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}

                  {reportType === 'gate-pass-closure' && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }}>{r.companyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#065F46', fontWeight: 'bold' }}>{r.totalReturnedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>{r.finalInwardNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.closureDate, 'dd/MM/yyyy, hh:mm a')}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', color: '#065F46' }}>{r.totalDaysToClose} Days</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{renderStatusTag(r.returnStatus)}</td>
                    </>
                  )}

                  {reportType === 'party-summary' && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47' }}>{r.partyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right' }}>{r.totalGatePasses}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#92400E' }}>{r.openGatePasses}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#065F46' }}>{r.closedGatePasses}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#1E40AF' }}>{r.totalReturnableQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#065F46' }}>{r.totalReturnedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#991B1B' }}>{r.totalPendingQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>{formatINR(r.totalGrandTotal)}</td>
                    </>
                  )}

                  {reportType === 'combined' && (
                    <>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#0F2A47', textAlign: 'center' }}>{r.gatePassNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.date)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }}>{r.partyName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px' }}>{r.itemDescription}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', color: '#1E40AF' }}>{r.returnableQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>{r.inwardNumber}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{safeFormatDate(r.inwardDate, 'dd/MM/yyyy, hh:mm a')}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>{r.receivedQuantity}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right', fontWeight: 'bold', color: '#92400E' }}>{r.balanceQuantity}</td>
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
          <span className="font-semibold text-slate-500">Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

export default CorporateReportDocument;
