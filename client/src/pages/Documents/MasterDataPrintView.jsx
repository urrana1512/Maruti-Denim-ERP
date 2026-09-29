import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MasterDataDocument from '../../components/documents/MasterDataDocument';
import { masterDataService } from '../../services/masterDataService';

const MasterDataPrintView = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  const type = searchParams.get('type') || 'items';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'ALL';
  const autoPrint = searchParams.get('autoprint') !== 'false';

  const title = type === 'items' ? 'Item Description Master Report' : 'Vendor Master Report';

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        let res = null;
        if (type === 'items') {
          res = await masterDataService.getItems({
            search,
            status,
            page: 1,
            limit: 5000 // Get all for print
          });
        } else {
          res = await masterDataService.getVendors({
            search,
            status,
            page: 1,
            limit: 5000
          });
        }

        if (res.success) {
          setRecords(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching master data print records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [type, search, status]);

  useEffect(() => {
    if (!loading && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, autoPrint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm font-semibold text-slate-600">Preparing Master Data Report for print...</p>
      </div>
    );
  }

  return (
    <div data-ready={!loading} className="bg-white min-h-screen flex justify-center py-4">
      <MasterDataDocument
        type={type}
        title={title}
        records={records}
        filterInfo={{ search, status }}
      />
    </div>
  );
};

export default MasterDataPrintView;
