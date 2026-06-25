import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { FiTrash2, FiCheckCircle, FiXCircle, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = async () => {
    try {
      const res = await API.get('/admin/testimonials');
      setTestimonials(res.data);
    } catch (err) {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/testimonials/${id}/status`, { status });
      toast.success(`Testimonial ${status}`);
      fetchTestimonials();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    try {
      await API.delete(`/admin/testimonials/${id}`);
      toast.success('Deleted');
      fetchTestimonials();
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Customer Stories</h1>
          <p className="text-[#666666] text-sm font-medium mt-1">Manage user testimonials and approve them for the homepage.</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#F7F6F3] border border-[#E5E5E5]"></div>)}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-20 bg-[#F7F6F3] border border-[#E5E5E5]">
              <FiMessageSquare size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <div className="text-[#666666] text-sm font-medium">No testimonials found.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map(t => (
                <div key={t._id} className="p-6 bg-[#F7F6F3] border border-[#E5E5E5] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    {t.image ? (
                      <img src={imgSrc({ url: t.image })} alt="Profile" className="w-14 h-14 object-cover shrink-0 border border-[#E5E5E5] bg-white p-1" />
                    ) : (
                      <div className="w-14 h-14 bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-center font-bold text-lg shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[#111111] font-bold text-lg">{t.name} <span className="text-[#666666] font-bold uppercase tracking-widest text-[10px] ml-3">{t.city}</span></h3>
                      <p className="text-sm text-[#444444] mt-2 leading-relaxed">{t.text}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                      t.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      t.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {t.status}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {t.status !== 'approved' && (
                        <button onClick={() => updateStatus(t._id, 'approved')} className="flex-1 sm:flex-none p-3 text-green-700 hover:bg-green-50 border border-transparent hover:border-green-200 transition-colors flex items-center justify-center" title="Approve">
                          <FiCheckCircle size={18} />
                        </button>
                      )}
                      {t.status !== 'rejected' && (
                        <button onClick={() => updateStatus(t._id, 'rejected')} className="flex-1 sm:flex-none p-3 text-yellow-700 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-colors flex items-center justify-center" title="Reject">
                          <FiXCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => deleteTestimonial(t._id)} className="flex-1 sm:flex-none p-3 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors flex items-center justify-center" title="Delete">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
