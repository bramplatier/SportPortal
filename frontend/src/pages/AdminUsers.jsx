import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const emptyUser = {
  name: '',
  email: '',
  password: '',
  role: 'customer',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyUser });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError('Kon gebruikers niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyUser });
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const openEdit = (user) => {
    setEditing(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
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
      const payload = { ...form };

      if (editing) {
        // Bij bewerken: wachtwoord alleen meesturen als het is ingevuld
        if (!payload.password) {
          delete payload.password;
        }
        await apiClient.put(`/admin/users/${editing}`, payload);
        setMessage('Gebruiker succesvol bijgewerkt.');
      } else {
        if (!payload.password) {
          setError('Wachtwoord is verplicht bij het aanmaken van een gebruiker.');
          setSaving(false);
          return;
        }
        await apiClient.post('/admin/users', payload);
        setMessage('Gebruiker succesvol aangemaakt.');
      }
      setShowForm(false);
      setEditing(null);
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Weet je zeker dat je "${user.name}" wilt verwijderen? Alle inschrijvingen van deze gebruiker worden ook verwijderd.`)) {
      return;
    }

    setDeletingId(user.id);
    setError('');
    setMessage('');

    try {
      const data = await apiClient.delete(`/admin/users/${user.id}`);
      setMessage(data.message);
      await fetchUsers();
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
        <p>Gebruikers laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>👥 Gebruikers Beheren</h2>
            <p>{users.length} {users.length === 1 ? 'gebruiker' : 'gebruikers'} in het systeem.</p>
          </div>
          {!showForm && (
            <button className="btn btn-primary" onClick={openCreate}>
              + Nieuwe Gebruiker
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker Aanmaken'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Naam</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Volledige naam" />
              </div>
              <div className="form-group">
                <label>E-mailadres</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@voorbeeld.nl" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Wachtwoord
                  {editing && <span className="label-hint"> (leeg laten = niet wijzigen)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editing ? 'Laat leeg om niet te wijzigen' : 'Min. 8 tekens, hoofdletter, cijfer'}
                  required={!editing}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="customer">Klant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Opslaan...' : editing ? 'Wijzigingen Opslaan' : 'Gebruiker Aanmaken'}
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
              <th>E-mail</th>
              <th>Rol</th>
              <th>Inschrijvingen</th>
              <th>Lid sinds</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-customer'}`}>
                    {user.role === 'admin' ? '🛡️ Admin' : '👤 Klant'}
                  </span>
                </td>
                <td>{user.registration_count}</td>
                <td>{new Date(user.created_at).toLocaleDateString('nl-NL')}</td>
                <td className="table-actions">
                  <button className="btn btn-small btn-edit" onClick={() => openEdit(user)}>
                    ✏️ Bewerken
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(user)}
                    disabled={deletingId === user.id}
                  >
                    {deletingId === user.id ? '...' : '🗑️ Verwijderen'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="table-empty">Geen gebruikers gevonden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
