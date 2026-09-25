import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import CorporateReportDocument from '../documents/CorporateReportDocument';

const ReportPreviewModal = ({
  reportType = 'gate-pass',
  reportTitle = 'Executive MIS Report',
  filters = {},
  records = [],
  kpis = {},
  onClose
}) => {
  const documentRef = useRef(null);

  const handlePrint = () => {
    const queryParams = new URLSearchParams({
      reportType,
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
      gatePassStatus: filters.gatePassStatus || 'All',
      returnStatus: filters.returnStatus || 'All',
      materialType: filters.materialType || 'All',
      party: filters.party || 'All',
      gatePassNumber: filters.gatePassNumber || '',
      materialInwardNumber: filters.materialInwardNumber || '',
      item: filters.item || '',
      autoprint: 'true'
    });
    window.open(`/documents/reports/print?${queryParams.toString()}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating Corporate Report PDF...', { id: 'report-pdf-toast' });

      const element = documentRef.current;
      if (!element) return;

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
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfPageHeight;
        }
      }

      const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`MarutiDenim_${cleanTitle}_Report.pdf`);
      toast.success('Report PDF downloaded successfully.', { id: 'report-pdf-toast' });
    } catch (error) {
      console.error('Report PDF Generation Error:', error);
      toast.error(`Failed to generate PDF: ${error.message || 'Unknown error'}`, { id: 'report-pdf-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6 print:bg-transparent print:p-0 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl max-h-[94vh] rounded-xl shadow-2xl flex flex-col print:rounded-none print:shadow-none min-w-0">
        {/* Modal Control Header (Hidden in Print) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 print:hidden gap-2 bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-brand-navy truncate">
              {reportTitle} — PDF Preview
            </h3>
            <p className="text-[11px] text-slate-500">Corporate Format & Signature Footer</p>
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
            <CorporateReportDocument
              reportType={reportType}
              reportTitle={reportTitle}
              filters={filters}
              records={records}
              kpis={kpis}
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

export default ReportPreviewModal;
