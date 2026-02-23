import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import LessonCard from '../components/LessonCard';

export default function Dashboard() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Zoek- en filterstate
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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

  // Unieke instructeurs en dagen voor filters
  const instructors = useMemo(() => {
    const set = new Set(lessons.map((l) => l.instructor));
    return [...set].sort();
  }, [lessons]);

  // Gefilterde lessen
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.instructor.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q));

      const matchesDay = !filterDay || l.day_of_week === filterDay;
      const matchesInstructor = !filterInstructor || l.instructor === filterInstructor;

      let matchesStatus = true;
      if (filterStatus === 'registered') matchesStatus = l.is_registered;
      else if (filterStatus === 'available')
        matchesStatus = !l.is_registered && l.current_participants < l.max_participants;
      else if (filterStatus === 'full')
        matchesStatus = l.current_participants >= l.max_participants;

      return matchesSearch && matchesDay && matchesInstructor && matchesStatus;
    });
  }, [lessons, search, filterDay, filterInstructor, filterStatus]);

  const clearFilters = () => {
    setSearch('');
    setFilterDay('');
    setFilterInstructor('');
    setFilterStatus('');
  };

  const hasActiveFilters = search || filterDay || filterInstructor || filterStatus;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Lessen laden...</p>
      </div>
    );
  }

  // Groepeer gefilterde lessen per dag
  const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
  const grouped = days
    .map((day) => ({
      day,
      lessons: filteredLessons.filter((l) => l.day_of_week === day),
    }))
    .filter((g) => g.lessons.length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alle Groepslessen</h2>
        <p>Bekijk het aanbod en schrijf je in voor een les.</p>
      </div>

      {/* Zoekbalk en filters */}
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Zoek op naam, instructeur, locatie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="filter-select"
          >
            <option value="">Alle dagen</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="filter-select"
          >
            <option value="">Alle instructeurs</option>
            {instructors.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Alle statussen</option>
            <option value="registered">Ingeschreven</option>
            <option value="available">Beschikbaar</option>
            <option value="full">Vol</option>
          </select>

          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              ✕ Filters wissen
            </button>
          )}
        </div>

        <p className="search-results-count">
          {filteredLessons.length} {filteredLessons.length === 1 ? 'les' : 'lessen'} gevonden
          {hasActiveFilters ? ' (gefilterd)' : ''}
        </p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {grouped.length === 0 ? (
        <div className="empty-state">
          <p>🔍 Geen lessen gevonden met deze zoekcriteria.</p>
          <button className="btn btn-primary" onClick={clearFilters}>
            Filters wissen
          </button>
        </div>
      ) : (
        grouped.map(({ day, lessons: dayLessons }) => (
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
        ))
      )}
    </div>
  );
}
