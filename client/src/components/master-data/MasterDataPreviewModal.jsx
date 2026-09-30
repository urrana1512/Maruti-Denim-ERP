import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { safeHtml2Canvas } from '../../utils/html2canvasUtil';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import api from '../../services/api';
import MasterDataDocument from '../documents/MasterDataDocument';

const MasterDataPreviewModal = ({
  type = 'items',
  title = 'Master Data Report',
  records = [],
  filterInfo = {},
  onClose
}) => {
  const documentRef = useRef(null);

  const handlePrint = () => {
    const queryParams = new URLSearchParams({
      type,
      search: filterInfo.search || '',
      status: filterInfo.status || 'ALL',
      autoprint: 'true'
    });
    window.open(`/documents/master-data/print?${queryParams.toString()}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating Master Data PDF...', { id: 'master-pdf-toast' });

      const queryParams = new URLSearchParams({
        type,
        search: filterInfo.search || '',
        status: filterInfo.status || 'ALL'
      });

      // Try server-side Puppeteer PDF generation first for exact A4 multi-page document
      try {
        const response = await api.get(`/master-data/export/pdf?${queryParams.toString()}`, {
          responseType: 'blob'
        });

        if (response.data) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
          a.download = `MarutiDenim_${cleanTitle}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('Master Data PDF downloaded successfully.', { id: 'master-pdf-toast' });
          return;
        }
      } catch (backendErr) {
        console.warn('Backend Puppeteer PDF service fallback to client rendering:', backendErr);
      }

      // Enhanced Client-side rendering fallback
      const element = documentRef.current;
      if (!element) return;

      const canvas = await safeHtml2Canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: element.scrollHeight + 100,
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
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`MarutiDenim_${cleanTitle}.pdf`);
      toast.success('PDF downloaded successfully.', { id: 'master-pdf-toast' });
    } catch (err) {
      console.error('Error generating master data PDF:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: 'master-pdf-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6 print:bg-transparent print:p-0 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl max-h-[94vh] rounded-xl shadow-2xl flex flex-col print:rounded-none print:shadow-none min-w-0">
        {/* Modal Control Header (Hidden in Print) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 print:hidden gap-2 bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-brand-navy truncate">
              {title} — PDF Preview
            </h3>
            <p className="text-[11px] text-slate-500">
              {records.length} records ready for print and download
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-sm transition-all"
            >
              <Printer size={15} className="mr-1.5 text-slate-600" /> Direct Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-brand-denim hover:bg-brand-navy rounded-md shadow-sm transition-all whitespace-nowrap"
            >
              <Download size={15} className="mr-1.5" /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md ml-1 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable PDF View Container */}
        <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-200 print:p-0 print:bg-white flex justify-center max-w-full">
          <div className="bg-white shadow-lg print:shadow-none max-w-full overflow-x-auto rounded p-1" ref={documentRef}>
            <MasterDataDocument
              type={type}
              title={title}
              records={records}
              filterInfo={filterInfo}
            />
          </div>
        </div>
      </div>

      {/* Global Print Isolation Styles */}
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
          .bg-white.shadow-lg.print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .bg-white.shadow-lg.print\\:shadow-none * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default MasterDataPreviewModal;
