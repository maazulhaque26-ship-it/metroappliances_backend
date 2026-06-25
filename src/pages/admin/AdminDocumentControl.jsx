import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getDocuments, deleteDocument, approveDocument, activateDocument, obsoleteDocument } from '../../services/qmsAPI';

const STATUS_COLORS = { draft: 'gray', under_review: 'yellow', approved: 'blue', active: 'green', obsolete: 'red', superseded: 'gray' };

export default function AdminDocumentControl() {
  const [docs, setDocs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [docType, setDocType]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = () => {
    setLoading(true);
    getDocuments({ page, limit: 20, search, status, documentType: docType })
      .then(r => { setDocs(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, docType]);

  const handleConfirm = async () => {
    if (confirmAction === 'approve') await approveDocument(confirmId);
    else if (confirmAction === 'activate') await activateDocument(confirmId, {});
    else if (confirmAction === 'obsolete') await obsoleteDocument(confirmId);
    else if (confirmAction === 'delete') await deleteDocument(confirmId);
    setConfirmId(null);
    setConfirmAction(null);
    load();
  };

  const columns = [
    { header: 'Doc #', accessor: 'documentNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'documentType' },
    { header: 'Category', accessor: 'category' },
    { header: 'Revision', accessor: 'currentRevision' },
    { header: 'Owner', accessor: 'ownerName' },
    { header: 'Review Date', render: r => r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : '—' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-1 flex-wrap">
        {r.status === 'under_review' && <button onClick={() => { setConfirmId(r._id); setConfirmAction('approve'); }} className="text-blue-500 text-xs">Approve</button>}
        {r.status === 'approved' && <button onClick={() => { setConfirmId(r._id); setConfirmAction('activate'); }} className="text-green-500 text-xs">Activate</button>}
        {r.status === 'active' && <button onClick={() => { setConfirmId(r._id); setConfirmAction('obsolete'); }} className="text-yellow-500 text-xs">Obsolete</button>}
        <button onClick={() => { setConfirmId(r._id); setConfirmAction('delete'); }} className="text-red-500 text-xs">Delete</button>
      </div>
    )},
  ];

  const actionLabel = { approve: 'Approve', activate: 'Activate', obsolete: 'Obsolete', delete: 'Delete' };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Document Control</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search documents..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'under_review', label: 'Under Review' }, { value: 'approved', label: 'Approved' }, { value: 'active', label: 'Active' }, { value: 'obsolete', label: 'Obsolete' }]} />
        <FilterToolbar label="Type" value={docType} onChange={v => { setDocType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'procedure', label: 'Procedure' }, { value: 'work_instruction', label: 'Work Instruction' }, { value: 'policy', label: 'Policy' }, { value: 'specification', label: 'Specification' }]} />
      </div>
      {loading ? <LoadingState /> : docs.length === 0 ? <EmptyState message="No documents found." /> : (
        <>
          <DataTable columns={columns} data={docs} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!confirmId}
        title={`${actionLabel[confirmAction] || ''} Document`}
        message="Are you sure you want to proceed?"
        onConfirm={handleConfirm} onCancel={() => { setConfirmId(null); setConfirmAction(null); }} />
    </div>
  );
}
