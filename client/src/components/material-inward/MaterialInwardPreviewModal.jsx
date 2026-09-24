import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import MaterialInwardDocument from './MaterialInwardDocument';
import api from '../../services/api';

const MaterialInwardPreviewModal = ({ materialInward, onClose }) => {
  const documentRef = useRef(null);

  const handlePrint = () => {
    if (materialInward?._id) {
      window.open(`/documents/material-inward/${materialInward._id}/print?autoprint=true`, '_blank');
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating Material Inward PDF...', { id: 'inward-pdf-toast' });
      
      if (materialInward?._id) {
        // Fetch server-side Puppeteer generated PDF from Express backend
        const response = await api.get(`/material-inward/${materialInward._id}/pdf`, {
          responseType: 'blob'
        });

        if (response.data) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `MarutiDenim_MaterialInwardReceipt_${materialInward.inwardNumber || 'MI'}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('Material Inward PDF downloaded.', { id: 'inward-pdf-toast' });
          return;
        }
      }

      // Fallback to client rendering if ID is absent or backend timeout
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfPageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      } else {
        const fitWidth = (canvas.width * pdfPageHeight) / canvas.height;
        const xOffset = (pdfWidth - fitWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, fitWidth, pdfPageHeight);
      }

      pdf.save(`MarutiDenim_MaterialInwardReceipt_${materialInward.inwardNumber || 'Voucher'}.pdf`);
      toast.success('Material Inward PDF downloaded.', { id: 'inward-pdf-toast' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error(`Failed to generate PDF: ${error.message || 'Unknown error'}`, { id: 'inward-pdf-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6 print:bg-transparent print:p-0 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col print:rounded-none print:shadow-none min-w-0">
        {/* Modal Header */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 print:hidden gap-2">
          <h3 className="text-sm sm:text-lg font-bold text-brand-navy truncate">
            Material Inward Preview ({materialInward?.inwardNumber})
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              <Printer size={15} className="mr-1 sm:mr-2" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-brand-denim hover:bg-brand-navy rounded-md whitespace-nowrap"
            >
              <Download size={15} className="mr-1 sm:mr-2" /> Download PDF
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-100 print:p-0 print:bg-white flex justify-center max-w-full">
          <div className="bg-white shadow-sm print:shadow-none max-w-full overflow-x-auto rounded" ref={documentRef}>
            <MaterialInwardDocument materialInward={materialInward} />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0 {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: 0;
            padding: 0;
          }
          .fixed.inset-0 *, .fixed.inset-0 {
             background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          div[ref] *, div[ref] {
             visibility: visible;
          }
          .bg-white.shadow-sm.print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .bg-white.shadow-sm.print\\:shadow-none * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default MaterialInwardPreviewModal;
