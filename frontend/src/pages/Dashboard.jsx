import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import LessonCard from '../components/LessonCard';

export default function Dashboard() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchLessons = async () => {
    try {
      const data = await apiClient.get('/lessons');
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

  const handleToggle = async (lesson) => {
    setTogglingId(lesson.id);
    setMessage('');
    setError('');

    try {
      if (lesson.is_registered) {
        await apiClient.delete(`/registrations/${lesson.id}`);
        setMessage(`Afgemeld voor ${lesson.name}.`);
      } else {
        await apiClient.post(`/registrations/${lesson.id}`);
        setMessage(`Ingeschreven voor ${lesson.name}!`);
      }
      await fetchLessons();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Lessen laden...</p>
      </div>
    );
  }

  // Groepeer lessen per dag
  const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
  const grouped = days
    .map((day) => ({
      day,
      lessons: lessons.filter((l) => l.day_of_week === day),
    }))
    .filter((g) => g.lessons.length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alle Groepslessen</h2>
        <p>Bekijk het aanbod en schrijf je in voor een les.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {grouped.map(({ day, lessons: dayLessons }) => (
        <div key={day} className="day-group">
          <h3 className="day-title">{day}</h3>
          <div className="lessons-grid">
            {dayLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onToggle={handleToggle}
                loading={togglingId === lesson.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
