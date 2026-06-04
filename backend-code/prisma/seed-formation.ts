/**
 * Seed — Formations Trading
 *
 * Les videoUrl utilisent des IDs YouTube de vidéos éducatives publiques en français.
 * Si une URL ne fonctionne plus, remplacez l'ID après "embed/" par celui de la
 * vidéo souhaitée (ex: https://www.youtube.com/watch?v=XXXXXXXX → embed/XXXXXXXX).
 */

import { PrismaClient, CourseLevel, LessonType } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  // ─────────────────────────────────────────────────────────────────────────
  // COURS 1 — Débutant
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Les Bases du Trading',
    description:
      'Maîtrisez les fondamentaux du trading : marchés, ordres, chandeliers et analyse de base. Le point de départ idéal pour tout trader.',
    level: CourseLevel.DEBUTANT,
    category: 'Fondamentaux',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
    duration: 120,
    totalLessons: 5,
    order: 1,
    isPublished: true,
    lessons: [
      {
        title: "Qu'est-ce que le trading ?",
        description:
          "Introduction complète au trading : définition, acteurs du marché, comment fonctionne l'achat et la vente d'actifs financiers.",
        videoUrl: 'https://www.youtube.com/embed/DP2uI_nA05Q',
        content: `## Introduction au trading

Le **trading** est l'acte d'acheter et vendre des actifs financiers dans le but de réaliser un profit.

### Les marchés financiers
- **Crypto** : Bitcoin, Ethereum, altcoins — marché 24h/24
- **Forex** : Paires de devises EUR/USD, GBP/USD
- **Actions** : Parts de sociétés cotées en Bourse
- **Matières premières** : Or, pétrole, blé

### Les acteurs du marché
1. Les banques centrales
2. Les fonds d'investissement institutionnels
3. Les traders retail (particuliers)

### Comment débuter ?
Le trading nécessite une discipline de fer, une gestion du risque rigoureuse et une formation solide avant de risquer du capital réel.`,
        duration: 20,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les types de marchés : Crypto, Forex, Actions',
        description:
          'Comparaison détaillée des différents marchés financiers : caractéristiques, horaires, volatilité et opportunités.',
        videoUrl: null,
        content: `## Les marchés financiers en détail

### 1. Marché des Cryptomonnaies
- Ouvert **24h/24, 7j/7**
- Volatilité très élevée (10-30% en une journée possible)
- Actifs principaux : BTC, ETH, BNB, SOL
- Avantage : liquidité élevée sur les paires majeures

### 2. Marché Forex
- Plus grand marché au monde : **6 000 milliards $** / jour
- Paires majeures : EUR/USD, GBP/USD, USD/JPY
- Ouvert du lundi au vendredi
- Spreads faibles sur les paires liquides

### 3. Marché des Actions
- Cotées sur des bourses régulées (NYSE, Nasdaq, Euronext)
- Horaires fixes selon les places boursières
- Dividendes possibles
- Accès via un courtier régulé

### Tableau comparatif

| Marché | Volatilité | Horaires | Levier max |
|--------|-----------|----------|------------|
| Crypto | Très haute | 24/7 | 10x-100x |
| Forex | Modérée | Lun-Ven | 30x |
| Actions | Modérée | Heures de marché | 5x |

### Quel marché choisir ?
Débutez sur le marché que vous comprenez le mieux. La crypto est accessible mais risquée ; le Forex est très liquide mais requiert de la technique.`,
        duration: 25,
        order: 2,
        type: LessonType.ARTICLE,
      },
      {
        title: 'Comprendre les chandeliers japonais',
        description:
          "Apprenez à lire les bougies japonaises, la base de toute l'analyse technique moderne.",
        videoUrl: 'https://www.youtube.com/embed/bs9Rb8xL8wk',
        content: `## Les chandeliers japonais

Les chandeliers (ou bougies) japonais sont la représentation graphique la plus utilisée en trading.

### Anatomie d'une bougie
\`\`\`
   ─  ← Mèche haute (High)
   │
  ███ ← Corps (Open → Close)
   │
   ─  ← Mèche basse (Low)
\`\`\`

- **Corps vert** : Le prix de clôture est supérieur au prix d'ouverture (hausse)
- **Corps rouge** : Le prix de clôture est inférieur au prix d'ouverture (baisse)

### Les patterns essentiels

**Doji** : Corps très petit → indécision du marché
**Marteau** : Grande mèche basse → potentiel retournement haussier
**Étoile filante** : Grande mèche haute → potentiel retournement baissier
**Englobante haussière** : Grosse bougie verte qui englobe la précédente rouge

### Comment les utiliser ?
Les chandeliers donnent des signaux sur la psychologie du marché. Toujours confirmer avec d'autres indicateurs.`,
        duration: 25,
        order: 3,
        type: LessonType.VIDEO,
      },
      {
        title: 'Support et Résistance',
        description:
          'Les niveaux de support et résistance sont les piliers de toute analyse technique. Apprenez à les identifier et les trader.',
        videoUrl: 'https://www.youtube.com/embed/CnRVH8AxQgw',
        content: `## Support et Résistance

### Définitions
- **Support** : Niveau de prix où la demande est suffisamment forte pour stopper la baisse
- **Résistance** : Niveau de prix où l'offre est suffisamment forte pour stopper la hausse

### Comment les identifier ?
1. Cherchez des zones où le prix a rebondi **au moins 2 fois**
2. Plus le niveau a été testé souvent, plus il est fort
3. Les anciens supports deviennent des résistances (et vice versa)

### Les types de supports/résistances
- **Horizontaux** : Niveaux fixes sur le graphique
- **Dynamiques** : Moyennes mobiles, lignes de tendance
- **Psychologiques** : Niveaux ronds (BTC à 50 000$, 100 000$)

### Stratégie de base
\`\`\`
Achat au support → Stop loss sous le support → Target : résistance suivante
Vente à la résistance → Stop loss au-dessus → Target : support suivant
\`\`\``,
        duration: 25,
        order: 4,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les ordres de bourse : Market, Limit, Stop',
        description:
          "Maîtrisez les différents types d'ordres pour entrer et sortir du marché au bon prix.",
        videoUrl: null,
        content: `## Les types d'ordres

### 1. Ordre Market (Au marché)
Exécuté **immédiatement** au meilleur prix disponible.
- ✅ Exécution garantie
- ❌ Prix non garanti (slippage possible)
- Usage : entrées rapides en scalping

### 2. Ordre Limit (À cours limité)
Exécuté **uniquement si le prix atteint votre niveau**.
- ✅ Prix garanti
- ❌ Exécution non garantie
- Usage : entrées en retracement, take profit

### 3. Ordre Stop Loss
Déclenche une vente automatique si le prix baisse en dessous d'un seuil.
- Protection obligatoire pour tout trade
- Formule : **Stop Loss = Prix d'entrée - (Capital × % risque)**

### 4. Ordre OCO (One Cancels Other)
Combine un Take Profit et un Stop Loss simultanément.
- Le premier déclenché annule l'autre

### Exemple pratique
\`\`\`
BTC à 63 000$
Entrée : 63 000$ (ordre market)
Stop Loss : 61 500$ (-2,4%)
Take Profit : 67 000$ (+6,3%)
Risk/Reward : 1:2.6 ✅
\`\`\``,
        duration: 25,
        order: 5,
        type: LessonType.ARTICLE,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COURS 2 — Intermédiaire
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Analyse Technique Avancée',
    description:
      'Maîtrisez les indicateurs techniques professionnels : RSI, MACD, moyennes mobiles et gestion du risque quantitative.',
    level: CourseLevel.INTERMEDIAIRE,
    category: 'Analyse Technique',
    thumbnail: 'https://images.unsplash.com/photo-1642790551116-18e4f56b6c6a?w=600',
    duration: 150,
    totalLessons: 5,
    order: 2,
    isPublished: true,
    lessons: [
      {
        title: "RSI : comment l'utiliser correctement",
        description:
          "Le RSI (Relative Strength Index) est l'indicateur le plus utilisé. Apprenez à éviter les faux signaux et à trader les divergences.",
        videoUrl: 'https://www.youtube.com/embed/45J_2Oq3b6I',
        content: `## RSI — Relative Strength Index

### Définition
Le RSI mesure la **vitesse et l'amplitude** des mouvements de prix sur une période donnée (défaut : 14 périodes).

### Lecture du RSI
- **RSI > 70** : Zone de surachat → attention à un retournement baissier
- **RSI < 30** : Zone de survente → attention à un retournement haussier
- **RSI = 50** : Zone neutre

### Les divergences (signal fort)
**Divergence baissière** :
- Le prix fait un nouveau sommet
- Le RSI fait un sommet plus bas
→ Signal de retournement baissier imminent

**Divergence haussière** :
- Le prix fait un nouveau creux
- Le RSI fait un creux plus haut
→ Signal de retournement haussier imminent

### Paramètres recommandés
| Timeframe | Période RSI | Niveaux |
|-----------|-------------|---------|
| Scalping (5min) | 7-9 | 80/20 |
| Day trading (1h) | 14 | 70/30 |
| Swing trading (4h/1J) | 14-21 | 70/30 |`,
        duration: 30,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'MACD : signal et divergence',
        description:
          "Le MACD combine deux moyennes mobiles pour générer des signaux de trading. Apprenez à l'utiliser comme un professionnel.",
        videoUrl: 'https://www.youtube.com/embed/6Fff15-V6n8',
        content: `## MACD — Moving Average Convergence Divergence

### Composition du MACD
1. **Ligne MACD** = EMA 12 - EMA 26
2. **Ligne Signal** = EMA 9 de la ligne MACD
3. **Histogramme** = MACD - Signal

### Signaux de trading

**Croisement haussier** : La ligne MACD croise au-dessus de la ligne Signal → Achat
**Croisement baissier** : La ligne MACD croise en dessous de la ligne Signal → Vente

**Croisement de la ligne zéro** :
- MACD passe en positif → tendance haussière confirmée
- MACD passe en négatif → tendance baissière confirmée

### Divergences MACD
Comme pour le RSI, les divergences entre le prix et le MACD sont des signaux puissants de retournement.

### Limitations
- Indicateur **lagging** (retardé) → confirme la tendance, ne la prédit pas
- Nombreux faux signaux en marché latéral
- Toujours combiner avec d'autres outils`,
        duration: 30,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les Moyennes Mobiles EMA/SMA',
        description:
          "EMA et SMA sont la colonne vertébrale de l'analyse technique. Maîtrisez les croisements et le concept de tendance.",
        videoUrl: 'https://www.youtube.com/embed/vVWbuexpZ1A',
        content: `## Moyennes Mobiles

### SMA vs EMA
**SMA (Simple Moving Average)** : Moyenne arithmétique des N dernières bougies
**EMA (Exponential Moving Average)** : Donne plus de poids aux données récentes

L'EMA est plus **réactive** aux changements de prix, la SMA est plus **lisse**.

### Périodes clés
- **EMA 9** : Court terme, scalping
- **EMA 21** : Court-moyen terme
- **EMA 50** : Moyen terme, tendance intermédiaire
- **EMA 200** : Long terme, tendance de fond

### La règle d'or
- Prix **au-dessus** de l'EMA 200 → Zone haussière (chercher des achats)
- Prix **en-dessous** de l'EMA 200 → Zone baissière (chercher des ventes)

### Croisements (Golden/Death Cross)
**Golden Cross** : EMA 50 croise au-dessus de EMA 200 → Signal haussier majeur
**Death Cross** : EMA 50 croise en-dessous de EMA 200 → Signal baissier majeur

### Utilisation comme support/résistance dynamique
Les EMA (notamment 21, 50) agissent comme des supports et résistances dynamiques en tendance.`,
        duration: 30,
        order: 3,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les patterns de chandeliers avancés',
        description:
          'Englobantes, étoiles du matin/soir, marteaux, doji — les patterns qui font la différence dans vos entrées en trade.',
        videoUrl: null,
        content: `## Patterns de Chandeliers Avancés

### Patterns de retournement haussier

**Marteau (Hammer)**
- Corps petit en haut de la bougie
- Grande mèche basse (2x le corps)
- Apparaît au bas d'une tendance baissière
- Signal : les vendeurs ont poussé bas mais les acheteurs ont repris le contrôle

**Englobante haussière (Bullish Engulfing)**
- Bougie rouge suivie d'une grosse bougie verte
- La verte englobe entièrement la rouge
- Signal fort de retournement

**Étoile du matin (Morning Star)**
- Pattern en 3 bougies : rouge, petit corps (doji), grosse verte
- Retournement haussier puissant

### Patterns de retournement baissier

**Étoile filante (Shooting Star)**
- Corps petit en bas, grande mèche haute
- Inverse du marteau → retournement baissier

**Englobante baissière (Bearish Engulfing)**
- Bougie verte suivie d'une grosse rouge qui l'englobe

**Doji Croix (Gravestone Doji)**
- Corps quasi nul en bas, grande mèche haute
- Signal de retournement très baissier

### Comment les utiliser
1. Attendez qu'ils se forment à des zones clés (support/résistance)
2. Confirmez avec le volume ou un indicateur
3. Entrez sur la bougie suivante, pas pendant la formation`,
        duration: 30,
        order: 4,
        type: LessonType.ARTICLE,
      },
      {
        title: 'Gestion du risque et position sizing',
        description:
          'La règle numéro 1 du trading : ne jamais perdre plus de 1-2% de son capital sur un trade. Apprenez le position sizing professionnel.',
        videoUrl: 'https://www.youtube.com/embed/6e1IT9u1g28',
        content: `## Gestion du Risque

### La règle des 1-2%
Ne risquez **jamais plus de 1-2%** de votre capital total sur un seul trade.

Avec 10 000$ de capital :
- Risque max par trade : **100-200$**
- Cela vous permet de survivre à 50-100 trades perdants consécutifs

### Calcul du Position Sizing

\`\`\`
Taille de position = (Capital × % risque) ÷ (Prix entrée - Stop Loss)

Exemple :
Capital = 10 000$
Risque = 1% = 100$
BTC entrée = 63 000$, Stop = 61 500$
Distance stop = 63 000 - 61 500 = 1 500$

Taille = 100$ ÷ 1 500$ = 0.067 BTC
\`\`\`

### Risk/Reward Ratio (RR)
Ne prenez que des trades avec **RR ≥ 1:2** (minimum).
- Risque 100$ → Gain minimum 200$
- Avec 50% de win rate et RR 1:2 → Rentable !

### Les erreurs fatales
❌ Overtrading (trop de trades)
❌ Revenge trading (doubler après une perte)
❌ Moyenner à la baisse sans plan
❌ Ne pas respecter son stop loss`,
        duration: 30,
        order: 5,
        type: LessonType.VIDEO,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COURS 3 — Avancé
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Smart Money Concept (SMC)',
    description:
      'Tradez comme les institutionnels. SMC analyse les traces laissées par les "smart money" pour anticiper les grands mouvements.',
    level: CourseLevel.AVANCE,
    category: 'SMC',
    thumbnail: 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=600',
    duration: 210,
    totalLessons: 6,
    order: 3,
    isPublished: true,
    lessons: [
      {
        title: 'Introduction au Smart Money Concept',
        description:
          'Comprendre la philosophie SMC : qui sont les smart money, comment manipulent-ils le marché, et comment en tirer profit.',
        videoUrl: 'https://www.youtube.com/embed/-zmePMWwaS0',
        content: `## Smart Money Concept — Introduction

### Qui sont les "Smart Money" ?
Les smart money sont les grands acteurs du marché :
- Banques centrales
- Fonds spéculatifs (hedge funds)
- Market makers
- Banques d'investissement

### La manipulation institutionnelle
Les institutionnels ont besoin de **liquidité** pour remplir leurs énormes positions. Ils créent des mouvements de prix intentionnels pour :
1. Chasser les stop loss des retail traders
2. Accumuler des positions à bas prix
3. Distribuer leurs positions en haut

### Les 3 phases du marché selon SMC
1. **Accumulation** : Les institutionnels achètent discrètement
2. **Manipulation** : Faux mouvement pour chasser les stops
3. **Distribution** : Les institutionnels revendent en force

### Pourquoi le SMC fonctionne
En comprenant ce cycle, vous pouvez vous positionner **avec** les institutionnels plutôt que d'être leur proie.`,
        duration: 35,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: 'Order Blocks institutionnels',
        description:
          'Les Order Blocks sont les zones où les institutionnels ont placé de grosses commandes. Ces zones agissent comme des aimants à prix.',
        videoUrl: 'https://www.youtube.com/embed/ftAuQSy8S_g',
        content: `## Order Blocks

### Définition
Un **Order Block (OB)** est la dernière bougie opposée avant un grand mouvement directionnel. C'est la zone où les institutionnels ont placé leurs ordres.

### Identifier un Order Block haussier
1. Prix en tendance haussière
2. Dernier corps rouge (baisse) avant une forte montée
3. Cette bougie rouge = Order Block haussier

### Identifier un Order Block baissier
1. Prix en tendance baissière
2. Dernier corps vert (hausse) avant une forte chute
3. Cette bougie verte = Order Block baissier

### Comment trader les Order Blocks
\`\`\`
Entrée : Retour du prix sur l'Order Block
Stop Loss : En dessous/au-dessus de l'OB
Target : Prochain déséquilibre de prix (FVG)
\`\`\`

### Validation d'un Order Block
Un OB est valide si :
✅ Il a causé un Break of Structure (BOS)
✅ Il n'a pas encore été retesté
✅ Il se situe dans la direction de la tendance HTF`,
        duration: 35,
        order: 2,
        type: LessonType.VIDEO,
      },
      {
        title: 'Break of Structure (BOS) et Market Structure',
        description:
          'La structure de marché est la base du SMC. Apprenez à lire les BOS pour définir la direction institutionnelle.',
        videoUrl: 'https://www.youtube.com/embed/slzCMYy5iYI',
        content: `## Break of Structure (BOS)

### La structure de marché
Le marché se déplace en zigzag :
- **HH** (Higher High) + **HL** (Higher Low) = Structure haussière
- **LH** (Lower High) + **LL** (Lower Low) = Structure baissière

### Break of Structure (BOS)
Un BOS confirme la **continuation** de la tendance :
- En hausse : Prix casse un HH → BOS haussier, structure intacte
- En baisse : Prix casse un LL → BOS baissier, structure intacte

### Change of Character (CHoCH)
Un CHoCH signale un **retournement** de tendance :
- En hausse : Prix casse un HL → CHoCH baissier
- En baisse : Prix casse un LH → CHoCH haussier

### Stratégie BOS
\`\`\`
1. Identifier la structure sur HTF (4H, 1D)
2. Zoomer sur LTF (15min, 1H) pour l'entrée
3. Attendre un CHoCH sur LTF dans la direction HTF
4. Entrer sur le retest de l'Order Block du CHoCH
\`\`\``,
        duration: 35,
        order: 3,
        type: LessonType.VIDEO,
      },
      {
        title: 'Fair Value Gap (FVG)',
        description:
          "Les FVG sont des déséquilibres de prix que le marché cherche toujours à combler. Une des zones d'entrée les plus précises du SMC.",
        videoUrl: 'https://www.youtube.com/embed/skk0sm6LN6M',
        content: `## Fair Value Gap (FVG)

### Définition
Un **Fair Value Gap** est un écart de prix créé quand :
- Bougie 1 : Corps normal
- Bougie 2 : Gap (la mèche haute de B1 ne touche pas la mèche basse de B3)
- Bougie 3 : Corps normal

Cet écart représente une zone où **aucune transaction n'a eu lieu** → déséquilibre.

### Types de FVG
**FVG haussier** : Créé lors d'un move rapide à la hausse → le prix reviendra combler
**FVG baissier** : Créé lors d'un move rapide à la baisse → le prix reviendra combler

### Règle des 50%
Le prix revient souvent au **50% du FVG** avant de repartir dans la direction initiale. C'est votre zone d'entrée optimale.

### FVG + Order Block = Setup parfait
Quand un FVG se superpose à un Order Block, la probabilité de rebond est maximale.

### Invalidation
Un FVG est invalidé quand le prix le traverse entièrement. Passez au prochain niveau.`,
        duration: 35,
        order: 4,
        type: LessonType.VIDEO,
      },
      {
        title: 'CHoCH et inversion de tendance',
        description:
          'Change of Character : comment détecter les retournements de tendance avant tout le monde avec le SMC.',
        videoUrl: 'https://www.youtube.com/embed/slzCMYy5iYI',
        content: `## Change of Character (CHoCH)

### Différence BOS vs CHoCH

| Signal | Type | Signification |
|--------|------|---------------|
| BOS | Continuation | La tendance continue |
| CHoCH | Retournement | La tendance change |

### Identifier un CHoCH haussier
1. Marché en tendance baissière (LH + LL)
2. Prix casse un **Lower High** → CHoCH
3. Structure devient potentiellement haussière

### Identifier un CHoCH baissier
1. Marché en tendance haussière (HH + HL)
2. Prix casse un **Higher Low** → CHoCH
3. Structure devient potentiellement baissière

### Stratégie de retournement SMC
\`\`\`
1. Identifier CHoCH sur HTF
2. Zoomer sur LTF, chercher un Order Block de retournement
3. Entrer sur le reteset de cet OB
4. Stop sous/sur l'OB
5. Target : premier FVG dans la nouvelle direction
\`\`\``,
        duration: 35,
        order: 5,
        type: LessonType.VIDEO,
      },
      {
        title: 'Les sessions de trading : Asia, London, New York',
        description:
          'Comprendre les sessions mondiales pour trader aux moments où la liquidité et la volatilité sont optimales.',
        videoUrl: null,
        content: `## Sessions de Trading Mondiales

### Les 3 grandes sessions

| Session | Heure Paris (CET) | Caractéristiques |
|---------|-------------------|-----------------|
| **Asie** | 01h00 - 10h00 | Faible volatilité, range tight |
| **Londres** | 09h00 - 18h00 | Fort volume, grande volatilité |
| **New York** | 14h30 - 23h00 | Pics de volume aux ouvertures |

### Le Kill Zone SMC

**Asia Kill Zone** : 01h00 - 04h00 CET
→ Le marché établit les high/low de la session asiatique (liquidity pools)

**London Kill Zone** : 09h00 - 11h00 CET
→ Les institutionnels londoniens ouvrent → chasse des stops asiatiques

**New York Kill Zone** : 14h30 - 16h30 CET
→ Le plus fort volume de la journée → mouvements directionnels majeurs

### Stratégie Kill Zone
1. Identifier le high/low de la session Asia
2. En London KZ, guetter un stop hunt de ces niveaux
3. Entrer dans la direction opposée (SMC setup)
4. La NY KZ confirmera et amplifiera le move

### Conclusion
Les 80% des mouvements importants se produisent dans ces kill zones. Concentrez votre analyse et vos entrées sur ces fenêtres temporelles.`,
        duration: 35,
        order: 6,
        type: LessonType.ARTICLE,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COURS 4 — Expert
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Trading Algorithmique',
    description:
      "Automatisez vos stratégies de trading avec du code. Du backtesting à l'exécution automatique, devenez un algo trader.",
    level: CourseLevel.EXPERT,
    category: 'Algo Trading',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600',
    duration: 120,
    totalLessons: 3,
    order: 4,
    isPublished: true,
    lessons: [
      {
        title: 'Introduction au trading algorithmique',
        description:
          'Découvrez comment les banques et hedge funds utilisent des algorithmes pour trader des milliards automatiquement.',
        videoUrl: 'https://www.youtube.com/embed/HokSf08qnNs',
        content: `## Trading Algorithmique

### Définition
Le trading algorithmique (algo trading) consiste à utiliser des programmes informatiques pour exécuter des ordres de trading selon des règles prédéfinies, sans intervention humaine.

### Types d'algorithmes

**1. Algorithmes de suivi de tendance**
- Se basent sur EMA, MACD, RSI
- Achètent en tendance haussière, vendent en baissière

**2. Algorithmes mean-reversion**
- Partent du principe que le prix revient à sa moyenne
- Achètent quand le prix est trop bas, vendent trop haut

**3. Algorithmes d'arbitrage**
- Exploitent les différences de prix entre exchanges
- Nécessitent une exécution ultra-rapide (HFT)

**4. Algorithmes de Market Making**
- Placent des ordres des deux côtés du carnet d'ordres
- Gagnent sur le spread

### Avantages du trading algo
✅ Pas d'émotions → discipline parfaite
✅ Exécution instantanée 24/7
✅ Backtesting quantitatif
✅ Peut gérer plusieurs stratégies simultanément

### Les langages utilisés
- **Python** : Le plus populaire (pandas, numpy, backtrader)
- **JavaScript/TypeScript** : Pour les exchanges crypto (ccxt)
- **C++** : Pour le HFT (microsecondes)`,
        duration: 40,
        order: 1,
        type: LessonType.VIDEO,
      },
      {
        title: "Backtesting d'une stratégie",
        description:
          'Le backtesting est indispensable pour valider une stratégie avant de risquer du capital réel. Apprenez à backtester correctement.',
        videoUrl: null,
        content: `## Backtesting

### Définition
Le backtesting consiste à tester une stratégie de trading sur des **données historiques** pour évaluer sa performance passée.

### Les métriques clés du backtesting

| Métrique | Description | Objectif |
|----------|-------------|----------|
| **Win Rate** | % de trades gagnants | > 50% |
| **Profit Factor** | Gains totaux / Pertes totales | > 1.5 |
| **Max Drawdown** | Perte maximale depuis un pic | < 20% |
| **Sharpe Ratio** | Rendement / Risque | > 1 |

### Processus de backtesting

\`\`\`python
# Exemple simplifié en Python avec backtrader
import backtrader as bt

class MaStrategie(bt.Strategy):
    def __init__(self):
        self.ema20 = bt.indicators.EMA(period=20)
        self.ema50 = bt.indicators.EMA(period=50)

    def next(self):
        if self.ema20 > self.ema50 and not self.position:
            self.buy()
        elif self.ema20 < self.ema50 and self.position:
            self.sell()
\`\`\`

### Pièges du backtesting
❌ **Overfitting** : Sur-optimisation sur les données historiques
❌ **Look-ahead bias** : Utiliser des données futures pour prendre des décisions passées
❌ **Survivorship bias** : Ne tester que sur les actifs qui existent encore

### La bonne pratique
Divisez vos données : 70% pour optimiser, 30% pour valider (out-of-sample test).`,
        duration: 40,
        order: 2,
        type: LessonType.ARTICLE,
      },
      {
        title: 'Gestion de portefeuille quantitative',
        description:
          "Modern Portfolio Theory, Kelly Criterion, allocation optimale. Les mathématiques au service de votre portefeuille.",
        videoUrl: null,
        content: `## Gestion de Portefeuille Quantitative

### Modern Portfolio Theory (Markowitz)

La théorie moderne du portefeuille (MPT) cherche à **maximiser le rendement** pour un niveau de risque donné, ou à **minimiser le risque** pour un rendement ciblé.

**Concepts clés :**
- **Diversification** : Combiner des actifs peu corrélés réduit le risque global
- **Frontière efficiente** : L'ensemble des portefeuilles optimaux (meilleur ratio rendement/risque)
- **Volatilité** : Mesurée par l'écart-type des rendements

### Kelly Criterion
La fraction de Kelly détermine la taille optimale de position :

\`\`\`
f = (p × b - q) / b

Où :
f = fraction du capital à risquer
p = probabilité de gain (win rate)
q = 1 - p (probabilité de perte)
b = ratio gain/perte (risk/reward)

Exemple : p=0.55, b=2 (RR 1:2), q=0.45
f = (0.55 × 2 - 0.45) / 2 = 0.325 → Risquer 32.5% max
En pratique : utiliser Kelly/4 = 8% (Kelly fractionnel)
\`\`\`

### Corrélation entre actifs
Diversifiez avec des actifs décorrélés :
- BTC + Or (corrélation faible historiquement)
- Actions tech + Obligations (corrélation négative en crise)
- Crypto + Forex (marchés différents)

### Rebalancement du portefeuille
Rééquilibrez périodiquement (mensuel ou trimestriel) pour maintenir votre allocation cible.`,
        duration: 40,
        order: 3,
        type: LessonType.ARTICLE,
      },
    ],
  },
];

async function main() {
  console.log('🌱 Démarrage du seed formations...');

  // Nettoyage préalable
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();

  for (const courseData of courses) {
    const { lessons, ...course } = courseData;

    const createdCourse = await prisma.course.create({
      data: {
        ...course,
        lessons: {
          create: lessons.map((lesson) => ({
            ...lesson,
            videoUrl: lesson.videoUrl ?? null,
          })),
        },
      },
    });

    console.log(
      `  ✅ Cours créé : "${createdCourse.title}" (${createdCourse.level}) — ${lessons.length} leçons`,
    );
  }

  const totalCourses = await prisma.course.count();
  const totalLessons = await prisma.lesson.count();
  console.log(`\n✨ Seed terminé : ${totalCourses} cours, ${totalLessons} leçons créées.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
