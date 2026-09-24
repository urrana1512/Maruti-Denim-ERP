import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import GatePassDocument from '../../components/documents/GatePassDocument';
import { gatePassService } from '../../services/gatePassService';

const GatePassPrintView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [gatePass, setGatePass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const autoPrint = searchParams.get('autoprint') === 'true';

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await gatePassService.getById(id);
        const data = res.data?.gatePass || res.data || res;
        setGatePass(data);
      } catch (err) {
        console.error('Failed to load Gate Pass print document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (gatePass && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gatePass, autoPrint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-500 font-sans text-sm">
        Loading Gate Pass Document...
      </div>
    );
  }

  if (error || !gatePass) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-rose-600 font-sans text-sm p-4">
        {error || 'Gate Pass document not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center p-0 print:p-0 print:bg-white">
      <GatePassDocument gatePass={gatePass} />
    </div>
  );
};

export default GatePassPrintView;
