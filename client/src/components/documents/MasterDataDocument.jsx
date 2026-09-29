import React from 'react';
import { format } from 'date-fns';

const MasterDataDocument = ({
  type = 'items', // 'items' or 'vendors'
  title = 'Master Data Report',
  records = [],
  filterInfo = {}
}) => {
  const activeCount = records.filter(r => r.status === 'ACTIVE').length;
  const inactiveCount = records.length - activeCount;

  return (
    <div
      className="master-data-document bg-white text-slate-900 mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 10mm 12mm 10mm',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Printable & Media CSS Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .master-data-document {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: block !important;
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
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/Maruti denim logo.png"
              alt="Maruti Denim Logo"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F2A47', margin: 0 }}>
                MARUTI NANDAN DENIM PVT LTD
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                Survey No. 206/1, Village: Machchhav, Taluka: Bavla, Dist: Ahmedabad - 382220
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              style={{
                backgroundColor: '#0F2A47',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              MASTER DATA REPORT
            </div>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              Generated: {format(new Date(), 'dd/MM/yyyy hh:mm a')}
            </p>
          </div>
        </div>

        {/* Title & Stats Bar */}
        <div
          className="mb-4 p-3 rounded flex justify-between items-center"
          style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
        >
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2A47', margin: 0 }}>
              {title}
            </h2>
            <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0' }}>
              Filter: Status ({filterInfo.status || 'ALL'}) | Search ({filterInfo.search || 'None'})
            </p>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="text-center">
              <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>TOTAL RECORDS</span>
              <span style={{ color: '#0F2A47', fontSize: '13px', fontWeight: 'bold' }}>{records.length}</span>
            </div>
            <div className="text-center">
              <span style={{ color: '#059669', fontSize: '10px', display: 'block' }}>ACTIVE</span>
              <span style={{ color: '#059669', fontSize: '13px', fontWeight: 'bold' }}>{activeCount}</span>
            </div>
            <div className="text-center">
              <span style={{ color: '#dc2626', fontSize: '10px', display: 'block' }}>INACTIVE</span>
              <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 'bold' }}>{inactiveCount}</span>
            </div>
          </div>
        </div>

        {/* Main Table */}
        {type === 'items' ? (
          <table
            className="w-full border-collapse mb-6"
            style={{ border: '1px solid #0F2A47', tableLayout: 'fixed', width: '100%' }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '5%', textAlign: 'center' }}>Sr.</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '15%', textAlign: 'left' }}>Item Code</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '48%', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '10%', textAlign: 'center' }}>UM</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '10%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0F2A47' }}>{item.itemCode || '-'}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', color: '#1e293b', wordBreak: 'break-word', fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>{item.um}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: item.status === 'ACTIVE' ? '#059669' : '#64748b' }}>
                    {item.status}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', color: '#64748b' }}>
                    {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table
            className="w-full border-collapse mb-6"
            style={{ border: '1px solid #0F2A47', tableLayout: 'fixed', width: '100%' }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '6%', textAlign: 'center' }}>Sr.</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '16%', textAlign: 'left' }}>Vendor Code</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '54%', textAlign: 'left' }}>Vendor Name / Company Name</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '6px 8px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((vendor, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0F2A47' }}>{vendor.vendorCode || '-'}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11px', color: '#1e293b', wordBreak: 'break-word', fontWeight: 'bold' }}>{vendor.vendorName}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: vendor.status === 'ACTIVE' ? '#059669' : '#64748b' }}>
                    {vendor.status}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px', textAlign: 'center', color: '#64748b' }}>
                    {vendor.createdAt ? format(new Date(vendor.createdAt), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Signatures */}
      <div className="pt-6 border-t border-slate-300 mt-auto" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginTop: '24px' }}>
        <div className="grid grid-cols-3 gap-6 text-center mb-2">
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0F2A47' }}>Prepared By</p>
            <p style={{ fontSize: '10px', color: '#64748b' }}>System Admin</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0F2A47' }}>Verified By</p>
            <p style={{ fontSize: '10px', color: '#64748b' }}>Master Data Manager</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0F2A47' }}>Authorized Signatory</p>
            <p style={{ fontSize: '10px', color: '#64748b' }}>Maruti Denim ERP</p>
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
          <span>This is an official computer-generated master data report.</span>
          <span className="font-semibold text-slate-500">Maruti Nandan Denim Pvt Ltd</span>
        </div>
      </div>
    </div>
  );
};

export default MasterDataDocument;

