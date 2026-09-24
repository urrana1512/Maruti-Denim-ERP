import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MaterialInwardReceiptDocument from '../../components/documents/MaterialInwardReceiptDocument';
import { getMaterialInwardById } from '../../services/materialInwardService';

const MaterialInwardPrintView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [materialInward, setMaterialInward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const autoPrint = searchParams.get('autoprint') === 'true';

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await getMaterialInwardById(id);
        const data = res.data?.materialInward || res.data || res;
        setMaterialInward(data);
      } catch (err) {
        console.error('Failed to load Material Inward print document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (materialInward && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [materialInward, autoPrint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-500 font-sans text-sm">
        Loading Material Inward Document...
      </div>
    );
  }

  if (error || !materialInward) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-rose-600 font-sans text-sm p-4">
        {error || 'Material Inward document not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center p-0 print:p-0 print:bg-white">
      <MaterialInwardReceiptDocument materialInward={materialInward} />
    </div>
  );
};

export default MaterialInwardPrintView;
