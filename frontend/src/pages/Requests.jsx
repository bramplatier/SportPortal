import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const CATEGORIES = [
  { value: 'equipment', label: '🏋️ Apparatuur / Materiaal' },
  { value: 'facility', label: '🏢 Faciliteiten' },
  { value: 'lesson', label: '📋 Les / Rooster' },
  { value: 'other', label: '💬 Overig' },
];

const STATUS_LABELS = {
  open: { label: 'Open', className: 'status-open' },
  in_progress: { label: 'In behandeling', className: 'status-progress' },
  approved: { label: 'Goedgekeurd', className: 'status-approved' },
  denied: { label: 'Afgewezen', className: 'status-denied' },
  completed: { label: 'Afgehandeld', className: 'status-completed' },
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    category: 'equipment',
    title: '',
    description: '',
  });

  const fetchRequests = async () => {
    try {
      const data = await apiClient.get('/requests');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await apiClient.post('/requests', form);
      setMessage('Aanvraag succesvol ingediend!');
      setForm({ category: 'equipment', title: '', description: '' });
      setShowForm(false);
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Weet je zeker dat je deze aanvraag wilt verwijderen?')) return;
    setError('');
    setMessage('');

    try {
      await apiClient.delete(`/requests/${id}`);
      setMessage('Aanvraag verwijderd.');
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

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
        <h2>Mijn Aanvragen</h2>
        <p>Vraag nieuwe apparatuur, faciliteiten of leswijzigingen aan.</p>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Sluiten' : '➕ Nieuwe Aanvraag'}
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="request-form-card">
          <h3>Nieuwe Aanvraag</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Categorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="filter-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Titel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Bijv. Nieuwe kettlebells, Extra yogamatten..."
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Beschrijving</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Beschrijf je aanvraag zo duidelijk mogelijk..."
                required
                minLength={10}
                maxLength={1000}
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Indienen...' : '📩 Indienen'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>📭 Je hebt nog geen aanvragen ingediend.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Eerste aanvraag indienen
          </button>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((req) => {
            const status = STATUS_LABELS[req.status] || STATUS_LABELS.open;
            const category = CATEGORIES.find((c) => c.value === req.category);

            return (
              <div key={req.id} className="request-card">
                <div className="request-card-header">
                  <div className="request-card-title">
                    <span className="request-category-tag">{category?.label || req.category}</span>
                    <h3>{req.title}</h3>
                  </div>
                  <span className={`request-status ${status.className}`}>{status.label}</span>
                </div>

                <p className="request-description">{req.description}</p>

                {req.admin_response && (
                  <div className="admin-response">
                    <strong>🛡️ Reactie beheerder:</strong>
                    <p>{req.admin_response}</p>
                  </div>
                )}

                <div className="request-card-footer">
                  <span className="request-date">
                    📅 {new Date(req.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {req.status === 'open' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(req.id)}
                    >
                      🗑️ Verwijderen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
