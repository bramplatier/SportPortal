import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In behandeling' },
  { value: 'approved', label: 'Goedgekeurd' },
  { value: 'denied', label: 'Afgewezen' },
  { value: 'completed', label: 'Afgehandeld' },
];

const STATUS_LABELS = {
  open: { label: 'Open', className: 'status-open' },
  in_progress: { label: 'In behandeling', className: 'status-progress' },
  approved: { label: 'Goedgekeurd', className: 'status-approved' },
  denied: { label: 'Afgewezen', className: 'status-denied' },
  completed: { label: 'Afgehandeld', className: 'status-completed' },
};

const CATEGORY_LABELS = {
  equipment: '🏋️ Apparatuur',
  facility: '🏢 Faciliteiten',
  lesson: '📋 Les / Rooster',
  other: '💬 Overig',
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', admin_response: '' });
  const [filterStatus, setFilterStatus] = useState('');

  const fetchRequests = async () => {
    try {
      const data = await apiClient.get('/admin/requests');
      setRequests(data.requests);
    } catch (err) {
      setError('Kon aanvragen niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleEdit = (req) => {
    setEditingId(req.id);
    setEditForm({
      status: req.status,
      admin_response: req.admin_response || '',
    });
  };

  const handleUpdate = async (id) => {
    setError('');
    setMessage('');
    try {
      await apiClient.put(`/admin/requests/${id}`, editForm);
      setMessage('Aanvraag bijgewerkt.');
      setEditingId(null);
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Weet je zeker dat je deze aanvraag wilt verwijderen?')) return;
    setError('');
    setMessage('');
    try {
      await apiClient.delete(`/admin/requests/${id}`);
      setMessage('Aanvraag verwijderd.');
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Aanvragen laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 Aanvragen Beheren</h2>
        <p>Bekijk en behandel aanvragen van leden.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Status filter */}
      <div className="filter-row" style={{ marginBottom: '1.5rem' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Alle statussen ({requests.length})</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} ({requests.filter((r) => r.status === s.value).length})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>📭 Geen aanvragen gevonden.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Lid</th>
                <th>Categorie</th>
                <th>Titel</th>
                <th>Beschrijving</th>
                <th>Status</th>
                <th>Datum</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const status = STATUS_LABELS[req.status] || STATUS_LABELS.open;
                const isEditing = editingId === req.id;

                return (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.user_name}</strong>
                      <br />
                      <small>{req.user_email}</small>
                    </td>
                    <td>{CATEGORY_LABELS[req.category] || req.category}</td>
                    <td>{req.title}</td>
                    <td>
                      <div className="truncate-text">{req.description}</div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({ ...editForm, status: e.target.value })
                          }
                          className="filter-select"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`request-status ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                    </td>
                    <td>
                      {new Date(req.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="admin-actions-col">
                          <textarea
                            value={editForm.admin_response}
                            onChange={(e) =>
                              setEditForm({ ...editForm, admin_response: e.target.value })
                            }
                            placeholder="Reactie voor het lid..."
                            rows={2}
                            className="inline-textarea"
                          />
                          <div className="btn-group">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdate(req.id)}
                            >
                              💾 Opslaan
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingId(null)}
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="btn-group">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEdit(req)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(req.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
