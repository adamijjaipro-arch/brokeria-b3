import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/layout/AppLayout';
import { formationApi } from '../../../api';
import PageSEO from '../../../components/seo/PageSEO';
import { SITE_URL } from '../../../lib/seo';
import type { CourseDetail, Lesson, CourseLevel } from '../../../types/formation';

const LEVEL_CONFIG: Record<CourseLevel, { label: string; color: string; bg: string }> = {
  DEBUTANT:      { label: 'Débutant',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  INTERMEDIAIRE: { label: 'Intermédiaire', color: '#2563eb', bg: 'rgba(37,99,235,0.12)'   },
  AVANCE:        { label: 'Avancé',        color: '#7c3aed', bg: 'rgba(124,58,237,0.12)'  },
  EXPERT:        { label: 'Expert',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};

const TYPE_ICON: Record<string, string> = {
  VIDEO:   '▶',
  ARTICLE: '📄',
  QUIZ:    '❓',
};

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
}

const CourseDetailPage: NextPage = () => {
  const router = useRouter();
  const courseId = typeof router.query.courseId === 'string' ? router.query.courseId : null;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    formationApi.getCourseById(courseId)
      .then((res) => setCourse(res.data as CourseDetail))
      .catch(() => setError('Cours introuvable.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <AppLayout>
        <Head><title>Chargement… — Alvio</title></Head>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {[200, 120, 400].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#1A1A1A 25%,#222222 50%,#1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <button onClick={() => router.push('/formation')} style={{ background: 'none', border: 'none', color: '#888888', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>
          ← Formation
        </button>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 12, padding: 20, color: '#ef4444' }}>
          ⚠️ {error ?? 'Cours introuvable.'}
        </div>
      </AppLayout>
    );
  }

  const cfg = LEVEL_CONFIG[course.level];

  return (
    <AppLayout>
      <PageSEO
        title={`${course.title} — Formation Alvio`}
        description={`Cours "${course.title}" sur Alvio. Formation trading algorithmique avec contenu structuré, exercices pratiques et suivi de progression.`}
        canonical={`${SITE_URL}/formation/${router.query.courseId}`}
        ogImage={`${SITE_URL}/og-formation.png`}
      />
      <Head><title>{course.title} — Alvio</title></Head>

      {/* ── Back ──────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/formation')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#888888', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        ← Tous les cours
      </button>

      {/* ── Header cours ──────────────────────────────────────── */}
      <div style={{ background: '#111111', borderRadius: 20, padding: '28px 32px', marginBottom: 24, border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {course.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail} alt={course.title} style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 12px', borderRadius: 99 }}>{cfg.label}</span>
              <span style={{ fontSize: 12, color: '#555555', background: '#1A1A1A', padding: '3px 12px', borderRadius: 99 }}>{course.category}</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
              {course.title}
            </h1>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#888888', lineHeight: 1.6 }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#555555', flexWrap: 'wrap' }}>
              <span>📚 {course.totalLessons} leçons</span>
              <span>⏱ {fmtDuration(course.duration)}</span>
              <span>✅ {course.completedLessons} complétée{course.completedLessons > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Progression circulaire */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#222222" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={course.progressPercent === 100 ? '#22c55e' : '#2563eb'} strokeWidth="7"
                strokeDasharray={`${(course.progressPercent / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FFFFFF">
                {course.progressPercent}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Liste des leçons ──────────────────────────────────── */}
      <div style={{ background: '#111111', borderRadius: 16, overflow: 'hidden', border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1A1A1A' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Leçons du cours</h2>
        </div>

        {course.lessons.map((lesson: Lesson, idx: number) => {
          const isCompleted = lesson.completed === true;
          const isFirst = idx === 0;
          const prevCompleted = idx === 0 || course.lessons[idx - 1].completed;
          const isAccessible = isFirst || prevCompleted;

          return (
            <div
              key={lesson.id}
              onClick={() => isAccessible && router.push(`/formation/${course.id}/${lesson.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 24px',
                borderBottom: idx < course.lessons.length - 1 ? '1px solid #141414' : 'none',
                cursor: isAccessible ? 'pointer' : 'not-allowed',
                opacity: isAccessible ? 1 : 0.5,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (isAccessible) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Numéro / check */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isCompleted ? '#22c55e' : isAccessible ? 'rgba(37,99,235,0.12)' : '#1A1A1A',
                color: isCompleted ? '#fff' : isAccessible ? '#2563eb' : '#333333',
                fontSize: isCompleted ? 16 : 14, fontWeight: 700,
              }}>
                {isCompleted ? '✓' : idx + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: '#444444' }}>
                    {TYPE_ICON[lesson.type]} {lesson.type}
                  </span>
                  <span style={{ fontSize: 11, color: '#444444' }}>· {fmtDuration(lesson.duration)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: isCompleted ? 600 : 500, color: isCompleted ? '#22c55e' : '#FFFFFF', lineHeight: 1.3 }}>
                  {lesson.title}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#444444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60ch' }}>
                  {lesson.description}
                </p>
              </div>

              {isAccessible && (
                <svg width="16" height="16" fill="none" stroke="#444444" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default CourseDetailPage;
