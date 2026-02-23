export default function LessonCard({ lesson, onToggle, loading }) {
  const isFull = lesson.current_participants >= lesson.max_participants;
  const spotsLeft = lesson.max_participants - lesson.current_participants;

  return (
    <div className={`lesson-card ${lesson.is_registered ? 'registered' : ''}`}>
      <div className="lesson-header">
        <h3 className="lesson-name">{lesson.name}</h3>
        <span className={`lesson-badge ${lesson.is_registered ? 'badge-registered' : isFull ? 'badge-full' : 'badge-available'}`}>
          {lesson.is_registered ? 'Ingeschreven' : isFull ? 'Vol' : 'Beschikbaar'}
        </span>
      </div>

      {lesson.description && (
        <p className="lesson-description">{lesson.description}</p>
      )}

      <div className="lesson-details">
        <div className="lesson-detail">
          <span className="detail-icon">📅</span>
          <span>{lesson.day_of_week}</span>
        </div>
        <div className="lesson-detail">
          <span className="detail-icon">🕐</span>
          <span>{lesson.start_time} - {lesson.end_time}</span>
        </div>
        <div className="lesson-detail">
          <span className="detail-icon">👨‍🏫</span>
          <span>{lesson.instructor}</span>
        </div>
        <div className="lesson-detail">
          <span className="detail-icon">📍</span>
          <span>{lesson.location}</span>
        </div>
        <div className="lesson-detail">
          <span className="detail-icon">👥</span>
          <span>{lesson.current_participants} / {lesson.max_participants} deelnemers</span>
          {!lesson.is_registered && !isFull && spotsLeft <= 5 && (
            <span className="spots-warning"> (nog {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'}!)</span>
          )}
        </div>
      </div>

      <button
        className={`btn ${lesson.is_registered ? 'btn-danger' : 'btn-primary'}`}
        onClick={() => onToggle(lesson)}
        disabled={loading || (!lesson.is_registered && isFull)}
      >
        {loading
          ? 'Bezig...'
          : lesson.is_registered
          ? '❌ Afmelden'
          : isFull
          ? 'Vol'
          : '✅ Inschrijven'}
      </button>
    </div>
  );
}
