/**
 * Seed — Formation Trading (LMS)
 *
 * 4 modules progressifs (Course) × 3 leçons (Lesson) = 12 leçons.
 * Chaque videoUrl a été vérifiée via l'API oEmbed de YouTube avant d'être
 * intégrée (vidéo publique, existante, en français). Format embed :
 * https://www.youtube.com/embed/<ID> (ID extrait de la vidéo watch?v=<ID>).
 */

import { PrismaClient, CourseLevel, LessonType } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 1 — Les Bases du Trading
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Les Bases du Trading',
    description:
      'Les fondamentaux indispensables avant de trader : ce qu’est un marché financier, comment lire un graphique en chandeliers, et comment repérer les niveaux clés de prix.',
    level: CourseLevel.DEBUTANT,
    category: 'Fondamentaux',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
    order: 1,
    isPublished: true,
    lessons: [
      {
        title: 'Qu’est-ce que le trading ?',
        description:
          'Introduction au trading : définition, marchés disponibles (crypto, forex, actions) et acteurs qui les animent. La base avant toute stratégie.',
        videoUrl: 'https://www.youtube.com/embed/DP2uI_nA05Q',
        content:
          'Le trading consiste à acheter et vendre des actifs financiers dans le but de réaliser un profit sur les variations de prix. Cette leçon présente les grandes familles de marchés (crypto, forex, actions, matières premières) et les acteurs qui les font vivre, des banques centrales aux traders particuliers.',
        duration: 12,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les chandeliers japonais',
        description:
          'Apprenez à lire une bougie japonaise (open, high, low, close) et à reconnaître les figures essentielles comme le doji ou le marteau.',
        videoUrl: 'https://www.youtube.com/embed/bs9Rb8xL8wk',
        content:
          'Les chandeliers japonais sont la représentation graphique la plus utilisée en analyse technique. Chaque bougie encode quatre informations (ouverture, plus haut, plus bas, clôture) et certaines formes récurrentes — doji, marteau, étoile filante — donnent des indices sur la psychologie du marché à un instant donné.',
        duration: 15,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Support et Résistance',
        description:
          'Les niveaux de support et résistance sont les piliers de toute analyse technique. Apprenez à les identifier et à construire une stratégie autour d’eux.',
        videoUrl: 'https://www.youtube.com/embed/CnRVH8AxQgw',
        content:
          'Un support est un niveau de prix où la demande freine la baisse ; une résistance, un niveau où l’offre freine la hausse. Plus un niveau a été testé, plus il est significatif — et un ancien support cassé devient souvent une résistance, et inversement.',
        duration: 14,
        order: 3,
        type: LessonType.VIDEO,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 2 — Analyse Technique
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Analyse Technique',
    description:
      'Passez au niveau supérieur avec les figures chartistes, les indicateurs techniques (RSI, MACD) et les retracements de Fibonacci pour affiner vos entrées.',
    level: CourseLevel.DEBUTANT,
    category: 'Analyse Technique',
    thumbnail: 'https://images.unsplash.com/photo-1642790551116-18e4f56b6c6a?w=600',
    order: 2,
    isPublished: true,
    lessons: [
      {
        title: 'Les figures chartistes',
        description:
          'Triangles, têtes-épaules, doubles sommets : apprenez à identifier les figures chartistes les plus fiables pour anticiper un mouvement.',
        videoUrl: 'https://www.youtube.com/embed/ZKe4KD2sEj8',
        content:
          'Les figures chartistes (tête-épaules, doubles sommets/creux, triangles) résultent de la répétition de comportements collectifs des traders sur le marché. Savoir les repérer permet d’anticiper une continuation ou un retournement de tendance avant qu’il ne se confirme.',
        duration: 16,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les indicateurs techniques (RSI, MACD)',
        description:
          'Le RSI et le MACD sont deux des indicateurs les plus utilisés en trading. Apprenez à les lire et à repérer les zones de surachat, de survente et les divergences.',
        videoUrl: 'https://www.youtube.com/embed/45J_2Oq3b6I',
        content:
          'Le RSI (Relative Strength Index) mesure la vitesse des mouvements de prix pour signaler des zones de surachat (>70) ou de survente (<30). Le MACD, lui, combine deux moyennes mobiles pour détecter des changements de tendance. Utilisés ensemble, ils permettent de confirmer un signal plutôt que d’agir sur un seul indicateur isolé.',
        duration: 18,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Fibonacci et retracements',
        description:
          'Les niveaux de Fibonacci (38,2 % / 50 % / 61,8 %) aident à repérer les zones de correction probable dans une tendance. Apprenez à les tracer et à les utiliser.',
        videoUrl: 'https://www.youtube.com/embed/xF60RynBFIg',
        content:
          'Les retracements de Fibonacci partent du principe qu’après un mouvement fort, le prix corrige souvent vers des niveaux mathématiques précis (38,2 %, 50 %, 61,8 %) avant de reprendre sa direction initiale. Ces niveaux servent de zones d’intérêt pour chercher une entrée en tendance.',
        duration: 14,
        order: 3,
        type: LessonType.VIDEO,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 3 — Smart Money Concepts
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Smart Money Concepts',
    description:
      'Tradez comme les institutionnels : Order Blocks, liquidité, structure de marché et Fair Value Gaps — les outils du Smart Money Concept (SMC).',
    level: CourseLevel.INTERMEDIAIRE,
    category: 'SMC',
    thumbnail: 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=600',
    order: 3,
    isPublished: true,
    lessons: [
      {
        title: 'Order Blocks et Liquidity',
        description:
          'Les Order Blocks marquent les zones où les institutionnels ont placé leurs ordres. Combinés à la liquidité, ils forment la base de toute analyse SMC.',
        videoUrl: 'https://www.youtube.com/embed/pqQsI6brtKY',
        content:
          'Un Order Block est la dernière bougie opposée avant un mouvement directionnel fort — la trace laissée par une prise de position institutionnelle. La liquidité, elle, s’accumule au-dessus des sommets et sous les creux, là où se concentrent les ordres stop des traders retail : deux notions indissociables en SMC.',
        duration: 20,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Break of Structure (BOS)',
        description:
          'Le Break of Structure confirme la continuation d’une tendance, tandis que le Change of Character (CHoCH) en signale le retournement. Apprenez à distinguer les deux.',
        videoUrl: 'https://www.youtube.com/embed/slzCMYy5iYI',
        content:
          'Un Break of Structure (BOS) se produit quand le prix casse un sommet (tendance haussière) ou un creux (tendance baissière) précédent, confirmant que la tendance en cours se poursuit. À l’inverse, un Change of Character (CHoCH) casse la structure dans le sens opposé et alerte sur un possible retournement.',
        duration: 18,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Fair Value Gaps',
        description:
          'Un Fair Value Gap est un déséquilibre de prix que le marché cherche souvent à combler. Apprenez à le repérer et à l’utiliser comme zone d’entrée.',
        videoUrl: 'https://www.youtube.com/embed/skk0sm6LN6M',
        content:
          'Un Fair Value Gap (FVG) apparaît lors d’un mouvement de prix rapide, laissant un vide entre trois bougies successives — une zone où aucune transaction n’a eu lieu. Le prix revient fréquemment combler une partie de ce vide avant de poursuivre sa direction initiale, ce qui en fait une zone d’entrée prisée en SMC.',
        duration: 17,
        order: 3,
        type: LessonType.VIDEO,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 4 — Gestion du Risque
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Gestion du Risque',
    description:
      'La partie la plus négligée par les débutants : combien risquer, comment gérer ses émotions, et comment structurer un vrai plan de trading durable.',
    level: CourseLevel.AVANCE,
    category: 'Risk Management',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
    order: 4,
    isPublished: true,
    lessons: [
      {
        title: 'Money Management',
        description:
          'La règle des 1-2 % : ne jamais risquer plus d’une petite fraction de son capital par trade. Apprenez à calculer la bonne taille de position.',
        videoUrl: 'https://www.youtube.com/embed/6e1IT9u1g28',
        content:
          'Le money management repose sur une règle simple : ne jamais risquer plus de 1 à 2 % de son capital sur un seul trade, afin de survivre à une série de pertes consécutives. La taille de position se calcule à partir du capital, du risque accepté et de la distance jusqu’au stop loss.',
        duration: 16,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Psychologie du trader',
        description:
          'Peur, avidité, revenge trading : les biais psychologiques sont souvent la première cause de perte, bien avant la stratégie elle-même.',
        videoUrl: 'https://www.youtube.com/embed/IZwqt_HxhBg',
        content:
          'La majorité des pertes en trading ne viennent pas d’une mauvaise stratégie, mais d’une mauvaise gestion des émotions : peur de rater une opportunité, avidité qui pousse à sur-risquer, ou revenge trading après une perte. Reconnaître ces biais est la première étape pour les maîtriser.',
        duration: 15,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Construire un plan de trading',
        description:
          'Un plan de trading écrit — critères d’entrée, de sortie, et règles de risque — est ce qui distingue un trader discipliné d’un joueur.',
        videoUrl: 'https://www.youtube.com/embed/eO6cXMM2Rp8',
        content:
          'Un plan de trading formalise par écrit les règles d’entrée, de sortie, la taille de position et les conditions de marché dans lesquelles on accepte de trader. Il sert de garde-fou contre les décisions impulsives et permet d’évaluer objectivement ses résultats dans la durée.',
        duration: 19,
        order: 3,
        type: LessonType.VIDEO,
      },
    ],
  },
];

async function main() {
  console.log('🌱 Démarrage du seed Formation...');

  // Nettoyage préalable (ordre : dépendances d'abord)
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();

  for (const moduleData of modules) {
    const { lessons, ...course } = moduleData;
    const totalLessons = lessons.length;
    const duration = lessons.reduce((sum, l) => sum + l.duration, 0);

    const createdCourse = await prisma.course.create({
      data: {
        ...course,
        totalLessons,
        duration,
        lessons: { create: lessons },
      },
    });

    console.log(
      `  ✅ Module créé : "${createdCourse.title}" (${createdCourse.level}) — ${totalLessons} leçons, ${duration} min`,
    );
  }

  const totalCourses = await prisma.course.count();
  const totalLessons = await prisma.lesson.count();
  console.log(`\n✨ Seed terminé : ${totalCourses} modules, ${totalLessons} leçons créées.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
