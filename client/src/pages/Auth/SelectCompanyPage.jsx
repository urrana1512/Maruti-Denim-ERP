import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Building2, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SelectCompanyPage = () => {
  const { selectedCompany, setSelectedCompany } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await authService.getPublicCompanies();
        if (res.success && res.data) {
          setCompanies(res.data);
          // If no company selected yet, set first company by default
          if (!selectedCompany && res.data.length > 0) {
            setSelectedCompany(res.data[0]);
          }
        }
      } catch (err) {
        toast.error('Failed to load company directory');
        // Fallback default companies
        setCompanies([
          { code: 'MARUTI_NANDAN', name: 'MARUTI NANDAN DENIM PVT LTD', shortCode: 'MND', status: 'ACTIVE' },
          { code: 'SHRI_RAM_COT_FAB', name: 'SHRI RAM COT FAB', shortCode: 'SRCF', status: 'ACTIVE' },
          { code: 'BALAJI_POLYCOT', name: 'BALAJI POLYCOT PVT. LTD.', shortCode: 'BPPL', status: 'ACTIVE' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelect = (comp) => {
    setSelectedCompany(comp);
    toast.success(`Selected ${comp.name}`);
  };

  const handleContinue = (targetPath) => {
    if (!selectedCompany) {
      toast.error('Please select a company to continue');
      return;
    }
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/Maruti denim logo.png"
            alt="Maruti Denim Logo"
            className="h-16 w-auto object-contain filter drop-shadow"
          />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Maruti Denim Group</h2>
        <p className="mt-1 text-base text-slate-600">Enterprise Gate Pass Management & Operations Portal</p>
        <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles size={14} /> Multi-Company Enterprise Edition
        </span>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Select Operating Company</h3>
            <p className="text-sm text-slate-500">
              Select your organization unit to access company-specific Gate Passes, Inventory, and Admin controls.
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-brand-denim border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {companies.map((comp) => {
                const isSelected = selectedCompany?.code === comp.code;
                return (
                  <div
                    key={comp.code}
                    onClick={() => handleSelect(comp)}
                    className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-navy bg-slate-900 text-white shadow-lg scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow text-slate-800'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-emerald-400">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                    <div>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm mb-3 ${
                          isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-brand-navy'
                        }`}
                      >
                        {comp.shortCode}
                      </div>
                      <h4 className="font-bold text-sm line-clamp-2 leading-snug mb-1">{comp.name}</h4>
                      <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        Code: {comp.code}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center text-xs font-medium">
                      <Building2 size={14} className="mr-1.5 opacity-70" />
                      <span>{comp.status || 'ACTIVE'} Tenant</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleContinue('/login')}
              disabled={!selectedCompany}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md text-sm font-semibold text-white bg-brand-navy hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              Continue to Sign In ({selectedCompany?.shortCode || 'Select'})
              <ArrowRight size={18} className="ml-2" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleContinue('/register')}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Register New User Account
              </button>
              <button
                onClick={() => handleContinue('/admin/login')}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Company Admin Panel
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate('/superadmin/login')}
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ShieldAlert size={14} className="mr-1.5" />
              Platform Super Admin Portal Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectCompanyPage;
