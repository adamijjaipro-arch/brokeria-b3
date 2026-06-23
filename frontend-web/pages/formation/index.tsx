import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import { formationApi } from '../../api';
import Image from 'next/image';
import PageSEO from '../../components/seo/PageSEO';
import { SITE_URL } from '../../lib/seo';
import type { Course, UserProgress, CourseLevel } from '../../types/formation';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<CourseLevel, { label: string; color: string; bg: string }> = {
  DEBUTANT:      { label: 'Débutant',      color: '#22c55e',  bg: 'rgba(34,197,94,0.10)'   },
  INTERMEDIAIRE: { label: 'Intermédiaire', color: '#3b82f6',  bg: 'rgba(59,130,246,0.10)'  },
  AVANCE:        { label: 'Avancé',        color: '#a78bfa',  bg: 'rgba(139,92,246,0.10)'  },
  EXPERT:        { label: 'Expert',        color: '#ef4444',  bg: 'rgba(239,68,68,0.10)'   },
};

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#ffffff" strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 65 65)" />
      <text x="65" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">{pct}%</text>
      <text x="65" y="80" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">complété</text>
    </svg>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 160, background: 'linear-gradient(90deg,#1A1A1A 25%,#222222 50%,#1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ height: 12, width: '35%', borderRadius: 99, background: '#222222', marginBottom: 10 }} />
        <div style={{ height: 18, width: '85%', borderRadius: 6,  background: '#1A1A1A', marginBottom: 8 }} />
        <div style={{ height: 13, width: '100%', borderRadius: 5, background: '#222222', marginBottom: 4 }} />
        <div style={{ height: 13, width: '70%',  borderRadius: 5, background: '#222222', marginBottom: 16 }} />
        <div style={{ height: 6, borderRadius: 99, background: '#1F1F1F' }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const FormationPage: NextPage = () => {
  const router = useRouter();
  const [courses,  setCourses]  = useState<Course[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([formationApi.getCourses(), formationApi.getMyProgress()]);
        setCourses(cRes.data as Course[]);
        setProgress(pRes.data as UserProgress);
      } catch {
        setError('Impossible de charger les formations. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped    = courses.reduce<Partial<Record<CourseLevel, Course[]>>>((acc, c) => {
    if (!acc[c.level]) acc[c.level] = [];
    acc[c.level]!.push(c);
    return acc;
  }, {});
  const levelOrder: CourseLevel[] = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT'];

  return (
    <AppLayout title="Formation" subtitle="Progressez du débutant à l'expert en trading">
      <PageSEO
        title="Formation Trading — Alvio"
        description="Formation trading Alvio. Apprenez les stratégies algorithmiques et l'analyse technique avec des cours structurés, des exercices pratiques et un suivi de progression."
        canonical={`${SITE_URL}/formation`}
        ogImage={`${SITE_URL}/og-formation.png`}
      />
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>

      {/* Bannière progression globale */}
      {progress && (
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <ProgressRing pct={progress.globalPercent} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
              Votre progression globale
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
              {progress.totalCompleted} leçon{progress.totalCompleted > 1 ? 's' : ''} complétée{progress.totalCompleted > 1 ? 's' : ''} sur {progress.totalLessons}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {progress.courseStats.map((cs) => (
                <div key={cs.courseId} onClick={() => router.push(`/formation/${cs.courseId}`)}
                  style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 14px', fontSize: 13, color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>
                  {cs.title.split(' ').slice(0, 3).join(' ')} — <strong>{cs.progressPercent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Grille cours par niveau */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        levelOrder.map((level) => {
          const lvlCourses = grouped[level];
          if (!lvlCourses?.length) return null;
          const cfg = LEVEL_CONFIG[level];
          return (
            <section key={level} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '4px 14px', borderRadius: 99 }}>{cfg.label}</span>
                <div style={{ flex: 1, height: 1, background: '#1F1F1F' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
                {lvlCourses.map((course) => (
                  <CourseCard key={course.id} course={course} cfg={cfg} onOpen={() => router.push(`/formation/${course.id}`)} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </AppLayout>
  );
};

// ── Course card ────────────────────────────────────────────────────────────────

interface CardProps {
  course: Course;
  cfg: { label: string; color: string; bg: string };
  onOpen: () => void;
}

function CourseCard({ course, cfg, onOpen }: CardProps) {
  return (
    <div onClick={onOpen}
      style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = '#2A2A2A'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#1F1F1F'; }}
    >
      {/* Thumbnail */}
      <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: cfg.bg }}>
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" fill="none" stroke={cfg.color} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
        )}
        {course.progressPercent === 100 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
            ✓ Terminé
          </div>
        )}
        {course.progressPercent > 0 && course.progressPercent < 100 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
            En cours
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 99 }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: '#555555' }}>{course.category}</span>
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", lineHeight: 1.3 }}>
          {course.title}
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#888888', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12, color: '#555555' }}>
          <span>📚 {course.totalLessons} leçons</span>
          <span>⏱ {fmtDuration(course.duration)}</span>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: '#888888' }}>{course.completedLessons}/{course.totalLessons}</span>
            <span style={{ fontWeight: 700, color: course.progressPercent > 0 ? '#3b82f6' : '#333333' }}>{course.progressPercent}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#1F1F1F', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${course.progressPercent}%`, background: course.progressPercent === 100 ? '#22c55e' : 'linear-gradient(90deg,#2563eb,#06b6d4)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormationPage;
