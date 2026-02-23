import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const CATEGORY_LABELS = {
  general: { label: 'Algemeen', icon: '📢', className: 'cat-general' },
  schedule: { label: 'Rooster', icon: '📅', className: 'cat-schedule' },
  maintenance: { label: 'Onderhoud', icon: '🔧', className: 'cat-maintenance' },
  event: { label: 'Evenement', icon: '🎉', className: 'cat-event' },
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await apiClient.get('/announcements');
        setAnnouncements(data.announcements);
      } catch (err) {
        setError('Kon mededelingen niet laden.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Mededelingen laden...</p>
      </div>
    );
  }

  const pinned = announcements.filter((a) => a.is_pinned);
  const regular = announcements.filter((a) => !a.is_pinned);

  return (
    <div className="page">
      <div className="page-header">
        <h2>📢 Mededelingen</h2>
        <p>Belangrijk nieuws en updates van SportPortal.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {announcements.length === 0 ? (
        <div className="empty-state">
          <p>📭 Er zijn op dit moment geen mededelingen.</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="announcements-section">
              <h3 className="section-label">📌 Vastgepind</h3>
              <div className="announcements-list">
                {pinned.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div className="announcements-section">
              {pinned.length > 0 && <h3 className="section-label">Overige mededelingen</h3>}
              <div className="announcements-list">
                {regular.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }) {
  const cat = CATEGORY_LABELS[announcement.category] || CATEGORY_LABELS.general;

  return (
    <div className={`announcement-card ${announcement.is_pinned ? 'pinned' : ''}`}>
      <div className="announcement-card-header">
        <span className={`announcement-category ${cat.className}`}>
          {cat.icon} {cat.label}
        </span>
        {announcement.is_pinned && <span className="pin-badge">📌 Vastgepind</span>}
      </div>

      <h3 className="announcement-title">{announcement.title}</h3>
      <p className="announcement-content">{announcement.content}</p>

      <div className="announcement-footer">
        <span className="announcement-author">
          Door: {announcement.author_name || 'Beheerder'}
        </span>
        <span className="announcement-date">
          {new Date(announcement.created_at).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
