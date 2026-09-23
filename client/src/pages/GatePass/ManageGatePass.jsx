import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Download, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';
import GatePassPreviewModal from '../../components/gate-pass/GatePassPreviewModal';
import EditGatePassModal from '../../components/gate-pass/EditGatePassModal';

const ManageGatePass = () => {
  const navigate = useNavigate();
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [editingGatePass, setEditingGatePass] = useState(null);

  const fetchGatePasses = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await gatePassService.getAll({ search: searchQuery });
      if (res.success) setGatePasses(res.data);
    } catch (error) {
      toast.error('Failed to fetch gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGatePasses(search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gate pass? This action cannot be undone.')) {
      try {
        const res = await gatePassService.delete(id);
        if (res.success) {
          toast.success('Gate Pass deleted successfully.');
          fetchGatePasses(search);
        }
      } catch (error) {
        toast.error('Unable to delete gate pass.');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 min-w-0 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Manage Gate Pass</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">View, search and manage all gate passes.</p>
        </div>
        <button
          onClick={() => navigate('/gate-pass/add')}
          className="flex items-center px-4 py-2 bg-brand-denim text-white text-sm font-medium rounded-md hover:bg-brand-navy transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand-denim whitespace-nowrap"
        >
          <Plus size={16} className="mr-2" />
          Create Gate Pass
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 max-w-full">
        {[
          { label: 'Total Gate Passes', value: gatePasses.length, icon: FileText },
          { label: "Today's Gate Passes", value: gatePasses.filter(gp => new Date(gp.date).toDateString() === new Date().toDateString()).length, icon: Calendar },
          { label: 'Active', value: gatePasses.filter(gp => gp.status === 'active').length, icon: Eye },
          { label: 'Cancelled', value: gatePasses.filter(gp => gp.status === 'cancelled').length, icon: Trash2 },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-surface-card rounded-lg border border-border-subtle p-4 sm:p-5 shadow-sm flex items-center min-w-0">
              <div className="p-2.5 sm:p-3 bg-brand-denim-light rounded-full text-brand-denim mr-3 sm:mr-4 flex-shrink-0">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-brand-navy truncate">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-3 sm:p-4 shadow-sm min-w-0 max-w-full">
        <div className="flex items-center bg-surface-bg border border-border-subtle rounded-md px-3 py-2 w-full max-w-md focus-within:ring-1 focus-within:ring-brand-denim">
          <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by Gate Pass No, Company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700 min-w-0"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-bg">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gate Pass No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : gatePasses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <FileText size={48} className="text-slate-300 mb-3" />
                      <p className="text-base font-medium">No Gate Passes Found</p>
                      <p className="text-sm mt-1">Create your first gate pass to see it here.</p>
                      <button onClick={() => navigate('/gate-pass/add')} className="mt-4 text-brand-denim font-medium text-sm hover:underline">
                        + Create Gate Pass
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                gatePasses.map((gp) => (
                  <tr key={gp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-navy">{gp.gatePassNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{format(new Date(gp.date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{gp.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {gp.passType || 'Returnable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{gp.items?.length || 0} items</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${gp.status === 'active' ? 'bg-[#E6F4EA] text-success' : 'bg-[#FCE8E6] text-danger'}`}>
                        {gp.status.charAt(0).toUpperCase() + gp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => setSelectedGatePass(gp)} className="text-slate-400 hover:text-brand-denim" title="View & Download PDF">
                        <Download size={18} />
                      </button>
                      <button onClick={() => setEditingGatePass(gp)} className="text-slate-400 hover:text-brand-navy" title="Edit Gate Pass">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(gp._id)} className="text-slate-400 hover:text-danger" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && gatePasses.length > 0 && (
          <div className="bg-white px-6 py-3 border-t border-border-subtle flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{gatePasses.length}</span> of <span className="font-medium">{gatePasses.length}</span> results
            </div>
          </div>
        )}
      </div>

      {selectedGatePass && (
        <GatePassPreviewModal
          gatePass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

      {editingGatePass && (
        <EditGatePassModal
          gatePass={editingGatePass}
          onClose={() => setEditingGatePass(null)}
          onSuccess={() => fetchGatePasses(search)}
        />
      )}
    </div>
  );
};

export default ManageGatePass;
