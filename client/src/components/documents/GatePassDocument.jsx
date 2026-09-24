import React, { useState, useEffect } from 'react';
import { safeFormatDate } from '../../utils/dateUtils';

const GatePassDocument = ({ gatePass: directGatePass, data }) => {
  const gatePass = directGatePass || data;
  const [logoBase64, setLogoBase64] = useState('/Maruti denim logo.png');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Convert logo image to base64 Data URI so Puppeteer and browser rendering load images instantly with 0 CORS delays
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

  return (
    <div
      className="gate-pass-document-page w-[210mm] min-h-[297mm] bg-white text-black font-sans box-border relative flex flex-col"
      data-ready={isReady ? 'true' : 'false'}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '8mm 12mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box'
      }}
    >
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
            {gatePass.department && (
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{gatePass.department}</strong>
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
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '40px', textAlign: 'center' }}>Sr.</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '150px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '60px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '50px', textAlign: 'center' }}>UM</th>
              <th style={{ padding: '7px 8px', border: '1px solid #0F2A47', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', width: '22%', textAlign: 'left' }}>Remarks</th>
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