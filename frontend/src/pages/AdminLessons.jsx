import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

const emptyLesson = {
  name: '',
  description: '',
  instructor: '',
  day_of_week: 'Maandag',
  start_time: '09:00',
  end_time: '10:00',
  max_participants: 20,
  location: '',
};

export default function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyLesson });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchLessons = async () => {
    try {
      const data = await apiClient.get('/admin/lessons');
      setLessons(data.lessons);
    } catch (err) {
      setError('Kon lessen niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'max_participants' ? parseInt(value) || '' : value,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyLesson });
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const openEdit = (lesson) => {
    setEditing(lesson.id);
    setForm({
      name: lesson.name,
      description: lesson.description || '',
      instructor: lesson.instructor,
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      max_participants: lesson.max_participants,
      location: lesson.location,
    });
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editing) {
        await apiClient.put(`/admin/lessons/${editing}`, form);
        setMessage('Les succesvol bijgewerkt.');
      } else {
        await apiClient.post('/admin/lessons', form);
        setMessage('Les succesvol aangemaakt.');
      }
      setShowForm(false);
      setEditing(null);
      await fetchLessons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Weet je zeker dat je "${lesson.name}" wilt verwijderen? Alle inschrijvingen worden ook verwijderd.`)) {
      return;
    }

    setDeletingId(lesson.id);
    setError('');
    setMessage('');

    try {
      const data = await apiClient.delete(`/admin/lessons/${lesson.id}`);
      setMessage(data.message);
      await fetchLessons();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Lessen laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>📋 Lessen Beheren</h2>
            <p>{lessons.length} {lessons.length === 1 ? 'les' : 'lessen'} in het systeem.</p>
          </div>
          {!showForm && (
            <button className="btn btn-primary" onClick={openCreate}>
              + Nieuwe Les
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? 'Les Bewerken' : 'Nieuwe Les Aanmaken'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Naam</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Bijv. Yoga" />
              </div>
              <div className="form-group">
                <label>Instructeur</label>
                <input name="instructor" value={form.instructor} onChange={handleChange} required placeholder="Bijv. Sophie Jansen" />
              </div>
            </div>

            <div className="form-group">
              <label>Beschrijving</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="2" placeholder="Optioneel: korte beschrijving van de les" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dag</label>
                <select name="day_of_week" value={form.day_of_week} onChange={handleChange}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Starttijd</label>
                <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Eindtijd</label>
                <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Locatie</label>
                <input name="location" value={form.location} onChange={handleChange} required placeholder="Bijv. Zaal A" />
              </div>
              <div className="form-group">
                <label>Max Deelnemers</label>
                <input type="number" name="max_participants" value={form.max_participants} onChange={handleChange} min="1" max="100" required />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Opslaan...' : editing ? 'Wijzigingen Opslaan' : 'Les Aanmaken'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Instructeur</th>
              <th>Dag</th>
              <th>Tijd</th>
              <th>Locatie</th>
              <th>Deelnemers</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson.id}>
                <td><strong>{lesson.name}</strong></td>
                <td>{lesson.instructor}</td>
                <td>{lesson.day_of_week}</td>
                <td>{lesson.start_time} - {lesson.end_time}</td>
                <td>{lesson.location}</td>
                <td>{lesson.current_participants} / {lesson.max_participants}</td>
                <td className="table-actions">
                  <button className="btn btn-small btn-edit" onClick={() => openEdit(lesson)}>
                    ✏️ Bewerken
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(lesson)}
                    disabled={deletingId === lesson.id}
                  >
                    {deletingId === lesson.id ? '...' : '🗑️ Verwijderen'}
                  </button>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr>
                <td colSpan="7" className="table-empty">Geen lessen gevonden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
