import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportSummaryCards from '../../components/reports/ReportSummaryCards';
import ReportTable from '../../components/reports/ReportTable';
import ReportPreviewModal from '../../components/reports/ReportPreviewModal';
import { BarChart3, FileSpreadsheet, Layers, Clock, AlertTriangle, CheckCircle, ArrowRightLeft, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('gate-pass');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    gatePassStatus: 'All',
    returnStatus: 'All',
    materialType: 'All',
    party: 'All',
    gatePassNumber: '',
    materialInwardNumber: '',
    item: '',
    page: 1,
    pageSize: 25
  });

  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [kpis, setKpis] = useState({});

  const reportTabs = [
    { id: 'gate-pass', label: 'Gate Pass Register', icon: FileSpreadsheet },
    { id: 'material-inward', label: 'Material Inward Register', icon: ArrowRightLeft },
    { id: 'returnable-material', label: 'Returnable Material Report', icon: Layers },
    { id: 'pending-returns', label: 'Pending Return Report', icon: Clock },
    { id: 'gate-pass-closure', label: 'Gate Pass Closure Report', icon: CheckCircle },
    { id: 'party-summary', label: 'Party-wise Summary Report', icon: Building2 },
    { id: 'combined', label: 'Combined GP & Return Report', icon: BarChart3 }
  ];

  // Fetch distinct parties on load
  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await reportService.getParties();
        if (res.success && res.data) {
          setParties(res.data);
        }
      } catch (err) {
        console.warn('Failed to load parties:', err);
      }
    };
    loadParties();
  }, []);

  // Fetch Report Data whenever tab or pagination/applied filters change
  const fetchReportData = async (currentFilters = filters, tab = activeTab) => {
    try {
      setLoading(true);
      let res = null;

      switch (tab) {
        case 'gate-pass':
          res = await reportService.getGatePassRegister(currentFilters);
          break;
        case 'material-inward':
          res = await reportService.getMaterialInwardRegister(currentFilters);
          break;
        case 'returnable-material':
          res = await reportService.getReturnableMaterialReport(currentFilters);
          break;
        case 'pending-returns':
          res = await reportService.getPendingReturnReport(currentFilters);
          break;
        case 'gate-pass-closure':
          res = await reportService.getGatePassClosureReport(currentFilters);
          break;
        case 'party-summary':
          res = await reportService.getPartySummaryReport(currentFilters);
          break;
        case 'combined':
        default:
          res = await reportService.getCombinedReport(currentFilters);
          break;
      }

      if (res && res.success) {
        setReportData(res.data || []);
        setPagination(res.pagination || {});
        setKpis(res.kpis || {});
      } else {
        toast.error(res?.message || 'Failed to fetch report data.');
      }
    } catch (err) {
      console.error('Fetch Report Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Unable to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(filters, activeTab);
  }, [activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to page 1 on filter change
    }));
  };

  const handleApplyFilters = () => {
    fetchReportData(filters, activeTab);
  };

  const handleResetFilters = () => {
    const reset = {
      fromDate: '',
      toDate: '',
      gatePassStatus: 'All',
      returnStatus: 'All',
      materialType: 'All',
      party: 'All',
      gatePassNumber: '',
      materialInwardNumber: '',
      item: '',
      page: 1,
      pageSize: 25
    };
    setFilters(reset);
    fetchReportData(reset, activeTab);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    fetchReportData(updated, activeTab);
  };

  const handlePageSizeChange = (newSize) => {
    const updated = { ...filters, pageSize: newSize, page: 1 };
    setFilters(updated);
    fetchReportData(updated, activeTab);
  };

  // Excel Workbook Export Handler
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      toast.loading('Generating Excel Report...', { id: 'report-export-toast' });
      
      const exportParams = { ...filters, reportType: activeTab };
      delete exportParams.page;
      delete exportParams.pageSize;

      const response = await reportService.exportExcel(exportParams);
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fromStr = filters.fromDate || 'Start';
      const toStr = filters.toDate || 'Present';
      a.download = `MarutiDenim_${activeTab.replace(/-/g, '_')}_Report_${fromStr}_to_${toStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully.', { id: 'report-export-toast' });
    } catch (err) {
      console.error('Export Excel Error:', err);
      toast.error('Unable to generate report. Please try again.', { id: 'report-export-toast' });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setShowPreviewModal(true);
  };

  const currentTabLabel = reportTabs.find(t => t.id === activeTab)?.label || 'Executive MIS Report';
  const isNarrativeReport = activeTab === 'material-inward' || activeTab === 'combined';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy flex items-center">
          <BarChart3 size={28} className="mr-2 text-brand-denim flex-shrink-0" />
          Reports & MIS
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Gate Pass & Material Inward Management Reports
        </p>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-border-subtle overflow-x-auto">
        <div className="flex space-x-1 min-w-max pb-1">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setFilters(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                  isActive 
                    ? 'bg-brand-navy text-white border-brand-denim shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 border-transparent hover:text-brand-navy'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Panel */}
      <ReportFilters
        activeTab={activeTab}
        parties={parties}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        isExporting={exporting}
      />

      {/* Sort Narrative Notice */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Calendar size={14} className="text-brand-denim" />
          <span>
            <strong>Sort Sequence:</strong>{' '}
            {isNarrativeReport 
              ? 'Sorted Chronologically (Oldest → Newest) for complete transaction narrative.'
              : 'Sorted Date DESC (Newest First) for management review.'}
          </span>
        </div>
        <span className="font-bold text-brand-navy hidden sm:inline">Read-Only MIS Output</span>
      </div>

      {/* Summary KPI Cards Bar */}
      <ReportSummaryCards activeTab={activeTab} kpis={kpis} />

      {/* Data Table */}
      <ReportTable
        activeTab={activeTab}
        records={reportData}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={loading}
      />

      {/* PDF View Modal */}
      {showPreviewModal && (
        <ReportPreviewModal
          reportType={activeTab}
          reportTitle={currentTabLabel}
          filters={filters}
          records={reportData}
          kpis={kpis}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default Reports;
