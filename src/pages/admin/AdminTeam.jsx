import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiUpload, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

function TeamForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing || { name: '', designation: '', bio: '', linkedin: '', displayOrder: 0, isActive: true }
  );
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(existing?.photo ? imgSrc(existing.photo) : null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      let res;
      if (existing?._id) {
        res = await API.put(`/admin/team/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!photo) return toast.error('Profile photo is required');
        res = await API.post('/admin/team', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.member);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving team member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/80 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#666666] hover:text-[#111111] transition-colors"><FiX size={24} /></button>
        <h2 className="text-2xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>{existing ? 'Edit Member' : 'Add Team Member'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="w-24 h-24 bg-[#F7F6F3] border border-[#E5E5E5] flex items-center justify-center overflow-hidden flex-shrink-0">
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiUsers size={24} className="text-[#CCCCCC]" />
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 border border-[#111111] text-[10px] font-bold uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center gap-2">
                <FiUpload size={14} /> Upload Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0];
                if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)); }
              }} />
              <p className="text-xs text-[#666666] mt-2">Square image recommended (min 800x800)</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Designation *</label>
              <input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} required className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Short Bio *</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} required rows={3} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none"></textarea>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">LinkedIn URL</label>
            <input type="url" value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: e.target.value }))} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Status</label>
              <select value={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="w-full sm:w-auto px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchTeam = async () => {
    try {
      const res = await API.get('/admin/team');
      setTeam(res.data.team);
    } catch (err) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const deleteMember = async (id) => {
    if (!window.confirm('Delete this team member?')) return;
    try {
      await API.delete(`/admin/team/${id}`);
      toast.success('Deleted');
      setTeam(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Team Management</h1>
            <p className="text-[#666666] text-sm font-medium mt-1">Manage team members displayed on the About page.</p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={16} /> Add Member
          </button>
        </div>

        <div className="bg-white border border-[#E5E5E5]">
          {loading ? (
            <div className="p-8 text-center text-[#666666]">Loading...</div>
          ) : team.length === 0 ? (
            <div className="p-16 text-center bg-[#F7F6F3]">
              <FiUsers size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <div className="text-[#666666] text-sm font-medium">No team members found.</div>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {team.map(m => (
                <div key={m._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#F7F6F3] transition-colors">
                  <div className="flex items-center gap-6">
                    <img src={imgSrc(m.photo)} alt="" className="w-16 h-16 object-cover bg-white border border-[#E5E5E5] p-1" />
                    <div>
                      <h3 className="text-[#111111] font-bold text-lg leading-none mb-2">{m.name}</h3>
                      <p className="text-[#FF7A00] text-[10px] font-bold uppercase tracking-widest mb-1">{m.designation}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${m.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                        <span className="text-[#666666] text-xs font-medium">Order: {m.displayOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => { setEditing(m); setShowForm(true); }} className="p-3 text-[#666666] hover:text-[#111111] hover:bg-[#E5E5E5] transition-colors" title="Edit">
                      <FiEdit2 size={18} />
                    </button>
                    <button onClick={() => deleteMember(m._id)} className="p-3 text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showForm && (
        <TeamForm 
          existing={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={(member) => {
            if (editing) setTeam(prev => prev.map(m => m._id === member._id ? member : m).sort((a, b) => a.displayOrder - b.displayOrder));
            else setTeam(prev => [...prev, member].sort((a, b) => a.displayOrder - b.displayOrder));
            setShowForm(false);
          }} 
        />
      )}
    </AdminLayout>
  );
}
