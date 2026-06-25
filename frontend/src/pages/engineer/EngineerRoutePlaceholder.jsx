import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiNavigation, FiList } from 'react-icons/fi';

export default function EngineerRoutePlaceholder() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 720 }}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <FiMapPin size={24} color="#059669" />
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Route Planner</h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, maxWidth: 560 }}>
          Route optimization is reserved for the maps integration phase. Installation jobs already carry customer address, city, pincode, and engineer GPS-ready fields.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link to="/engineer/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#059669', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            <FiList size={14} /> View Jobs
          </Link>
          <button type="button" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#F3F4F6', color: '#9CA3AF', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
            <FiNavigation size={14} /> Maps Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
