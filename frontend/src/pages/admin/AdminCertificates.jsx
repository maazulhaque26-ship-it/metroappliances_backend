import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getCertificates, issueCertificate, revokeCertificate, deleteCertificate } from '../../services/qmsAPI';

const STATUS_COLORS = { draft: 'gray', issued: 'green', expired: 'yellow', revoked: 'red' };

export default function AdminCertificates() {
  const [certs, setCerts]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [certType, setCertType] = useState('');
  const [loading, setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = () => {
    setLoading(true);
    getCertificates({ page, limit: 20, search, status, certificateType: certType })
      .then(r => { setCerts(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, certType]);

  const handleConfirm = async () => {
    if (confirmAction === 'issue') await issueCertificate(confirmId);
    else if (confirmAction === 'revoke') await revokeCertificate(confirmId, { reason: 'Revoked by admin' });
    else if (confirmAction === 'delete') await deleteCertificate(confirmId);
    setConfirmId(null);
    setConfirmAction(null);
    load();
  };

  const columns = [
    { header: 'Cert #', accessor: 'certificateNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'certificateType' },
    { header: 'Reference', accessor: 'referenceType' },
    { header: 'Issue Date', render: r => r.issueDate ? new Date(r.issueDate).toLocaleDateString() : '—' },
    { header: 'Expiry', render: r => r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-2">
        {r.status === 'draft' && <button onClick={() => { setConfirmId(r._id); setConfirmAction('issue'); }} className="text-green-600 hover:text-green-800 text-sm">Issue</button>}
        {r.status === 'issued' && <button onClick={() => { setConfirmId(r._id); setConfirmAction('revoke'); }} className="text-yellow-600 hover:text-yellow-800 text-sm">Revoke</button>}
        <button onClick={() => { setConfirmId(r._id); setConfirmAction('delete'); }} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Quality Certificates</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search certificates..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'issued', label: 'Issued' }, { value: 'expired', label: 'Expired' }, { value: 'revoked', label: 'Revoked' }]} />
        <FilterToolbar label="Type" value={certType} onChange={v => { setCertType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'coa', label: 'COA' }, { value: 'conformance', label: 'Conformance' }, { value: 'calibration', label: 'Calibration' }, { value: 'test_report', label: 'Test Report' }]} />
      </div>
      {loading ? <LoadingState /> : certs.length === 0 ? <EmptyState message="No certificates found." /> : (
        <>
          <DataTable columns={columns} data={certs} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!confirmId}
        title={confirmAction === 'issue' ? 'Issue Certificate' : confirmAction === 'revoke' ? 'Revoke Certificate' : 'Delete Certificate'}
        message="Are you sure you want to proceed?"
        onConfirm={handleConfirm} onCancel={() => { setConfirmId(null); setConfirmAction(null); }} />
    </div>
  );
}
