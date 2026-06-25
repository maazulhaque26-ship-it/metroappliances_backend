import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPaperclip, FiImage, FiFile, FiVideo, FiExternalLink, FiDownload } from 'react-icons/fi';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

const TYPE_ICON = {
  image: <FiImage size={18} style={{ color: '#3B82F6' }} />,
  video: <FiVideo size={18} style={{ color: '#8B5CF6' }} />,
  document: <FiFile size={18} style={{ color: '#EF4444' }} />,
  invoice: <FiFile size={18} style={{ color: '#F59E0B' }} />,
};

export default function CustomerServiceDocuments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/service/requests?limit=50')
      .then(r => {
        const data = r.data.data || [];
        setRequests(data.filter(sr => sr.attachments?.length > 0 || sr.technicianPhotos?.length > 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allDocs = requests.flatMap(sr =>
    [
      ...(sr.attachments || []).map(att => ({ ...att, ticketNumber: sr.ticketNumber, srId: sr._id, source: 'customer' })),
      ...(sr.technicianPhotos || []).map(url => ({
        url, type: 'image', filename: 'Technician Photo', uploadedBy: 'technician',
        ticketNumber: sr.ticketNumber, srId: sr._id, source: 'technician',
      })),
    ]
  );

  if (loading) return <LoadingState message="Loading documents..." />;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Service Documents</h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>All files and photos associated with your service requests.</p>
        </div>

        {!allDocs.length ? (
          <EmptyState
            icon={<FiPaperclip size={40} />}
            title="No documents yet"
            description="Attachments uploaded during service requests will appear here."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {allDocs.map((doc, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {/* Preview */}
                {doc.type === 'image' ? (
                  <div style={{ height: 140, borderRadius: 10, overflow: 'hidden', background: '#F3F4F6' }}>
                    <img src={doc.url} alt={doc.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ) : (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', borderRadius: 10 }}>
                    {TYPE_ICON[doc.type] || <FiFile size={40} style={{ color: '#9CA3AF' }} />}
                  </div>
                )}

                {/* Info */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.filename || `${doc.type} file`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                    Ticket: <Link to={`/my-service/track/${doc.srId}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{doc.ticketNumber}</Link>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'capitalize' }}>
                    By: {doc.uploadedBy}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '7px 10px', background: '#F3F4F6', borderRadius: 8, fontSize: 12, color: 'var(--text)',
                    textDecoration: 'none', fontWeight: 600,
                  }}>
                    <FiExternalLink size={12} /> View
                  </a>
                  <a href={doc.url} download style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '7px 10px', background: 'var(--accent)', borderRadius: 8, fontSize: 12, color: '#fff',
                    textDecoration: 'none', fontWeight: 600,
                  }}>
                    <FiDownload size={12} /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
