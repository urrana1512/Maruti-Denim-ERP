import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const GatePassDocument = ({ gatePass }) => {
  const [logoBase64, setLogoBase64] = useState('/Maruti denim logo.png');

  useEffect(() => {
    // Convert logo image to base64 Data URI so html2canvas renders canvas with 0 CORS/image load failures
    const loadLogoAsBase64 = async () => {
      try {
        const response = await fetch('/Maruti denim logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Base64 logo conversion fallback to relative URL');
      }
    };
    loadLogoAsBase64();
  }, []);

  if (!gatePass) return null;

  return (
    <div 
      className="gate-pass-document w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-10 bg-white text-black font-sans box-border relative flex flex-col justify-between"
      style={{ 
        maxWidth: '210mm',
        width: '100%', 
        minHeight: '297mm', 
        backgroundColor: '#ffffff', 
        color: '#000000', 
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      <div>
        {/* Header matching exact uploaded letterhead template */}
        <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: '2px solid #0F2A47' }}>
          {/* Top-Left Logo */}
          <div className="flex-shrink-0 mr-4">
            <img 
              src={logoBase64} 
              alt="Maruti Denim Logo" 
              style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Top-Right Letterhead Title & Company Info */}
          <div className="flex-1 text-left">
            <h1 
              style={{ 
                color: '#DC2626', 
                fontFamily: 'Arial, Helvetica, sans-serif', 
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                lineHeight: '1.2',
                whiteSpace: 'nowrap'
              }}
            >
              MARUTI NANDAN DENIM PVT LTD
            </h1>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '3px' }}>
              Block No. 371, PALDI KANKAJ, DASKROI, AHMEDABAD-382425.
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1px' }}>
              E-mail : marutidenim2019@gmail.com
            </p>

            <div 
              style={{ 
                // marginTop: '6px', 
                // padding: '6px 12px', 
                // border: '1px solid #000000', 
                // backgroundColor: '#ffffff',
                // color: '#000000', 
                // fontSize: '11px', 
                // fontWeight: 'bold', 
                // display: 'inline-flex',
                // alignItems: 'center',
                // justifyContent: 'center',
                // lineHeight: '1'
              }}
            >
              <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginTop: '1px', marginBottom: '1px' }}>
                GSTIN/UIN: 24AAUCM1319B1ZQ, State Name : Gujarat, Code : 24
              </p>
            </div>
          </div>
        </div>

        {/* Centered GATE PASS Banner */}
        <div className="text-center my-4 flex justify-center">
          <h2 
            style={{ 
              borderBottom: '2px solid #0F2A47', 
              backgroundColor: '#F8FAFC', 
              color: '#0F2A47',
              fontSize: '16px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              padding: '8px 36px',
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
        <div className="grid grid-cols-3 gap-4 mb-5 p-3.5 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #e2e8f0' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Gate Pass No.</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2A47' }}>{gatePass.gatePassNumber}</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Pass Type</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2A47' }}>{gatePass.passType || 'Returnable'}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Date</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F2A47' }}>{format(new Date(gatePass.date), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        {/* Company Name Section */}
        <div className="mb-5 px-1">
          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>M/s. / Company Name:</p>
          <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2A47', borderBottom: '1px solid #94a3b8', paddingBottom: '4px', marginTop: '2px' }}>
            {gatePass.companyName}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-6" style={{ border: '1px solid #0F2A47' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F2A47', color: '#ffffff' }}>
              <th style={{ padding: '8px 10px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', width: '50px', textAlign: 'center' }}>Sr.</th>
              <th style={{ padding: '8px 10px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '8px 10px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', width: '180px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '8px 10px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', width: '90px', textAlign: 'center' }}>Quantity</th>
              <th style={{ padding: '8px 10px', border: '1px solid #0F2A47', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', width: '24%', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {gatePass.items?.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'center', color: '#334155' }}>{item.serialNumber || idx + 1}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}>{item.description}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600, color: '#334155' }}>{item.category || '-'}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600, textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}>{item.remarks || '-'}</td>
              </tr>
            ))}
            {/* Fill placeholder empty rows to complete standard gate pass document structure */}
            {/* {Array.from({ length: Math.max(0, 4 - (gatePass.items?.length || 0)) }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ padding: '16px 8px', border: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '16px 8px', border: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '16px 8px', border: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '16px 8px', border: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '16px 8px', border: '1px solid #cbd5e1' }}></td>
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>

      {/* Footer & Signatures (Guaranteed on bottom section of document) */}
      <div className="pt-6 mt-auto">
        <div className="flex justify-between items-end mb-6 px-4">
          <div className="text-center">
            <div style={{ width: '180px', borderTop: '1px solid #1e293b', marginBottom: '6px' }}></div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Authorized Signature</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Issued By: {gatePass.createdBy || 'Admin'}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>
            Maruti Nandan Denim Pvt Ltd | Gate Pass Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default GatePassDocument;
