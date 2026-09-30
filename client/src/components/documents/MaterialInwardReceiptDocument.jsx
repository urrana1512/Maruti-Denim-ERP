import React, { useState, useEffect } from 'react';
import { safeFormatDate } from '../../utils/dateUtils';
import { formatINR } from '../../utils/gstCalculator';

const ApprovedStamp = () => (
  <div
    className="approved-stamp-seal"
    style={{
      position: 'absolute',
      top: '115px',
      right: '35px',
      zIndex: 50,
      transform: 'rotate(-12deg)',
      opacity: 0.88,
      pointerEvents: 'none',
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.12))'
    }}
  >
    <svg width="135" height="135" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Double Circle Rings */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="#DC2626" strokeWidth="4.5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#DC2626" strokeWidth="1.8" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="#DC2626" strokeWidth="1.8" />

      {/* Top Arc Text */}
      <path id="topArcPath" d="M 26,100 A 74,74 0 1,1 174,100" fill="none" />
      <text fill="#DC2626" fontSize="13" fontWeight="900" letterSpacing="3.5" textAnchor="middle">
        <textPath href="#topArcPath" startOffset="50%">
          APPROVED
        </textPath>
      </text>

      {/* Bottom Arc Text */}
      <path id="bottomArcPath" d="M 174,100 A 74,74 0 0,1 26,100" fill="none" />
      <text fill="#DC2626" fontSize="11.5" fontWeight="900" letterSpacing="3.2" textAnchor="middle">
        <textPath href="#bottomArcPath" startOffset="50%">
          VERIFIED & VALID
        </textPath>
      </text>

      {/* Side Dots */}
      <circle cx="25" cy="100" r="3" fill="#DC2626" />
      <circle cx="175" cy="100" r="3" fill="#DC2626" />

      {/* Center Banner Box */}
      <rect x="6" y="75" width="188" height="50" fill="#FFFFFF" rx="2" stroke="#DC2626" strokeWidth="3" />
      <line x1="6" y1="80" x2="194" y2="80" stroke="#DC2626" strokeWidth="1.2" />
      <line x1="6" y1="120" x2="194" y2="120" stroke="#DC2626" strokeWidth="1.2" />

      {/* Center Main Text */}
      <text
        x="100"
        y="110"
        fill="#DC2626"
        fontSize="27"
        fontWeight="950"
        fontFamily="Impact, 'Arial Black', sans-serif"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        APPROVED
      </text>
    </svg>
  </div>
);

