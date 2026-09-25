import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CorporateReportDocument from '../../components/documents/CorporateReportDocument';
import { reportService } from '../../services/reportService';

const CorporateReportPrintView = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [kpis, setKpis] = useState({});

  const reportType = searchParams.get('reportType') || 'gate-pass';
  const autoPrint = searchParams.get('autoprint') !== 'false';

  const filterParams = {
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    gatePassStatus: searchParams.get('gatePassStatus') || 'All',
    returnStatus: searchParams.get('returnStatus') || 'All',
    materialType: searchParams.get('materialType') || 'All',
    party: searchParams.get('party') || 'All',
    gatePassNumber: searchParams.get('gatePassNumber') || '',
    materialInwardNumber: searchParams.get('materialInwardNumber') || '',
    item: searchParams.get('item') || '',
    page: 1,
    pageSize: 1000 // Get full set for report print
  };

  const getReportTitle = (type) => {
    switch (type) {
      case 'gate-pass': return 'Gate Pass Register Report';
      case 'material-inward': return 'Material Inward Register Report';
      case 'returnable-material': return 'Returnable Material Report';
      case 'pending-returns': return 'Pending Return Report';
      case 'gate-pass-closure': return 'Gate Pass Closure Report';
      case 'party-summary': return 'Party-wise Summary Report';
      case 'combined':
      default:
        return 'Combined Gate Pass & Return Report';
    }
  };

  useEffect(() => {
    const fetchDocData = async () => {
      try {
        setLoading(true);
        let res = null;
        switch (reportType) {
          case 'gate-pass':
            res = await reportService.getGatePassRegister(filterParams);
            break;
          case 'material-inward':
            res = await reportService.getMaterialInwardRegister(filterParams);
            break;
          case 'returnable-material':
            res = await reportService.getReturnableMaterialReport(filterParams);
            break;
          case 'pending-returns':
            res = await reportService.getPendingReturnReport(filterParams);
            break;
          case 'gate-pass-closure':
            res = await reportService.getGatePassClosureReport(filterParams);
            break;
          case 'party-summary':
            res = await reportService.getPartySummaryReport(filterParams);
            break;
          case 'combined':
          default:
            res = await reportService.getCombinedReport(filterParams);
            break;
        }

        if (res && res.success) {
          setReportData(res.data || []);
          setKpis(res.kpis || {});
        }
      } catch (err) {
        console.error('Failed to load report for print:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocData();
  }, [reportType]);

  useEffect(() => {
    if (!loading && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, autoPrint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-500 font-sans text-sm">
        Generating Corporate Report Document...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center p-0 print:p-0 print:bg-white">
      <CorporateReportDocument
        reportType={reportType}
        reportTitle={getReportTitle(reportType)}
        filters={filterParams}
        records={reportData}
        kpis={kpis}
      />
    </div>
  );
};

export default CorporateReportPrintView;
