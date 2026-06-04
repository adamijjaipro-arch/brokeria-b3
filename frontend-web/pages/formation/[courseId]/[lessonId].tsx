import React, { useEffect, useState, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/layout/AppLayout';
import { formationApi } from '../../../api';
import type { LessonDetail } from '../../../types/formation';

// ── Markdown renderer ─────────────────────────────────────────────────────────
// Rendu minimal de markdown sans dépendance externe

function renderMarkdown(md: string): string {
  return md
    // Code blocks (triple backtick)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:10px;overflow-x:auto;font-size:13px;line-height:1.6;margin:16px 0"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:700;color:#111827;margin:20px 0 8px;font-family:\'Plus Jakarta Sans\',sans-serif">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 style="font-size:20px;font-weight:800;color:#111827;margin:28px 0 10px;font-family:\'Plus Jakarta Sans\',sans-serif">$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;font-family:\'Plus Jakarta Sans\',sans-serif">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Tables (simple)
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th style="padding:8px 14px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f3f4f6">${h.trim()}</th>`).join('');
      const trs = rows.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td style="padding:10px 14px;font-size:14px;color:#374151;border-bottom:1px solid #f9fafb">${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.07)"><thead><tr style="background:#fafafa">${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
    })
    // Unordered lists
    .replace(/^[-✅❌✓•] (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="margin:10px 0;padding-left:20px;list-style:disc">$&</ul>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0">')
    // Line breaks (double newline → paragraph)
    .replace(/\n\n/g, '</p><p style="margin:0 0 10px;line-height:1.7;color:#374151;font-size:15px">')
    // Single newline → <br>
    .replace(/\n/g, '<br>');
}

// ── Main page ─────────────────────────────────────────────────────────────────

const LessonPage: NextPage = () => {
  const router = useRouter();
  const { courseId, lessonId } = router.query;
  const cId = typeof courseId === 'string' ? courseId : null;
  const lId = typeof lessonId === 'string' ? lessonId : null;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [allLessons, setAllLessons] = useState<Array<{ id: string; title: string; completed: boolean; order: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charge la leçon + le cours pour la navigation
  useEffect(() => {
    if (!cId || !lId) return;
    const load = async () => {
      try {
        const [lessonRes, courseRes] = await Promise.all([
          formationApi.getLessonById(lId),
          formationApi.getCourseById(cId),
        ]);
        const l = lessonRes.data as LessonDetail;
        const c = courseRes.data as { lessons: Array<{ id: string; title: string; completed: boolean; order: number }> };
        setLesson(l);
        setAllLessons(c.lessons);
        const myProgress = c.lessons.find((x) => x.id === lId);
        setCompleted(myProgress?.completed ?? false);
      } catch {
        setError('Leçon introuvable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cId, lId]);

  const handleComplete = useCallback(async () => {
    if (!cId || !lId || completing || completed) return;
    setCompleting(true);
    try {
      await formationApi.markComplete(lId, cId);
      setCompleted(true);
    } catch {
      // keep existing state
    } finally {
      setCompleting(false);
    }
  }, [cId, lId, completing, completed]);

  if (loading) {
    return (
      <AppLayout>
        <Head><title>Chargement… — Alvio</title></Head>
        <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        <div style={{ maxWidth: 800 }}>
          {[40, 500, 100].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 12, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 16 }} />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error || !lesson) {
    return (
      <AppLayout>
        <button onClick={() => router.push(`/formation/${cId}`)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>
          ← Retour au cours
        </button>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, color: '#dc2626' }}>
          ⚠️ {error ?? 'Leçon introuvable.'}
        </div>
      </AppLayout>
    );
  }

  const currentIdx = allLessons.findIndex((l) => l.id === lId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <AppLayout>
      <Head><title>{lesson.title} — Alvio</title></Head>

      {/* ── Back ──────────────────────────────────────────────── */}
      <button
        onClick={() => router.push(`/formation/${cId}`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        ← {lesson.course.title}
      </button>

      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Header leçon ──────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
                <span>{lesson.type === 'VIDEO' ? '▶ Vidéo' : lesson.type === 'ARTICLE' ? '📄 Article' : '❓ Quiz'}</span>
                <span>·</span>
                <span>Leçon {currentIdx + 1}/{allLessons.length}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", lineHeight: 1.2 }}>
                {lesson.title}
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>{lesson.description}</p>
            </div>

            {/* Bouton "Marquer complété" */}
            <button
              onClick={handleComplete}
              disabled={completed || completing}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: completed ? 'default' : 'pointer',
                fontFamily: 'inherit',
                background: completed ? '#f0fdf4' : '#2563eb',
                color: completed ? '#10b981' : '#fff',
                transition: 'all 0.2s',
              }}
            >
              {completed ? (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Complétée !
                </>
              ) : completing ? (
                'Enregistrement…'
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Marquer comme complétée
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Lecteur vidéo YouTube ─────────────────────────── */}
        {lesson.type === 'VIDEO' && lesson.videoUrl && (
          <div style={{ marginBottom: 20, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`${lesson.videoUrl}?rel=0&modestbranding=1&color=white`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        )}

        {lesson.type === 'VIDEO' && !lesson.videoUrl && (
          <div style={{ marginBottom: 20, borderRadius: 16, background: '#1e293b', height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#64748b' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span style={{ fontSize: 14 }}>Vidéo à venir</span>
          </div>
        )}

        {/* ── Contenu markdown ──────────────────────────────── */}
        <div
          style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', lineHeight: 1.7, color: '#374151', fontSize: 15 }}
          dangerouslySetInnerHTML={{ __html: `<p style="margin:0 0 10px;line-height:1.7;color:#374151;font-size:15px">${renderMarkdown(lesson.content)}</p>` }}
        />

        {/* ── Navigation précédente / suivante ──────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => prevLesson && router.push(`/formation/${cId}/${prevLesson.id}`)}
            disabled={!prevLesson}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
              borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff',
              cursor: prevLesson ? 'pointer' : 'default', opacity: prevLesson ? 1 : 0.4,
              fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { if (prevLesson) e.currentTarget.style.borderColor = '#2563eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Précédent</div>
              <div style={{ fontSize: 13 }}>{prevLesson?.title ?? '—'}</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (nextLesson) {
                router.push(`/formation/${cId}/${nextLesson.id}`);
              } else {
                router.push(`/formation/${cId}`);
              }
            }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
              padding: '14px 20px', borderRadius: 12, border: 'none',
              background: nextLesson ? '#2563eb' : '#10b981',
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              color: '#fff', fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>
                {nextLesson ? 'Suivant' : 'Fin du cours'}
              </div>
              <div style={{ fontSize: 13 }}>{nextLesson ? nextLesson.title : '← Retour au cours'}</div>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nextLesson ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default LessonPage;
