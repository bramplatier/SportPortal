import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function MyLessons() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchRegistrations = async () => {
    try {
      const data = await apiClient.get('/registrations');
      setRegistrations(data.registrations);
    } catch (err) {
      setError('Kon inschrijvingen niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleUnregister = async (reg) => {
    setRemovingId(reg.lesson_id);
    setMessage('');
    setError('');

    try {
      await apiClient.delete(`/registrations/${reg.lesson_id}`);
      setMessage(`Afgemeld voor ${reg.name}.`);
      await fetchRegistrations();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Inschrijvingen laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Mijn Inschrijvingen</h2>
        <p>Hier zie je voor welke lessen je staat ingeschreven.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {registrations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>Nog geen inschrijvingen</h3>
          <p>Je bent nog niet ingeschreven voor een les.</p>
          <Link to="/" className="btn btn-primary">
            Bekijk beschikbare lessen
          </Link>
        </div>
      ) : (
        <div className="registrations-list">
          <div className="registrations-count">
            <strong>{registrations.length}</strong> {registrations.length === 1 ? 'les' : 'lessen'}
          </div>

          {registrations.map((reg) => (
            <div key={reg.registration_id} className="registration-card">
              <div className="registration-info">
                <h3>{reg.name}</h3>
                {reg.description && <p className="reg-description">{reg.description}</p>}
                <div className="reg-details">
                  <span>📅 {reg.day_of_week}</span>
                  <span>🕐 {reg.start_time} - {reg.end_time}</span>
                  <span>👨‍🏫 {reg.instructor}</span>
                  <span>📍 {reg.location}</span>
                  <span>👥 {reg.current_participants}/{reg.max_participants}</span>
                </div>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleUnregister(reg)}
                disabled={removingId === reg.lesson_id}
              >
                {removingId === reg.lesson_id ? 'Bezig...' : '❌ Afmelden'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
