import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import GatePassDocument from './GatePassDocument';

const GatePassPreviewModal = ({ gatePass, onClose }) => {
  const documentRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      
      const element = documentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Force exact A4 210mm width and desktop padding on cloned DOM node for PDF output
          const targetDoc = clonedDoc.querySelector('.gate-pass-document');
          if (targetDoc) {
            targetDoc.style.width = '210mm';
            targetDoc.style.maxWidth = '210mm';
            targetDoc.style.padding = '40px';
          }

          // Purge unsupported oklch color functions from all style tags in the cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((s) => {
            if (s.innerHTML && s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, '#000000');
            }
          });
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && inlineStyle.includes('oklch')) {
              el.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, '#000000'));
            }
          });
        },
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate imgHeight preserving exact 1:1 natural aspect ratio (NO stretching!)
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (imgHeight <= pdfPageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      } else {
        const fitWidth = (canvas.width * pdfPageHeight) / canvas.height;
        const xOffset = (pdfWidth - fitWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, fitWidth, pdfPageHeight, undefined, 'FAST');
      }

      pdf.save(`MarutiDenim_GatePass_${gatePass.gatePassNumber || 'Document'}.pdf`);
      toast.success('PDF downloaded successfully.', { id: 'pdf-toast' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error(`Failed to generate PDF: ${error.message || 'Unknown error'}`, { id: 'pdf-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6 print:bg-transparent print:p-0 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col print:rounded-none print:shadow-none min-w-0">
        {/* Modal Header (Hidden in print) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 print:hidden gap-2">
          <h3 className="text-sm sm:text-lg font-bold text-brand-navy truncate">Gate Pass Preview</h3>
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

        {/* Modal Body / Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 bg-slate-100 print:p-0 print:bg-white flex justify-center w-full">
          {/* Document Container */}
          <div className="bg-white shadow-sm print:shadow-none w-full max-w-[210mm] rounded flex justify-center" ref={documentRef}>
             <GatePassDocument gatePass={gatePass} />
          </div>
        </div>
      </div>
      
      {/* Global Print Styles to isolate the document */}
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
          /* Specific targeting */
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

export default GatePassPreviewModal;
