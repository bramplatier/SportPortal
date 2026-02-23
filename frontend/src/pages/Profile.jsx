import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    current_password: '',
    new_password: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient.get('/auth/me');
        setProfile(data.user);
        setForm((f) => ({ ...f, name: data.user.name, email: data.user.email }));
      } catch (err) {
        setError('Kon profiel niet laden.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        name: form.name,
        email: form.email,
        current_password: form.current_password,
      };
      if (form.new_password) {
        payload.new_password = form.new_password;
      }

      const data = await apiClient.put('/auth/profile', payload);
      setMessage('Profiel succesvol bijgewerkt!');
      setProfile((p) => ({ ...p, name: data.user.name, email: data.user.email }));
      setEditMode(false);
      setForm((f) => ({ ...f, current_password: '', new_password: '' }));

      // Update de AuthContext user
      if (setUser) {
        setUser((prev) => ({ ...prev, name: data.user.name, email: data.user.email }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Profiel laden...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="alert alert-error">Profiel kon niet worden geladen.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>👤 Mijn Profiel</h2>
        <p>Bekijk en bewerk je accountgegevens.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">
            <span className="avatar-icon">👤</span>
            <h3>{profile.name}</h3>
            <span className={`role-badge role-${profile.role}`}>
              {profile.role === 'admin' ? '🛡️ Beheerder' : '🏃 Lid'}
            </span>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-number">{profile.registration_count || 0}</span>
              <span className="stat-label">Inschrijvingen</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{profile.request_count || 0}</span>
              <span className="stat-label">Aanvragen</span>
            </div>
          </div>

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">📧 E-mail</span>
              <span className="info-value">{profile.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">📅 Lid sinds</span>
              <span className="info-value">
                {new Date(profile.created_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {!editMode && (
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>
              ✏️ Profiel bewerken
            </button>
          )}
        </div>

        {editMode && (
          <div className="profile-edit-card">
            <h3>Profiel Bewerken</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Naam</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <hr />

              <div className="form-group">
                <label>Huidig wachtwoord *</label>
                <input
                  type="password"
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  required
                  placeholder="Vereist om wijzigingen op te slaan"
                />
              </div>

              <div className="form-group">
                <label>Nieuw wachtwoord (optioneel)</label>
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  placeholder="Laat leeg om niet te wijzigen"
                  minLength={8}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Opslaan...' : '💾 Opslaan'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditMode(false);
                    setForm({
                      name: profile.name,
                      email: profile.email,
                      current_password: '',
                      new_password: '',
                    });
                    setError('');
                  }}
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
