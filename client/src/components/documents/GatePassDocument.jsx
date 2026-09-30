import React, { useState, useEffect } from 'react';
import { safeFormatDate } from '../../utils/dateUtils';

const ApprovedStamp = ({ text = "APPROVED" }) => (
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
      <circle cx="100" cy="100" r="92" fill="none" stroke="#DC2626" strokeWidth="4.5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#DC2626" strokeWidth="1.8" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="#DC2626" strokeWidth="1.8" />

      <path id="gpTopArcPath" d="M 26,100 A 74,74 0 1,1 174,100" fill="none" />
      <text fill="#DC2626" fontSize="13" fontWeight="900" letterSpacing="3.5" textAnchor="middle">
        <textPath href="#gpTopArcPath" startOffset="50%">
          {text}
        </textPath>
      </text>

      <path id="gpBottomArcPath" d="M 174,100 A 74,74 0 0,1 26,100" fill="none" />
      <text fill="#DC2626" fontSize="11.5" fontWeight="900" letterSpacing="3.2" textAnchor="middle">
        <textPath href="#gpBottomArcPath" startOffset="50%">
          VERIFIED & VALID
        </textPath>
      </text>

      <circle cx="25" cy="100" r="3" fill="#DC2626" />
      <circle cx="175" cy="100" r="3" fill="#DC2626" />

      <rect x="6" y="75" width="188" height="50" fill="#FFFFFF" rx="2" stroke="#DC2626" strokeWidth="3" />
      <line x1="6" y1="80" x2="194" y2="80" stroke="#DC2626" strokeWidth="1.2" />
      <line x1="6" y1="120" x2="194" y2="120" stroke="#DC2626" strokeWidth="1.2" />

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
        {text}
      </text>
    </svg>
  </div>
);

const GatePassDocument = ({ gatePass: directGatePass, data }) => {
  const gatePass = directGatePass || data;
  const [logoBase64, setLogoBase64] = useState('/Maruti denim logo.png');
  const [isReady, setIsReady] = useState(false);

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

  if (!gatePass) return null;

  const isApproved = Boolean(
    gatePass.approvalStatus === 'Approved' ||
    gatePass.status === 'approved'
  );
  const isClosed = Boolean(
    gatePass.gatePassStatus === 'CLOSED' ||
    gatePass.returnStatus === 'FULLY_RETURNED'
  );
  const isApprovedOrClosed = isApproved || isClosed;
  const stampText = isClosed ? 'CLOSED' : 'APPROVED';

  return (
    <div
      className="gate-pass-document-page w-[210mm] min-h-[280mm] bg-white text-black font-sans box-border relative flex flex-col justify-between"
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
      {isApprovedOrClosed && <ApprovedStamp text={stampText} />}
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
          {/* Top-Left Logo */}
          <div className="flex-shrink-0 mr-4">
            <img
              src={logoBase64}
              alt="Maruti Denim Logo"
              style={{ height: '75px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Top-Right Letterhead Title & Company Info */}
          <div className="flex-1 text-left">
            <h1
              style={{
                color: '#DC2626',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '23px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                lineHeight: '1.2',
                whiteSpace: 'nowrap'
              }}
            >
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

        {/* Centered GATE PASS Banner */}
        <div className="text-center my-3 flex justify-center">
          <h2
            style={{
              borderBottom: '2px solid #0F2A47',
              backgroundColor: '#F8FAFC',
              color: '#0F2A47',
              fontSize: '16px',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              padding: '5px 26px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              textTransform: 'uppercase'
            }}
          >
            GATE PASS
          </h2>
        </div>

        {/* Meta Info Section */}
        <div className="grid grid-cols-3 gap-4 mb-3 p-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #e2e8f0' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Gate Pass No.</p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2A47' }}>{gatePass.gatePassNumber}</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Pass Type</p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2A47' }}>{gatePass.passType || 'Returnable'}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Date</p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2A47' }}>{safeFormatDate(gatePass.date || gatePass.createdAt, 'dd/MM/yyyy')}</p>
          </div>
        </div>

        {/* Extended Details Grid: Party, Department, Vehicle, Driver, Purpose */}
        <div className="mb-4 p-3 rounded" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2" style={{ fontSize: '12.5px' }}>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Party Name:</span>{' '}
              <strong style={{ color: '#0F2A47', fontSize: '13.5px', wordBreak: 'break-word' }}>{gatePass.partyName || gatePass.companyName}</strong>
            </div>
            {(gatePass.vendorAddress || gatePass.vendorId?.address) && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Address:</span>{' '}
                <strong style={{ color: '#1e293b' }}>
                  {[
                    gatePass.vendorAddress || gatePass.vendorId?.address,
                    gatePass.vendorCity || gatePass.vendorId?.city,
                    gatePass.vendorPincode || gatePass.vendorId?.pincode
                  ].filter(Boolean).join(', ')}
                </strong>
              </div>
            )}
            {(gatePass.vendorGstin || gatePass.vendorId?.gstin) && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>GSTIN:</span>{' '}
                <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{gatePass.vendorGstin || gatePass.vendorId?.gstin}</strong>
              </div>
            )}
            {(gatePass.vendorPanCard || gatePass.vendorId?.panCard) && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>PAN Card:</span>{' '}
                <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{gatePass.vendorPanCard || gatePass.vendorId?.panCard}</strong>
              </div>
            )}
            {gatePass.department && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{gatePass.department}</strong>
              </div>
            )}
            {gatePass.costCentre && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Cost Centre:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{gatePass.costCentre}</strong>
              </div>
            )}
            {gatePass.vehicleNumber && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle No:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{gatePass.vehicleNumber}</strong>
              </div>
            )}
            {gatePass.driverName && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Driver Name:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{gatePass.driverName}</strong>
              </div>
            )}
            {gatePass.purpose && (
              <div className="col-span-2">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Purpose:</span>{' '}
                <strong style={{ color: '#1e293b', wordBreak: 'break-word' }}>{gatePass.purpose}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-4" style={{ border: '1px solid #0F2A47', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '35px', textAlign: 'center' }}>Sr.</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '130px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '55px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '45px', textAlign: 'center' }}>UM</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '110px', textAlign: 'left' }}>Cost Centre</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '18%', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {gatePass.items?.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'center', color: '#334155' }}>{item.serialNumber || idx + 1}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#334155', wordBreak: 'break-word' }}>{item.description}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{item.category || '-'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600, textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'center', color: '#334155' }}>{item.uom || 'Nos'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#334155', wordBreak: 'break-word' }}>{item.costCentre || gatePass.costCentre || '-'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#334155', wordBreak: 'break-word' }}>{item.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer & Signatures */}
      <div className="pt-5 border-slate-300 mt-auto flex-shrink-0" style={{ pageBreakInside: 'avoid' }}>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0F2A47' }}>Prepared By</p>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{gatePass.createdBy || 'Authorized Staff'}</p>
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
            Maruti Nandan Denim Pvt Ltd | Gate Pass Management System | Computer Generated Voucher
          </p>
        </div>
      </div>
    </div>
  );
};

export default GatePassDocument;