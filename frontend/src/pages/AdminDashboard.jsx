import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [popularLessons, setPopularLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get('/admin/stats');
        setStats(data.stats);
        setPopularLessons(data.popularLessons);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Dashboard laden...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>⚙️ Admin Dashboard</h2>
        <p>Beheer lessen, gebruikers en bekijk statistieken.</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-info">
              <span className="stat-number">{stats.users}</span>
              <span className="stat-label">Gebruikers</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-info">
              <span className="stat-number">{stats.lessons}</span>
              <span className="stat-label">Groepslessen</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <span className="stat-number">{stats.registrations}</span>
              <span className="stat-label">Inschrijvingen</span>
            </div>
          </div>
        </div>
      )}

      {popularLessons.length > 0 && (
        <div className="admin-section">
          <h3>Populairste Lessen</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Les</th>
                  <th>Dag</th>
                  <th>Tijd</th>
                  <th>Deelnemers</th>
                  <th>Bezetting</th>
                </tr>
              </thead>
              <tbody>
                {popularLessons.map((lesson, i) => {
                  const pct = lesson.max_participants > 0
                    ? Math.round((lesson.participants / lesson.max_participants) * 100)
                    : 0;
                  return (
                    <tr key={i}>
                      <td><strong>{lesson.name}</strong></td>
                      <td>{lesson.day_of_week}</td>
                      <td>{lesson.start_time}</td>
                      <td>{lesson.participants} / {lesson.max_participants}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${pct >= 90 ? 'progress-danger' : pct >= 60 ? 'progress-warning' : ''}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="progress-label">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