const MaterialInwardReceiptDocument = ({ materialInward: directRecord, data }) => {
  const [logoBase64, setLogoBase64] = useState('/Maruti denim logo.png');
  const [isReady, setIsReady] = useState(false);

  const rawData = directRecord || data;
  const materialInward = rawData?.materialInward || rawData;

  useEffect(() => {
    const loadLogoAsBase64 = async () => {
      try {
        const response = await fetch('/Maruti denim logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setLogoBase64(reader.result);
          }
          setIsReady(true);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Base64 logo conversion fallback');
        setIsReady(true);
      }
    };
    loadLogoAsBase64();
  }, []);

  const isConsolidated = Boolean(
    materialInward.isConsolidated ||
    (materialInward.items && materialInward.items.some(it => it.inwardNumber && it.inwardNumber !== materialInward.inwardNumber))
  );

  const isApproved = Boolean(
    materialInward.status === 'Approved' ||
    materialInward.approvedAt ||
    materialInward.isApproved ||
    (isConsolidated && materialInward.gatePassStatus === 'CLOSED')
  );

  const vendorAddress = materialInward.vendorAddress || materialInward.vendorId?.address || materialInward.gatePassId?.vendorAddress || materialInward.gatePassId?.vendorId?.address;
  const vendorCity = materialInward.vendorCity || materialInward.vendorId?.city || materialInward.gatePassId?.vendorCity || materialInward.gatePassId?.vendorId?.city;
  const vendorPincode = materialInward.vendorPincode || materialInward.vendorId?.pincode || materialInward.gatePassId?.vendorPincode || materialInward.gatePassId?.vendorId?.pincode;

  const fullVendorAddress = [vendorAddress, vendorCity, vendorPincode].filter(Boolean).join(', ');
  const vendorGstin = materialInward.vendorGstin || materialInward.vendorId?.gstin || materialInward.gatePassId?.vendorGstin || materialInward.gatePassId?.vendorId?.gstin;
  const vendorPanCard = materialInward.vendorPanCard || materialInward.vendorId?.panCard || materialInward.gatePassId?.vendorPanCard || materialInward.gatePassId?.vendorId?.panCard;

  return (
    <div
      className="material-inward-document w-[210mm] min-h-[280mm] bg-white text-black font-sans box-border relative flex flex-col justify-between"
      data-ready={isReady ? 'true' : 'false'}
      style={{
        width: '210mm',
        minHeight: '280mm',
        padding: '8mm 10mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {isApproved && <ApprovedStamp />}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-3 mb-3" style={{ borderBottom: '2px solid #0F2A47' }}>
          <div className="flex-shrink-0 mr-4">
            <img
              src={logoBase64}
              alt="Maruti Denim Logo"
              style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div className="text-right flex-1">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F2A47', margin: 0, letterSpacing: '0.5px' }}>
              MARUTI NANDAN DENIM PVT LTD
            </h1>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginTop: '3px' }}>
              Block No. 371, PALDI KANKAJ, DASKROI, AHMEDABAD-382425.
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
              E-mail : marutidenim2019@gmail.com | GSTIN: 24AAUCM1319B1ZQ
            </p>
          </div>
        </div>

        {/* Title Banner */}
        <div className="text-center my-3 flex justify-center">
          <h2
            style={{
              borderBottom: '2px solid #0F2A47',
              backgroundColor: '#F8FAFC',
              color: '#0F2A47',
              fontSize: '16px',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              padding: '0 22px',
              height: '36px',
              lineHeight: '36px',
              display: 'inline-block',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            {isConsolidated ? 'CONSOLIDATED MATERIAL INWARD RECEIPT' : 'MATERIAL INWARD RECEIPT'}
          </h2>
        </div>

        {/* Document Information Grid */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 14px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2" style={{ fontSize: '12.5px' }}>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Inward No.:</span>{' '}
              <strong style={{ color: '#0F2A47', fontSize: '13.5px' }}>{materialInward.inwardNumber}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>
                {isConsolidated ? 'Consolidated As On:' : 'Inward Date & Time:'}
              </span>{' '}
              <strong style={{ color: '#1e293b' }}>
                {safeFormatDate(materialInward.inwardDate || materialInward.createdAt, 'dd/MM/yyyy, hh:mm a')}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Ref. Gate Pass No.:</span>{' '}
              <strong style={{ color: '#1E40AF' }}>{materialInward.gatePassNumber}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>
                {isConsolidated ? 'Gate Pass Status:' : 'Gate Entry No.:'}
              </span>{' '}
              <strong style={{ color: materialInward.gatePassStatus === 'CLOSED' ? '#166534' : '#1e293b' }}>
                {isConsolidated ? (materialInward.gatePassStatus || 'CLOSED') : materialInward.gateEntryNumber}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Challan / Invoice No.:</span>{' '}
              <strong style={{ color: '#1e293b' }}>{materialInward.challanInvoiceNumber} ({materialInward.documentType || 'Challan'})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Party Name:</span>{' '}
              <strong style={{ color: '#0F2A47', fontSize: '13px', wordBreak: 'break-word' }}>
                {materialInward.partyName || materialInward.vendorId?.vendorName || '-'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Address / City:</span>{' '}
              <strong style={{ color: '#1e293b' }}>{fullVendorAddress || '-'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>GSTIN:</span>{' '}
              <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vendorGstin || '-'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>PAN Card:</span>{' '}
              <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vendorPanCard || '-'}</strong>
            </div>
          </div>
        </div>

        {/* Received Items Table */}
        <table className="w-full border-collapse mb-4" style={{ border: '1px solid #0F2A47', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '32px', textAlign: 'center' }}>Sr.</th>
              <th style={{ padding: '7px 6px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Item Description</th>
              {isConsolidated ? (
                <>
                  <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '125px', textAlign: 'center' }}>Return Date & Time</th>
                  <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '90px', textAlign: 'center' }}>Inward Ref</th>
                </>
              ) : (
                <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '48px', textAlign: 'center' }}>Orig</th>
              )}
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '52px', textAlign: 'center' }}>Rec Qty</th>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '40px', textAlign: 'center' }}>Unit</th>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '68px', textAlign: 'right' }}>Rate (₹)</th>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '70px', textAlign: 'right' }}>Taxable</th>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '62px', textAlign: 'right' }}>GST</th>
              <th style={{ padding: '7px 5px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', width: '78px', textAlign: 'right' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {materialInward.items?.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'center', color: '#334155' }}>{item.serialNumber || idx + 1}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', color: '#334155', wordBreak: 'break-word' }}>{item.description}</td>
                {isConsolidated ? (
                  <>
                    <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '10.5px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>
                      {safeFormatDate(item.inwardDate || materialInward.inwardDate || materialInward.createdAt, 'dd/MM/yyyy, hh:mm a')}
                    </td>
                    <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '10.5px', textAlign: 'center', color: '#0F2A47', fontWeight: 700 }}>
                      {item.inwardNumber || materialInward.inwardNumber}
                    </td>
                  </>
                ) : (
                  <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'center', color: '#64748b' }}>{item.originalQuantity}</td>
                )}
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', color: '#0F2A47' }}>{item.receivedQuantity}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'center', color: '#334155' }}>{item.unit || 'Nos'}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'right', color: '#334155' }}>{item.rate ? Number(item.rate).toFixed(2) : '0.00'}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'right', color: '#334155' }}>{formatINR(item.taxableAmount)}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', textAlign: 'right', color: '#334155' }}>{formatINR(item.gstAmount)}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'right', color: '#0F2A47' }}>{formatINR(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Amounts Summary & Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px', pageBreakInside: 'avoid' }}>
          <div style={{ width: '270px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 14px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px', color: '#475569' }}>
              <span>Combined Subtotal:</span>
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatINR(materialInward.subtotal)}</span>
            </div>
            {materialInward.totalCgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px', color: '#475569' }}>
                <span>Total CGST:</span>
                <span>{formatINR(materialInward.totalCgst)}</span>
              </div>
            )}
            {materialInward.totalSgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px', color: '#475569' }}>
                <span>Total SGST:</span>
                <span>{formatINR(materialInward.totalSgst)}</span>
              </div>
            )}
            {materialInward.totalIgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px', color: '#475569' }}>
                <span>Total IGST:</span>
                <span>{formatINR(materialInward.totalIgst)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#0F2A47', paddingTop: '5px', borderTop: '1px solid #cbd5e1' }}>
              <span>Combined Grand Total:</span>
              <span>{formatINR(materialInward.grandTotal)}</span>
            </div>
          </div>
        </div>

        {materialInward.remarks && (
          <div style={{ fontSize: '12.5px', color: '#475569', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
            <strong>Verification & Remarks:</strong> {materialInward.remarks}
          </div>
        )}
      </div>

      {/* Footer Signatures */}
      <div className="pt-5 border-slate-300 mt-auto flex-shrink-0" style={{ pageBreakInside: 'avoid' }}>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0F2A47' }}>Prepared By</p>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{materialInward.createdBy || 'Store Incharge'}</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0F2A47' }}>Received By</p>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Receiver Sign & Stamp</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0F2A47' }}>Authorised By</p>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>For Maruti Nandan Denim Pvt Ltd</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '14px', paddingTop: '6px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
            Maruti Nandan Denim Pvt Ltd | Material Inward System | Computer Generated Voucher
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaterialInwardReceiptDocument;