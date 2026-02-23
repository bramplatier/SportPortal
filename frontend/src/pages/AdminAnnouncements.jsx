import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const CATEGORIES = [
  { value: 'general', label: '📢 Algemeen' },
  { value: 'schedule', label: '📅 Rooster' },
  { value: 'maintenance', label: '🔧 Onderhoud' },
  { value: 'event', label: '🎉 Evenement' },
];

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    title: '',
    content: '',
    category: 'general',
    is_pinned: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient.get('/admin/announcements');
      setAnnouncements(data.announcements);
    } catch (err) {
      setError('Kon mededelingen niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (a) => {
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      is_pinned: !!a.is_pinned,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await apiClient.put(`/admin/announcements/${editingId}`, form);
        setMessage('Mededeling bijgewerkt.');
      } else {
        await apiClient.post('/admin/announcements', form);
        setMessage('Mededeling aangemaakt!');
      }
      resetForm();
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Weet je zeker dat je deze mededeling wilt verwijderen?')) return;
    setError('');
    setMessage('');
    try {
      await apiClient.delete(`/admin/announcements/${id}`);
      setMessage('Mededeling verwijderd.');
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Mededelingen laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📢 Mededelingen Beheren</h2>
        <p>Maak mededelingen aan voor alle leden.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingId ? '✕ Sluiten' : '➕ Nieuwe Mededeling'}
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="request-form-card">
          <h3>{editingId ? 'Mededeling Bewerken' : 'Nieuwe Mededeling'}</h3>
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
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label>Inhoud</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                minLength={10}
                maxLength={5000}
                rows={5}
              />
            </div>

            <div className="form-group form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                />
                📌 Vastpinnen (bovenaan tonen)
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? 'Opslaan...'
                  : editingId
                  ? '💾 Bijwerken'
                  : '📢 Publiceren'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="empty-state">
          <p>📭 Nog geen mededelingen.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>📌</th>
                <th>Categorie</th>
                <th>Titel</th>
                <th>Inhoud</th>
                <th>Datum</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => {
                const cat = CATEGORIES.find((c) => c.value === a.category);
                return (
                  <tr key={a.id} className={a.is_pinned ? 'row-pinned' : ''}>
                    <td>{a.is_pinned ? '📌' : ''}</td>
                    <td>{cat?.label || a.category}</td>
                    <td><strong>{a.title}</strong></td>
                    <td>
                      <div className="truncate-text">{a.content}</div>
                    </td>
                    <td>
                      {new Date(a.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(a)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(a.id)}
                        >
                          🗑️
                        </button>
                      </div>
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
