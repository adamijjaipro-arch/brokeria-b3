# -*- coding: utf-8 -*-
"""
Generateur de diagrammes Alvio — matplotlib
Produit 8 PNG dans /docs/img/
"""
import os, sys, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
import matplotlib.patheffects as pe

OUT = os.path.join(os.path.dirname(__file__), '..', 'img')
os.makedirs(OUT, exist_ok=True)

# ── Palette Alvio ──────────────────────────────────────────────────────────
NAVY   = '#0f172a'
AMBER  = '#f59e0b'
GREEN  = '#10b981'
VIOLET = '#6366f1'
GLASS  = '#1e293b'
LIGHT  = '#94a3b8'
WHITE  = '#f1f5f9'
RED    = '#ef4444'
BLUE   = '#3b82f6'

plt.rcParams.update({
    'figure.facecolor': NAVY,
    'axes.facecolor': NAVY,
    'text.color': WHITE,
    'font.family': 'DejaVu Sans',
    'font.size': 9,
})

def save(name):
    path = os.path.join(OUT, name)
    plt.savefig(path, dpi=150, bbox_inches='tight',
                facecolor=NAVY, edgecolor='none')
    plt.close()
    print(f'  [{name}]')
    return path

# ───────────────────────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────────────────────

def entity_box(ax, x, y, w, h, title, fields, color=GLASS,
               title_color=AMBER, border=VIOLET, fontsize=7.5):
    """Draw an entity rectangle with title + fields."""
    # Border
    rect = FancyBboxPatch((x, y), w, h,
                          boxstyle='round,pad=0.02',
                          linewidth=1.5, edgecolor=border,
                          facecolor=color, zorder=3)
    ax.add_patch(rect)
    # Title bar
    title_h = 0.38
    trect = FancyBboxPatch((x, y + h - title_h), w, title_h,
                            boxstyle='round,pad=0.01',
                            linewidth=0, edgecolor='none',
                            facecolor=border, zorder=4)
    ax.add_patch(trect)
    ax.text(x + w/2, y + h - title_h/2, title,
            ha='center', va='center', fontsize=fontsize + 0.5,
            fontweight='bold', color=WHITE, zorder=5)
    # Fields
    line_h = (h - title_h - 0.1) / max(len(fields), 1)
    for i, f in enumerate(fields):
        fy = y + h - title_h - 0.05 - (i + 0.5) * line_h
        col = AMBER if f.startswith('PK') else (GREEN if f.startswith('FK') else WHITE)
        ax.text(x + 0.08, fy, f, ha='left', va='center',
                fontsize=fontsize - 0.5, color=col, zorder=5)

def arrow(ax, x1, y1, x2, y2, color=LIGHT, style='->', lw=1.2, label='', label_color=LIGHT):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color,
                                lw=lw, connectionstyle='arc3,rad=0.05'))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.05, my + 0.05, label, fontsize=6.5,
                color=label_color, zorder=6)

def title_banner(ax, text, subtitle=''):
    ax.text(0.5, 1.02, text, transform=ax.transAxes,
            ha='center', va='bottom', fontsize=13,
            fontweight='bold', color=AMBER)
    if subtitle:
        ax.text(0.5, 0.985, subtitle, transform=ax.transAxes,
                ha='center', va='top', fontsize=8, color=LIGHT)

# ═══════════════════════════════════════════════════════════════════════════
# 1. MCD — Modele Conceptuel de Donnees
# ═══════════════════════════════════════════════════════════════════════════
def gen_mcd():
    fig, ax = plt.subplots(figsize=(18, 13))
    ax.set_xlim(0, 18); ax.set_ylim(0, 13)
    ax.axis('off')
    title_banner(ax, 'MCD — Modele Conceptuel de Donnees — Alvio',
                 '11 entites issues du schema.prisma reel')

    # ── Entites ──────────────────────────────────────────────────────────
    entities = {
        'USER': (7.5, 5.8, 3.0, 4.2,
                 ['id (cuid)', 'username *', 'email *',
                  'passwordHash?', 'githubId?', 'pin?',
                  'totpSecret?', 'totpEnabled', 'trading_preference',
                  'email_notifications'], GLASS, AMBER),

        'SIGNAL': (0.3, 5.5, 3.2, 4.8,
                   ['id (cuid)', 'userId (FK)', 'strategyId?',
                    'asset', 'timeframe?', 'direction',
                    'status (OPEN/CLOSED)', 'entry_price',
                    'stop_loss', 'take_profit', 'exit_price?',
                    'confidence', 'patterns? (JSON)',
                    'indicators? (JSON)', 'closedAt?'], GLASS, AMBER),

        'STRATEGY': (3.9, 5.5, 3.2, 4.0,
                     ['id (cuid)', 'userId (FK)', 'name',
                      'description?', 'code (JSON rules)',
                      'asset', 'timeframe',
                      'status', 'win_rate?', 'profit_factor?'], GLASS, AMBER),

        'REPORT': (11.1, 5.5, 3.2, 4.5,
                   ['id (cuid)', 'userId (FK)', 'month', 'year',
                    'total_signals', 'buy_signals', 'sell_signals',
                    'win_rate', 'avg_confidence',
                    'total_pnl_estimate', 'patterns_detected?',
                    'indicators_used?', 'summary?'], GLASS, AMBER),

        'WEBAUTHN': (14.5, 6.5, 3.2, 3.5,
                     ['id (cuid)', 'userId (FK)',
                      'credentialId *', 'publicKey',
                      'counter', 'deviceType?', 'transports?',
                      'backedUp', 'lastUsedAt?'], GLASS, VIOLET),

        'SIMULATION': (0.3, 0.3, 3.2, 3.0,
                       ['id (cuid)', 'userId (FK)', 'asset',
                        'params (JSON)', 'result (JSON)',
                        'monthlyData? (JSON)'], GLASS, GREEN),

        'PORTFOLIO': (3.9, 0.3, 3.0, 2.5,
                      ['id (cuid)', 'userId (FK)',
                       'capital', 'month', 'year',
                       'UNQ(userId,month,year)'], GLASS, GREEN),

        'AUTH_LOG': (7.3, 0.3, 3.3, 2.5,
                     ['id (cuid)', 'userId?',
                      'action', 'result',
                      'ip?', 'detail?', 'createdAt'], GLASS, RED),

        'COURSE': (11.1, 0.3, 3.2, 3.2,
                   ['id (cuid)', 'title', 'description',
                    'level (ENUM)', 'category',
                    'duration', 'totalLessons', 'order',
                    'isPublished'], GLASS, BLUE),

        'LESSON': (14.5, 0.3, 3.2, 3.0,
                   ['id (cuid)', 'courseId (FK)',
                    'title', 'type (ENUM)',
                    'videoUrl?', 'content',
                    'duration', 'order'], GLASS, BLUE),

        'USERPROGRESS': (11.1, 4.0, 3.2, 2.0,
                         ['id (cuid)', 'userId (FK)', 'courseId?',
                          'lessonId?', 'completed', 'score?',
                          'UNQ(userId,lessonId)'], GLASS, BLUE),
    }

    for name, (x, y, w, h, fields, bg, bc) in entities.items():
        entity_box(ax, x, y, w, h, name, fields, color=bg, border=bc)

    # ── Relations (fleches) ─────────────────────────────────────────────
    # USER → SIGNAL
    arrow(ax, 7.5, 8.3, 3.5, 8.3, GREEN, '->',  1.5, '1,N possede')
    # USER → STRATEGY
    arrow(ax, 7.5, 7.5, 7.1, 9.0, GREEN, '->', 1.5, '')
    ax.text(7.15, 9.0, '1,N\ncree', fontsize=6.5, color=GREEN)
    # USER → REPORT
    arrow(ax, 10.5, 8.3, 11.1, 8.0, GREEN, '->', 1.5, '1,N')
    # USER → WEBAUTHN
    arrow(ax, 10.5, 9.0, 14.5, 8.5, VIOLET, '->', 1.5, '1,N')
    # USER → SIMULATION
    arrow(ax, 7.5, 5.8, 3.5, 3.3, GREEN, '->', 1.2, '1,N')
    # USER → PORTFOLIO
    arrow(ax, 8.0, 5.8, 5.4, 2.8, GREEN, '->', 1.2, '1,N')
    # USER → USERPROGRESS
    arrow(ax, 10.5, 6.0, 11.1, 5.3, BLUE, '->', 1.2, '1,N')
    # USERPROGRESS → COURSE
    arrow(ax, 12.7, 4.0, 12.7, 3.5, BLUE, '->', 1.2, 'N,1')
    # USERPROGRESS → LESSON
    arrow(ax, 14.3, 5.0, 16.1, 3.3, BLUE, '->', 1.2, 'N,1')
    # COURSE → LESSON
    arrow(ax, 14.3, 1.8, 14.5, 1.8, BLUE, '->', 1.2, '1,N')

    # Legend
    ax.legend(handles=[mpatches.Patch(color=c, label=l) for c,l in [
        (AMBER,'Entites principales'),(GREEN,'Modules IA/simulation'),
        (BLUE,'Formation'),(VIOLET,'Securite/MFA'),(RED,'Audit')]],
        loc='lower right', fontsize=7, framealpha=0.3,
        facecolor=GLASS, edgecolor=AMBER, labelcolor=WHITE)

    save('mcd.png')

# ═══════════════════════════════════════════════════════════════════════════
# 2. MLD — Modele Logique de Donnees
# ═══════════════════════════════════════════════════════════════════════════
def gen_mld():
    fig, ax = plt.subplots(figsize=(20, 14))
    ax.set_xlim(0, 20); ax.set_ylim(0, 14)
    ax.axis('off')
    title_banner(ax, 'MLD — Modele Logique de Donnees — Alvio',
                 'Cles primaires (PK), cles etrangeres (FK), contraintes UNIQUE')

    tables = [
        # (x, y, w, h, name, rows, border)
        (0.2, 9.5, 5.8, 3.8, 'USER',
         ['PK  id          CUID NOT NULL',
          '    username    VARCHAR UNIQUE NOT NULL',
          '    email       VARCHAR UNIQUE NOT NULL',
          '    passwordHash VARCHAR NULL',
          '    githubId    VARCHAR UNIQUE NULL',
          '    pin         VARCHAR NULL',
          '    totpSecret  VARCHAR NULL',
          '    totpEnabled BOOL DEFAULT false',
          '    trading_preference VARCHAR DEFAULT moderate',
          '    email_notifications BOOL DEFAULT true'], AMBER),

        (6.4, 9.5, 5.8, 4.5, 'SIGNAL',
         ['PK  id           CUID NOT NULL',
          'FK  userId       → USER(id) CASCADE',
          '    strategyId   VARCHAR NULL',
          '    asset        VARCHAR NOT NULL',
          '    timeframe    VARCHAR NULL',
          '    direction    VARCHAR NOT NULL',
          '    status       VARCHAR DEFAULT OPEN',
          '    entry_price  FLOAT NOT NULL',
          '    stop_loss    FLOAT NOT NULL',
          '    take_profit  FLOAT NOT NULL',
          '    exit_price   FLOAT NULL',
          '    confidence   FLOAT NOT NULL',
          '    patterns     TEXT NULL (JSON)',
          '    indicators   TEXT NULL (JSON)',
          '    closedAt     TIMESTAMP NULL',
          'IDX [userId] [asset] [strategyId]'], AMBER),

        (12.6, 9.5, 5.8, 3.3, 'STRATEGY',
         ['PK  id           CUID NOT NULL',
          'FK  userId       → USER(id) CASCADE',
          '    name         VARCHAR NOT NULL',
          '    description  TEXT NULL',
          '    code         TEXT NOT NULL (JSON rules)',
          '    asset        VARCHAR NOT NULL',
          '    timeframe    VARCHAR NOT NULL',
          '    status       VARCHAR DEFAULT inactive',
          '    win_rate     FLOAT NULL',
          '    profit_factor FLOAT NULL'], AMBER),

        (0.2, 5.0, 5.8, 3.8, 'REPORT',
         ['PK  id                CUID',
          'FK  userId            → USER(id) CASCADE',
          '    month, year       INT NOT NULL',
          '    total_signals     INT NOT NULL',
          '    buy_signals       INT',
          '    sell_signals      INT',
          '    win_rate          FLOAT',
          '    avg_confidence    FLOAT',
          '    total_pnl_estimate FLOAT',
          '    patterns_detected TEXT NULL',
          'UNQ [userId, month, year]'], AMBER),

        (6.4, 5.0, 5.8, 3.5, 'WEBAUTHN_CREDENTIAL',
         ['PK  id           CUID',
          'FK  userId       → USER(id) CASCADE',
          '    credentialId VARCHAR UNIQUE (b64url)',
          '    publicKey    TEXT (b64url COSE)',
          '    counter      INT DEFAULT 0',
          '    deviceType   VARCHAR NULL',
          '    backedUp     BOOL DEFAULT false',
          '    transports   VARCHAR NULL (JSON)',
          '    lastUsedAt   TIMESTAMP NULL'], VIOLET),

        (12.6, 5.0, 5.8, 2.8, 'SIMULATION_RESULT',
         ['PK  id          CUID',
          'FK  userId      → USER(id) CASCADE',
          '    asset       VARCHAR NOT NULL',
          '    params      TEXT NOT NULL (JSON)',
          '    result      TEXT NOT NULL (JSON)',
          '    monthlyData TEXT NULL (JSON)',
          'IDX [userId]'], GREEN),

        (0.2, 0.5, 5.8, 2.5, 'PORTFOLIO_SNAPSHOT',
         ['PK  id      CUID',
          'FK  userId  → USER(id) CASCADE',
          '    capital FLOAT NOT NULL',
          '    month   INT NOT NULL',
          '    year    INT NOT NULL',
          'UNQ [userId, month, year]'], GREEN),

        (6.4, 0.5, 5.8, 2.2, 'AUTH_LOG',
         ['PK  id        CUID',
          '    userId    VARCHAR NULL',
          '    action    VARCHAR NOT NULL',
          '    result    VARCHAR NOT NULL',
          '    ip        VARCHAR NULL',
          '    detail    TEXT NULL'], RED),

        (12.6, 2.0, 5.8, 3.2, 'COURSE',
         ['PK  id           CUID',
          '    title        VARCHAR NOT NULL',
          '    level        ENUM(DEBUTANT..EXPERT)',
          '    category     VARCHAR NOT NULL',
          '    duration     INT (minutes)',
          '    totalLessons INT',
          '    order        INT',
          '    isPublished  BOOL DEFAULT false',
          'IDX [level] [isPublished]'], BLUE),

        (12.6, 0.3, 5.8, 1.7, 'LESSON',
         ['PK  id       CUID',
          'FK  courseId → COURSE(id) CASCADE',
          '    title, type ENUM(VIDEO/ARTICLE/QUIZ)',
          '    videoUrl?, content, duration, order'], BLUE),

        (0.2, 3.0, 5.8, 1.9, 'USER_PROGRESS',
         ['PK  id       CUID',
          'FK  userId   → USER(id) CASCADE',
          'FK  courseId → COURSE(id) SetNull',
          'FK  lessonId → LESSON(id) SetNull',
          '    completed BOOL, score INT?',
          'UNQ [userId, lessonId]'], BLUE),
    ]

    for (x, y, w, h, name, rows, bc) in tables:
        entity_box(ax, x, y, w, h, name, rows, color=GLASS,
                   border=bc, fontsize=6.8)

    # FK arrows (simplified)
    conns = [
        (3.1,9.5,  3.1,8.8,  AMBER),   # SIGNAL.userId → USER
        (9.3,9.5,  9.3,8.8,  AMBER),   # STRATEGY.userId → USER
        (3.1,5.0,  3.1,4.8,  AMBER),   # REPORT.userId → USER
        (9.3,5.0,  6.0,9.5,  VIOLET),  # WEBAUTHN → USER
        (15.5,5.0, 10.5,9.5, GREEN),   # SIMULATION → USER
        (3.1,3.0,  3.1,2.8,  BLUE),    # PROGRESS → USER (approx)
        (15.5,2.0, 15.5,1.7, BLUE),    # LESSON → COURSE
    ]
    for x1,y1,x2,y2,c in conns:
        arrow(ax, x1,y1,x2,y2, c, '->', 0.9)

    # Legend
    legend_items = [(AMBER,'Core (User/Signal/Strategy/Report)'),
                    (GREEN,'IA/Simulation'),(BLUE,'Formation'),
                    (VIOLET,'Securite MFA'),(RED,'Audit AuthLog')]
    ax.legend(handles=[mpatches.Patch(color=c,label=l) for c,l in legend_items],
              loc='upper right', fontsize=7, framealpha=0.4,
              facecolor=GLASS, edgecolor=AMBER, labelcolor=WHITE)

    save('mld.png')

# ═══════════════════════════════════════════════════════════════════════════
# 3. MPD — Modele Physique de Donnees (index + contraintes)
# ═══════════════════════════════════════════════════════════════════════════
def gen_mpd():
    fig, ax = plt.subplots(figsize=(16, 10))
    ax.set_xlim(0, 16); ax.set_ylim(0, 10)
    ax.axis('off')
    title_banner(ax, 'MPD — Modele Physique de Donnees — Alvio (PostgreSQL 15)',
                 'Index, contraintes UNIQUE, types SQL, valeurs par defaut')

    rows = [
        ('USER', 'id CHAR(25) PK', 'username UNIQUE', 'email UNIQUE', 'passwordHash TEXT NULL', 'githubId UNIQUE NULL', 'pin TEXT NULL', 'totpSecret TEXT NULL', 'totpEnabled BOOL DEFAULT false'),
        ('SIGNAL', 'id CHAR(25) PK', 'userId CHAR(25) FK+IDX', 'asset VARCHAR(20)', 'direction VARCHAR(10)', 'status VARCHAR(10) DEFAULT OPEN', 'entry_price FLOAT8', 'stop_loss FLOAT8', 'take_profit FLOAT8', 'exit_price FLOAT8 NULL', 'confidence FLOAT8', 'patterns TEXT NULL', 'indicators TEXT NULL', 'IDX(asset) IDX(strategyId)', 'IDX(strategyId,asset,direction,status)'),
        ('STRATEGY', 'id CHAR(25) PK', 'userId CHAR(25) FK+IDX', 'name TEXT', 'code TEXT (JSON StrategyRules)', 'asset VARCHAR(20)', 'timeframe VARCHAR(5)', 'status VARCHAR DEFAULT inactive', 'win_rate FLOAT8 NULL', 'profit_factor FLOAT8 NULL'),
        ('REPORT', 'id CHAR(25) PK', 'userId CHAR(25) FK+IDX', 'month SMALLINT', 'year SMALLINT', 'UNIQUE(userId,month,year)', 'total_signals INT', 'win_rate FLOAT8', 'avg_confidence FLOAT8', 'total_pnl_estimate FLOAT8'),
        ('WEBAUTHN_CRED', 'id CHAR(25) PK', 'userId CHAR(25) FK+IDX', 'credentialId TEXT UNIQUE', 'publicKey TEXT', 'counter INT DEFAULT 0', 'deviceType VARCHAR(20) NULL', 'transports TEXT NULL'),
        ('SIMULATION_RESULT', 'id CHAR(25) PK', 'userId CHAR(25) FK+IDX', 'asset VARCHAR(20)', 'params TEXT NOT NULL', 'result TEXT NOT NULL', 'monthlyData TEXT NULL'),
        ('PORTFOLIO_SNAPSHOT', 'id CHAR(25) PK', 'userId CHAR(25) FK', 'capital FLOAT8', 'month SMALLINT', 'year SMALLINT', 'UNIQUE(userId,month,year)'),
        ('AUTH_LOG', 'id CHAR(25) PK', 'userId TEXT NULL (pas FK)', 'action VARCHAR(50)', 'result VARCHAR(20)', 'ip VARCHAR(45) NULL', 'createdAt TIMESTAMPTZ DEFAULT now()'),
        ('COURSE', 'id CHAR(25) PK', 'title TEXT', 'level VARCHAR(15) CHECK(IN ENUM)', 'category VARCHAR(50)', 'duration INT', 'totalLessons INT', 'order INT', 'isPublished BOOL DEFAULT false', 'IDX(level) IDX(isPublished)'),
        ('LESSON', 'id CHAR(25) PK', 'courseId CHAR(25) FK CASCADE IDX', 'title TEXT', 'type VARCHAR(10) CHECK(IN ENUM)', 'videoUrl TEXT NULL', 'order INT'),
        ('USER_PROGRESS', 'id CHAR(25) PK', 'userId FK CASCADE', 'courseId FK SetNull NULL', 'lessonId FK SetNull NULL', 'completed BOOL DEFAULT false', 'score SMALLINT NULL', 'UNIQUE(userId,lessonId)'),
    ]

    colors = [AMBER,AMBER,AMBER,AMBER,VIOLET,GREEN,GREEN,RED,BLUE,BLUE,BLUE]
    ncols = 4
    nrows_disp = math.ceil(len(rows) / ncols)
    col_w = 3.7
    row_h = 0.72

    for i, (table, *fields) in enumerate(rows):
        col = i % ncols
        row = i // ncols
        x = 0.2 + col * col_w
        y = 9.3 - row * (nrows_disp * row_h / nrows_disp + 0.1) * nrows_disp * row_h / (nrows_disp * row_h)
        # simplified layout
        total_h = (len(fields) + 1) * 0.19 + 0.35
        yy = 9.2 - row * 3.2
        entity_box(ax, x, yy - total_h + 0.35, col_w - 0.2, total_h,
                   table, fields, border=colors[i], fontsize=6.2)

    save('mpd.png')

# ═══════════════════════════════════════════════════════════════════════════
# 4. Diagramme de Classes NestJS
# ═══════════════════════════════════════════════════════════════════════════
def gen_classes():
    fig, ax = plt.subplots(figsize=(20, 13))
    ax.set_xlim(0, 20); ax.set_ylim(0, 13)
    ax.axis('off')
    title_banner(ax, 'Diagramme de Classes — Architecture NestJS Alvio',
                 'Controllers, Services, Python bridge, Claude API')

    # Controllers layer
    controllers = [
        (0.2, 10.5, 3.8, 2.0, 'AuthController', ['/auth/*', 'register()', 'login()', 'magicLink()', 'github()', 'refresh()', 'logout()'], AMBER),
        (4.3, 10.5, 3.8, 2.0, 'StrategiesController', ['/strategies', 'findAll()', 'analyze(id)', 'import(file, dto)'], AMBER),
        (8.4, 10.5, 3.8, 2.0, 'SignalsController', ['/signals', 'getSignals()', 'createSignal()', 'generateSignal()', 'scanNow()'], AMBER),
        (12.5, 10.5, 3.8, 2.0, 'MarketsController', ['/markets', 'getTop()', 'getDetail(id)', 'getOhlcv(id, days)'], AMBER),
        (16.6, 10.5, 3.2, 2.0, 'FormationController', ['/formation', 'getCourses()', 'getCourse(id)', 'getLesson(id)', 'markComplete()', 'progress()'], AMBER),
    ]
    for x,y,w,h,name,fields,bc in controllers:
        entity_box(ax, x, y, w, h, name, fields, border=bc, fontsize=7)
    ax.text(10.0, 12.75, 'COUCHE CONTROLLERS (HTTP)', ha='center', fontsize=9,
            color=AMBER, fontweight='bold')

    # Services layer
    services = [
        (0.2, 6.8, 3.8, 3.2, 'AuthService', ['+ register(dto, res)', '+ login(dto, res)', '+ requestMagicLink(email)', '+ verifyMagicLink(token)', '+ handleGithubCallback()', '+ verify2FA(token, otp)', '+ verifyPin(token, pin)', '+ setupPin(token, pin)', '+ issueTokens(userId)', '+ refresh(req, res)', '+ logout(req, res)', '- recordFailure()', '- trackIpFailure()'], VIOLET),
        (4.3, 6.8, 3.8, 3.2, 'StrategiesService', ['+ findAllByUser(userId)', '+ analyzeById(id, userId)', '  → AIService.analyzeDoc()', '+ importFromDocument(file)', '  → pdf-parse v2 PDFParse', '  → AIService.analyzeDoc()', '  → Prisma.strategy.create()', '- extractText(file)'], VIOLET),
        (8.4, 6.8, 3.8, 3.2, 'SignalsService', ['+ generateSignal(userId, dto)', '  → PatternDetectionService', '  → Prisma.signal.create()', '  → EmailService.notify()', '+ createSignal(userId, dto)', '+ getUserSignals(userId)', '+ getRecentSignals()', '+ getSignalsStatistics()'], VIOLET),
        (12.5, 6.8, 3.8, 3.2, 'MarketsService', ['+ getTopCoins()  [cache:60s]', '+ getCoinDetail(id)  [30s]', '+ getOhlcv(id, days)  [TTL var]', '- fetchCoinGecko(path, params)', '  → retry on 429 (2s wait)', '- cacheGet/Set(key, val, ttl)', '  → :stale copy (1h fallback)', '- ohlcTtl(days)'], VIOLET),
        (16.6, 6.8, 3.2, 3.2, 'FormationService', ['+ getCourses(userId)', '+ getCourseById(id)', '+ getLessonById(id)', '+ markLessonComplete()', '+ getUserProgress()'], VIOLET),
    ]
    for x,y,w,h,name,fields,bc in services:
        entity_box(ax, x, y, w, h, name, fields, border=bc, fontsize=6.7)
    ax.text(10.0, 10.2, 'COUCHE SERVICES (Logique metier)', ha='center',
            fontsize=9, color=VIOLET, fontweight='bold')

    # Infrastructure layer
    infra = [
        (0.2, 3.5, 3.8, 2.8, 'AIService', ['+ analyzeStrategyDocument(text)', '  Model: claude-sonnet-4-6', '  → Anthropic.messages.create()', '  → cleanJsonResponse()', '  → validateStrategyRules()', '+ detectPatterns(asset, data)', '+ generateSignal(asset, data)', '+ backtestStrategy() [stub]'], GREEN),
        (4.3, 3.5, 3.8, 2.8, 'PatternDetectionService', ['+ detectPattern(stratId, asset)', '  → Prisma.strategy.findUnique', '  → MarketsService.getOhlcv()', '  → transformOhlcv(response)', '  → runPatternDetector(input)', '- spawn python3', '    /app/ai-module/pattern_detector.py', '  stdin: JSON → stdout: JSON'], GREEN),
        (8.4, 3.5, 3.8, 2.8, 'SimulatorService', ['+ simulateDCA(userId, dto)', '  mode: fixed | monte_carlo', '  Box-Muller Gaussian noise', '  → Prisma.simulationResult.create()', '+ getHistory(userId)'], GREEN),
        (12.5, 3.5, 3.8, 2.8, 'LoggingService + MetricsService', ['LoggingService:', '+ authSuccess/Failure()', '+ accountLocked()', '+ suspiciousIp()', '  → Prisma AuthLog', '  → RFC 5424 Syslog UDP', 'MetricsService:', '  prom-client counters/histogram'], GREEN),
        (16.6, 3.5, 3.2, 2.8, 'TOTPService + WebAuthnService', ['TOTPService:', '  otplib TOTP RFC 6238', '  AES-256-GCM encrypt', 'WebAuthnService:', '  @simplewebauthn/server', '  userVerification=required', '  counter anti-replay'], GREEN),
    ]
    for x,y,w,h,name,fields,bc in infra:
        entity_box(ax, x, y, w, h, name, fields, border=bc, fontsize=6.5)
    ax.text(10.0, 6.5, 'COUCHE INFRASTRUCTURE (Services bases)', ha='center',
            fontsize=9, color=GREEN, fontweight='bold')

    # Data layer
    data_layer = [
        (0.2, 0.3, 5.8, 2.8, 'PrismaService', ['ORM Prisma v5 — PostgreSQL 15', '11 modeles : User, Signal, Strategy,', 'Report, Course, Lesson, UserProgress,', 'WebAuthnCredential, SimulationResult,', 'PortfolioSnapshot, AuthLog', 'Requetes parametrees (0 SQLi)', '@Global() @Injectable()'], LIGHT),
        (6.3, 0.3, 3.8, 2.8, 'RedisService', ['ioredis v5 — @Global()', 'get(key) / set(key,val,ttl)', 'del(key) / incr(key)', 'Usages:', '  refresh:{jti} → userId', '  magic:{token} → email', '  preauth:{token} → {userId,otp}', '  fail:{step}:{userId} → count', '  locked:{userId} → true', '  markets:{key} → JSON cache'], LIGHT),
        (10.3, 0.3, 3.8, 2.8, 'EmailService', ['Nodemailer + SMTP', 'sendOTP(email, otp)', 'sendMagicLink(email, link)', 'sendVerificationEmail()', 'sendSignalNotification(emails, data)', '→ Gmail SMTP (app password)'], LIGHT),
        (14.3, 0.3, 5.5, 2.8, 'External APIs', ['CoinGecko REST API (v3)', '  /coins/markets?vs_currency=usd', '  /coins/{id}/ohlc', '  /coins/{id}/market_chart', '  Header: x-cg-demo-api-key', 'Anthropic Claude API', '  SDK @anthropic-ai/sdk ^0.100.1', '  Model: claude-sonnet-4-6', '  max_tokens: 4096'], LIGHT),
    ]
    for x,y,w,h,name,fields,bc in data_layer:
        entity_box(ax, x, y, w, h, name, fields, border=bc, fontsize=6.5)
    ax.text(10.0, 3.2, 'COUCHE DONNEES / EXTERNE', ha='center',
            fontsize=9, color=LIGHT, fontweight='bold')

    # Horizontal separator lines
    for yy, col in [(10.3, AMBER), (6.6, VIOLET), (3.3, GREEN), (3.1, LIGHT)]:
        ax.axhline(y=yy, color=col, linewidth=0.5, alpha=0.4, linestyle='--')

    save('classes.png')

# ═══════════════════════════════════════════════════════════════════════════
# 5. Diagramme de cas d'utilisation
# ═══════════════════════════════════════════════════════════════════════════
def gen_use_cases():
    fig, ax = plt.subplots(figsize=(16, 12))
    ax.set_xlim(0, 16); ax.set_ylim(0, 12)
    ax.axis('off')
    title_banner(ax, "Diagramme de Cas d'Utilisation — Alvio",
                 'Acteurs : Trader (principal), Claude API, CoinGecko, SMTP')

    # System boundary
    sys_box = FancyBboxPatch((2.5, 0.5), 10.5, 11.0,
                              boxstyle='round,pad=0.1',
                              linewidth=2, edgecolor=VIOLET,
                              facecolor='none', zorder=1)
    ax.add_patch(sys_box)
    ax.text(7.75, 11.3, 'Systeme Alvio', ha='center', fontsize=10,
            color=VIOLET, fontweight='bold')

    def actor(ax, x, y, label, color=WHITE):
        # Stick figure
        ax.plot(x, y+0.55, 'o', ms=14, color=color, zorder=5)  # head
        ax.plot([x,x], [y+0.42, y+0.05], color=color, lw=2, zorder=5)  # body
        ax.plot([x-0.25,x+0.25], [y+0.28, y+0.28], color=color, lw=2, zorder=5)  # arms
        ax.plot([x,x-0.2], [y+0.05, y-0.2], color=color, lw=2, zorder=5)  # left leg
        ax.plot([x,x+0.2], [y+0.05, y-0.2], color=color, lw=2, zorder=5)  # right leg
        ax.text(x, y-0.38, label, ha='center', va='top', fontsize=8,
                color=color, fontweight='bold')

    def usecase(ax, x, y, w, h, text, color=GLASS, border=GREEN):
        e = mpatches.Ellipse((x, y), w, h, color=color, ec=border, lw=1.5, zorder=3)
        ax.add_patch(e)
        lines = text.split('\n')
        for i, line in enumerate(lines):
            ax.text(x, y + (len(lines)-1)*0.1 - i*0.2, line,
                    ha='center', va='center', fontsize=7, color=WHITE, zorder=4)

    def uc_arrow(ax, x1, y1, x2, y2, color=LIGHT):
        ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.0))

    # Actors
    actor(ax, 0.9, 5.5, 'Trader\n(Utilisateur)', AMBER)
    actor(ax, 15.1, 9.5, 'Claude API\n(Anthropic)', GREEN)
    actor(ax, 15.1, 6.5, 'CoinGecko\nAPI', BLUE)
    actor(ax, 15.1, 3.5, 'SMTP\n(Email)', LIGHT)

    # Use cases — Auth
    uc_data = [
        (5.5, 10.3, 3.8, 0.55, "S'inscrire\n(email/password)", GREEN),
        (5.5, 9.3,  3.8, 0.55, "Se connecter\n(login + OTP/PIN)", GREEN),
        (5.5, 8.3,  3.8, 0.55, "Magic Link\n(email)", GREEN),
        (5.5, 7.3,  3.8, 0.55, "GitHub OAuth", GREEN),
        (5.5, 6.3,  3.8, 0.55, "Configurer TOTP\n/ WebAuthn", GREEN),
        # Markets
        (9.8, 10.3, 3.8, 0.55, "Voir prix marche\n(top 20 cryptos)", BLUE),
        (9.8, 9.3,  3.8, 0.55, "Graphique chandelier\nOHLCV", BLUE),
        # IA
        (9.8, 8.1,  3.8, 0.60, "Importer PDF\nstrategie", AMBER),
        (9.8, 7.0,  3.8, 0.60, "Analyser via\nClaude AI", AMBER),
        (9.8, 5.9,  3.8, 0.55, "Detecter patterns\n(Python bridge)", AMBER),
        (9.8, 4.9,  3.8, 0.55, "Voir signaux\nBUY/SELL", AMBER),
        # Formation
        (5.5, 5.1,  3.8, 0.55, "Suivre cours\n(LMS)", VIOLET),
        (5.5, 4.1,  3.8, 0.55, "Lire lecon\n(VIDEO/ARTICLE/QUIZ)", VIOLET),
        # Simulator
        (5.5, 3.0,  3.8, 0.55, "Simuler DCA\n(interet compose)", GREEN),
        (5.5, 2.0,  3.8, 0.55, "Voir rapports\nmensuels", GREEN),
        (9.8, 3.8,  3.8, 0.55, "Notifications\nEmail signal", LIGHT),
        (9.8, 2.7,  3.8, 0.55, "Gerer profil\n+ securite MFA", VIOLET),
        (9.8, 1.6,  3.8, 0.55, "Scanner strategies\n(scheduler 15min)", AMBER),
    ]
    for x,y,w,h,text,col in uc_data:
        usecase(ax, x, y, w, h, text, border=col)

    # Actor → UC arrows
    for uy in [10.3,9.3,8.3,7.3,6.3,5.1,4.1,3.0,2.0]:
        uc_arrow(ax, 1.4, 6.0, 3.6, uy, AMBER)
    for uy in [10.3,9.3,8.1,7.0,5.9,4.9,3.8,2.7,1.6]:
        uc_arrow(ax, 1.4, 6.0, 7.9, uy, AMBER)

    # External actor arrows
    uc_arrow(ax, 14.6, 9.8, 11.7, 8.3, GREEN)   # Claude → importer
    uc_arrow(ax, 14.6, 9.8, 11.7, 7.1, GREEN)   # Claude → analyser
    uc_arrow(ax, 14.6, 6.8, 11.7, 10.0, BLUE)   # CoinGecko → prix
    uc_arrow(ax, 14.6, 6.8, 11.7, 9.0, BLUE)    # CoinGecko → graphique
    uc_arrow(ax, 14.6, 3.8, 7.4, 3.3, LIGHT)    # SMTP → notif

    save('use_cases.png')

# ═══════════════════════════════════════════════════════════════════════════
# 6. Sequence — Creation strategie IA (PDF → Claude → Signal)
# ═══════════════════════════════════════════════════════════════════════════
def gen_seq_strategy():
    fig, ax = plt.subplots(figsize=(18, 12))
    ax.set_xlim(0, 18); ax.set_ylim(0, 12)
    ax.axis('off')
    title_banner(ax, 'Diagramme de Sequence — Import PDF et Analyse IA',
                 'Upload PDF → pdf-parse → Claude API → StrategyRules JSON → Signal')

    participants = [
        (1.2,  'Trader\n(Browser)'),
        (4.0,  'Next.js\nFrontend'),
        (6.8,  'NestJS\nAPI'),
        (9.6,  'Strategies\nService'),
        (12.4, 'AIService\nClaude'),
        (15.2, 'Pattern\nDetector'),
        (17.2, 'Claude API\n(Anthropic)'),
    ]
    colors = [AMBER, GREEN, VIOLET, VIOLET, GREEN, GREEN, AMBER]

    # Lifeline header boxes
    for (x, label), col in zip(participants, colors):
        rect = FancyBboxPatch((x-0.65, 10.5), 1.3, 1.2,
                              boxstyle='round,pad=0.05',
                              facecolor=GLASS, edgecolor=col, lw=1.5, zorder=3)
        ax.add_patch(rect)
        for i, line in enumerate(label.split('\n')):
            ax.text(x, 11.2 - i*0.38, line, ha='center', va='center',
                    fontsize=7.5, color=col, fontweight='bold', zorder=4)

    # Lifelines (dashed vertical)
    for (x, _) in participants:
        ax.plot([x,x], [0.3, 10.5], color=LIGHT, lw=0.8,
                linestyle='--', alpha=0.5, zorder=1)

    def seq_arrow(y, x1, x2, label, col=WHITE, ret=False):
        style = '<-' if ret else '->'
        offset = 0.08
        ax.annotate('', xy=(x2, y), xytext=(x1+offset if x2>x1 else x1-offset, y),
                    arrowprops=dict(arrowstyle=style, color=col, lw=1.2))
        mx = (x1+x2)/2
        ax.text(mx, y+0.12, label, ha='center', va='bottom',
                fontsize=7, color=col, style='italic')

    def note(y, x, text, col=GLASS, tc=WHITE):
        rect = FancyBboxPatch((x-0.05, y-0.18), 3.5, 0.4,
                               boxstyle='round,pad=0.03',
                               facecolor=col, edgecolor=AMBER, lw=0.8, zorder=4)
        ax.add_patch(rect)
        ax.text(x+1.7, y+0.02, text, ha='center', va='center',
                fontsize=6.5, color=tc, zorder=5)

    # Sequence steps
    steps = [
        (9.8,  1.2, 4.0,  'POST /strategies/import\n(multipart/form-data, file PDF)', AMBER, False),
        (9.2,  4.0, 6.8,  'POST /strategies/import\n(Axios + JWT Bearer header)', GREEN, False),
        (8.6,  6.8, 9.6,  'importFromDocument(file, dto, userId)', VIOLET, False),
        (8.0,  9.6, 6.8,  'extractText(file)\n pdf-parse v2 PDFParse.getText()', VIOLET, False),
        (7.5,  6.8, 9.6,  'rawText (string, max 15 000 chars)', VIOLET, True),
        (6.9,  9.6, 12.4, 'analyzeStrategyDocument(text)', GREEN, False),
        (6.3,  12.4, 17.2,'messages.create({\n  model: claude-sonnet-4-6, max_tokens:4096\n  system: SYSTEM_PROMPT, messages:[text] })', AMBER, False),
        (5.5,  17.2, 12.4,'{ content: [{ type:text, text: JSON_STRING }] }', AMBER, True),
        (4.9,  12.4, 9.6, 'cleanJsonResponse() + JSON.parse()\n→ StrategyRules validated', GREEN, True),
        (4.3,  9.6, 6.8,  'Prisma.strategy.create({ code: JSON.stringify(rules) })', VIOLET, False),
        (3.7,  6.8, 15.2, 'PatternDetectionService.detectPattern(strategyId, asset)', GREEN, False),
        (3.1,  15.2, 6.8, 'spawn python3 pattern_detector.py\n[stdin: JSON] → [stdout: PatternDetectionResult]', GREEN, True),
        (2.4,  6.8, 4.0,  '{ message, strategy, rules }\n+ signal si ENTRY_SIGNAL', VIOLET, True),
        (1.8,  4.0, 1.2,  '200 OK — strategie creee\n(affichage rules JSON + signal)', GREEN, True),
    ]

    for y, x1, x2, label, col, ret in steps:
        seq_arrow(y, x1, x2, label, col, ret)

    # Activation boxes
    for (x, _) in participants[2:5]:
        ax.add_patch(FancyBboxPatch((x-0.08, 2.0), 0.16, 7.8,
                                    boxstyle='square,pad=0',
                                    facecolor=VIOLET, edgecolor='none',
                                    alpha=0.25, zorder=2))

    # Labels on the left
    labels_left = [
        (9.5, '1.'),  (8.9, '2.'),  (8.3, '3.'),
        (7.7, '4.'),  (7.2, '5.'),  (6.6, '6.'),
        (6.0, '7.'),  (5.2, '8.'),  (4.6, '9.'),
        (4.0, '10.'), (3.4, '11.'), (2.8, '12.'),
        (2.1, '13.'), (1.5, '14.'),
    ]
    for y, lbl in labels_left:
        ax.text(0.1, y, lbl, fontsize=7, color=LIGHT, va='center')

    save('seq_strategy.png')

# ═══════════════════════════════════════════════════════════════════════════
# 7. Sequence — Authentification (login multi-facteurs)
# ═══════════════════════════════════════════════════════════════════════════
def gen_seq_auth():
    fig, ax = plt.subplots(figsize=(16, 11))
    ax.set_xlim(0, 16); ax.set_ylim(0, 11)
    ax.axis('off')
    title_banner(ax, 'Diagramme de Sequence — Authentification Multi-Facteurs',
                 'email/password → OTP email → PIN → JWT (access+refresh)')

    participants = [
        (1.0,  'Trader\n(Browser)'),
        (3.5,  'Next.js\nFrontend'),
        (6.0,  'NestJS\nAuthController'),
        (8.5,  'AuthService'),
        (11.0, 'Redis'),
        (13.5, 'Prisma\nPostgreSQL'),
        (15.5, 'SMTP\nEmail'),
    ]
    colors = [AMBER, GREEN, VIOLET, VIOLET, RED, LIGHT, LIGHT]

    for (x, label), col in zip(participants, colors):
        rect = FancyBboxPatch((x-0.58, 9.7), 1.16, 1.1,
                              boxstyle='round,pad=0.04',
                              facecolor=GLASS, edgecolor=col, lw=1.5, zorder=3)
        ax.add_patch(rect)
        for i, line in enumerate(label.split('\n')):
            ax.text(x, 10.3 - i*0.35, line, ha='center', va='center',
                    fontsize=7, color=col, fontweight='bold', zorder=4)
        ax.plot([x,x], [0.3, 9.7], color=LIGHT, lw=0.7,
                linestyle='--', alpha=0.4, zorder=1)

    def sarrow(y, x1, x2, label, col=WHITE, ret=False):
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle='<-' if ret else '->',
                                   color=col, lw=1.1))
        ax.text((x1+x2)/2, y+0.1, label, ha='center', va='bottom',
                fontsize=6.5, color=col, style='italic')

    def box(y, x, w, h, text, col=GLASS):
        ax.add_patch(FancyBboxPatch((x, y), w, h,
                                    boxstyle='round,pad=0.03',
                                    facecolor=col, edgecolor=AMBER, lw=0.7, zorder=4))
        ax.text(x+w/2, y+h/2, text, ha='center', va='center',
                fontsize=6.5, color=WHITE, zorder=5)

    # Phase 1: Login
    box(8.8, 0.05, 5.0, 0.35, 'PHASE 1 : Facteur 1 — Email/Mot de passe', '#1e3a5f')
    sarrow(8.5, 1.0, 3.5, 'POST /auth/login { email, password }', AMBER)
    sarrow(8.0, 3.5, 6.0, 'POST /auth/login', GREEN)
    sarrow(7.5, 6.0, 8.5, 'login(dto, res)', VIOLET)
    sarrow(7.0, 8.5, 13.5,'findUnique({ where: { email } })', LIGHT)
    sarrow(6.5, 13.5, 8.5,'User { id, passwordHash, ... }', LIGHT, True)
    sarrow(6.0, 8.5, 8.5, 'checkLocked(userId) → Redis get(locked:{id})', RED)
    sarrow(5.5, 8.5, 8.5, 'bcrypt.compare(password, passwordHash)', VIOLET)

    # Phase 2: OTP
    box(5.1, 0.05, 5.2, 0.35, 'PHASE 2 : Facteur 2 — OTP Email', '#1e3a5f')
    sarrow(4.8, 8.5, 11.0,'set(preauth:{token}, {userId,otp}, 600s)', RED)
    sarrow(4.3, 8.5, 15.5,'sendOTP(email, otp)', LIGHT)
    sarrow(3.9, 8.5, 3.5, '{ preAuthToken }', VIOLET, True)
    sarrow(3.4, 3.5, 1.0, '{ preAuthToken } → page 2FA', GREEN, True)
    sarrow(2.9, 1.0, 3.5, 'POST /auth/2fa/verify { preAuthToken, otp }', AMBER)
    sarrow(2.4, 3.5, 6.0, 'verify2FA(preAuthToken, otp)', GREEN)
    sarrow(1.9, 6.0, 8.5, 'verify2FA(token, otp)', VIOLET)
    sarrow(1.4, 8.5, 11.0,'get(preauth:{token}) → {userId,email,otp}', RED)

    # Phase 3: JWT
    box(0.95, 0.05, 5.2, 0.35, 'PHASE 3 : Emission tokens JWT (JTI rotation)', '#1e3a5f')
    sarrow(0.65, 8.5, 11.0,'set(refresh:{jti}, userId, 7j)', RED)
    sarrow(0.35, 8.5, 3.5, 'accessToken (15min) + httpOnly cookie (7j)', AMBER, True)

    save('seq_auth.png')

# ═══════════════════════════════════════════════════════════════════════════
# 8. Architecture globale
# ═══════════════════════════════════════════════════════════════════════════
def gen_architecture():
    fig, ax = plt.subplots(figsize=(20, 14))
    ax.set_xlim(0, 20); ax.set_ylim(0, 14)
    ax.axis('off')
    title_banner(ax, 'Architecture Globale — Alvio',
                 'Next.js → NestJS → PostgreSQL/Redis + Python spawn stdin/stdout + Claude API + CoinGecko')

    def zone(ax, x, y, w, h, title, color, alpha=0.08):
        rect = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.15',
                              linewidth=2, edgecolor=color,
                              facecolor=color, alpha=alpha, zorder=1)
        ax.add_patch(rect)
        ax.text(x+w/2, y+h+0.05, title, ha='center', va='bottom',
                fontsize=9, color=color, fontweight='bold')

    def box(ax, x, y, w, h, title, lines=None, color=GLASS, border=WHITE, fontsize=8):
        rect = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.08',
                              linewidth=1.5, edgecolor=border,
                              facecolor=color, zorder=3)
        ax.add_patch(rect)
        ax.text(x+w/2, y+h-0.3, title, ha='center', va='top',
                fontsize=fontsize, color=border, fontweight='bold', zorder=4)
        if lines:
            for i, l in enumerate(lines):
                ax.text(x+w/2, y+h-0.6-i*0.28, l, ha='center', va='top',
                        fontsize=fontsize-1.5, color=LIGHT, zorder=4)

    def conn(ax, x1, y1, x2, y2, label='', col=LIGHT, style='->', lw=1.5):
        ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
                    arrowprops=dict(arrowstyle=style, color=col, lw=lw,
                                   connectionstyle='arc3,rad=0.05'))
        if label:
            ax.text((x1+x2)/2+0.1, (y1+y2)/2+0.1, label,
                    fontsize=6.5, color=col, ha='center', zorder=6)

    # ── Zones ────────────────────────────────────────────────────────────
    zone(ax,  0.2, 9.5, 5.6, 4.0,  'CLIENTS',        AMBER)
    zone(ax,  6.2, 9.5, 7.8, 4.0,  'API GATEWAY — NestJS 10', VIOLET)
    zone(ax,  0.2, 4.5, 13.6, 4.7, 'SERVICES METIER', GREEN)
    zone(ax,  0.2, 0.3, 13.6, 3.9, 'DONNEES & CACHE', LIGHT)
    zone(ax, 14.2, 0.3, 5.6, 13.2, 'SERVICES EXTERNES', AMBER)

    # ── Clients ──────────────────────────────────────────────────────────
    box(ax, 0.4, 11.5, 2.4, 1.6, 'Next.js 13\nWeb App',
        ['Port 3000', 'Zustand + Axios', 'TailwindCSS', 'lightweight-charts', 'Framer Motion'],
        GLASS, AMBER)
    box(ax, 3.2, 11.5, 2.4, 1.6, 'React Native\nMobile App',
        ['Expo 49', 'react-navigation', 'Axios interceptors', 'AsyncStorage'],
        GLASS, AMBER)
    box(ax, 0.4, 9.8, 5.2, 1.5, 'Auth Store (Zustand)',
        ['accessToken in-memory', 'refresh_token httpOnly cookie', 'auto-refresh on 401'],
        GLASS, GREEN)

    # ── API Gateway ───────────────────────────────────────────────────────
    box(ax, 6.4, 12.5, 3.4, 0.8, 'Middleware Stack',
        ['Helmet, CORS, CookieParser'], GLASS, VIOLET)
    box(ax, 6.4, 11.2, 3.4, 1.1, 'Guards / Strategies',
        ['JwtAuthGuard, JwtGuard', 'Passport-JWT, Passport-GitHub'], GLASS, VIOLET)
    box(ax, 10.0, 12.5, 3.8, 0.8, 'Controllers (14)',
        ['auth · markets · strategies', 'signals · formation · ai'], GLASS, AMBER)
    box(ax, 10.0, 11.2, 3.8, 1.1, 'DTOs + Validators',
        ['class-validator', 'ParseFilePipe, FileTypeValidator', 'MaxFileSizeValidator (10 MB)'], GLASS, AMBER)
    box(ax, 6.4, 9.8,  7.4, 1.2, 'Rate Limiting & Logging',
        ['Redis fail counter / IP tracking / account lockout (MAX_AUTH_FAILURES)',
         'LoggingService → Prisma AuthLog + RFC 5424 Syslog UDP → Logstash'], GLASS, RED)

    # ── Services ──────────────────────────────────────────────────────────
    services_pos = [
        (0.4, 7.0, 2.0, 1.7, 'AuthService', ['bcrypt 12 rounds', 'MFA orchestration', 'JTI rotation', 'TOTP/WebAuthn'], VIOLET),
        (2.6, 7.0, 2.0, 1.7, 'MarketsService', ['CoinGecko fetch', 'Cache Redis TTL', 'Stale fallback 429', 'candle/line mode'], BLUE),
        (4.8, 7.0, 2.0, 1.7, 'StrategiesService', ['pdf-parse v2', 'text → Claude', 'StrategyRules', 'Prisma.create()'], GREEN),
        (7.0, 7.0, 2.0, 1.7, 'SignalsService', ['Pattern detect.', 'BUY/SELL logic', 'long-only design', 'email notify'], AMBER),
        (9.2, 7.0, 2.0, 1.7, 'FormationService', ['getCourses()', 'getLessons()', 'markComplete()', 'progress track'], BLUE),
        (11.4, 7.0, 2.0, 1.7, 'SimulatorService', ['DCA mode:fixed', 'monte_carlo', 'Box-Muller noise', 'Prisma persist'], GREEN),
        (0.4, 4.8, 2.0, 1.7, 'AIService', ['analyzeDoc(text)', 'Claude Sonnet 4', 'validateRules()', 'cleanJson()'], GREEN),
        (2.6, 4.8, 2.0, 1.7, 'PatternDetect.', ['detectPattern()', 'spawn python3', 'stdin→stdout', 'JSON parse'], GREEN),
        (4.8, 4.8, 2.0, 1.7, 'TOTPService', ['otplib RFC6238', 'AES-256-GCM', 'QR code gen', 'enrollConfirm()'], VIOLET),
        (7.0, 4.8, 2.0, 1.7, 'WebAuthnService', ['SimpleWebAuthn', 'userVerif=req', 'counter check', 'transports'], VIOLET),
        (9.2, 4.8, 2.0, 1.7, 'LoggingService', ['authSuccess/Fail', 'accountLocked', 'suspiciousIp', '→ Syslog UDP'], RED),
        (11.4, 4.8, 2.0, 1.7, 'MetricsService', ['prom-client', 'auth_attempts', 'auth_latency', 'active_sessions'], RED),
    ]
    for x,y,w,h,name,lines,bc in services_pos:
        box(ax, x, y, w, h, name, lines, GLASS, bc, 7)

    # ── Data Layer ────────────────────────────────────────────────────────
    box(ax, 0.4, 0.5, 4.0, 3.5, 'PostgreSQL 15',
        ['Prisma ORM v5', '11 modeles', 'User, Signal, Strategy,', 'Report, Course, Lesson,', 'UserProgress, WebAuthn,', 'SimulationResult,', 'Portfolio, AuthLog'], GLASS, LIGHT)
    box(ax, 4.6, 0.5, 4.0, 3.5, 'Redis 7',
        ['refresh:{jti} → userId (7j)', 'magic:{token} → email (15m)', 'preauth:{token} → {id,otp}', 'fail:{step}:{id} → count', 'locked:{id} → true', 'markets:top20 → JSON (60s)', 'markets:ohlcv:{id}:{d} → JSON'], GLASS, RED),
    box(ax, 8.8, 0.5, 4.8, 3.5, 'Python AI Module\n(ai-module/)',
        ['pattern_detector.py  ← spawn stdin/stdout',
         'signal_generator.py  SignalGenerator',
         'candlestick_patterns.py  CandlestickPatternDetector',
         'chart_patterns.py  ChartPatternDetector',
         'indicators_calculator.py  RSI/MACD/BB/ATR',
         'scoring_engine.py  ScoringEngine',
         'elliott_waves.py + harmonic_patterns.py',
         'dca_simulator.py + report_generator.py'], GLASS, GREEN)

    # ── External APIs ─────────────────────────────────────────────────────
    box(ax, 14.4, 10.5, 5.0, 2.8, 'Claude API (Anthropic)',
        ['SDK: @anthropic-ai/sdk ^0.100.1', 'Model: claude-sonnet-4-6', 'max_tokens: 4096', 'system: SYSTEM_PROMPT (JSON strict)', 'response: StrategyRules JSON', '→ entry/exit conditions', '→ indicators + risk_management'], GLASS, GREEN)
    box(ax, 14.4, 7.3, 5.0, 2.8, 'CoinGecko REST API',
        ['Base: api.coingecko.com/api/v3', '/coins/markets (top 20, sparkline)', '/coins/{id}/ohlc (chandeliers)', '/coins/{id}/market_chart (line)', 'Header: x-cg-demo-api-key', '429 → wait 2s → retry → stale cache', 'Proxy Next.js: /api/coingecko/*'], GLASS, BLUE)
    box(ax, 14.4, 4.5, 5.0, 2.5, 'SMTP / Email',
        ['Nodemailer + Gmail SMTP', 'sendOTP(email, otp 6 chiffres)', 'sendMagicLink(email, link)', 'sendSignalNotification(emails, signal)', '→ fire-and-forget (non bloquant)'], GLASS, LIGHT)
    box(ax, 14.4, 0.5, 5.0, 3.7, 'Monitoring Stack',
        ['Prometheus :9090', '  scrape NestJS /metrics (15s)', '  4 counters + 1 histogram + 1 gauge', 'Grafana :3003', '  17 panels MFA security dashboard', 'Elasticsearch :9200', '  index brokeria-security-YYYY.MM.DD', 'Kibana :5601', '  5 regles SIEM detection', 'Logstash :514/udp', '  RFC 5424 → Grok → ES'], GLASS, RED)

    # ── Connexions principales ────────────────────────────────────────────
    conn(ax, 2.8, 11.5, 6.4, 12.0, 'HTTPS\nJWT', AMBER, '->', 2.0)
    conn(ax, 4.4, 11.5, 6.4, 12.0, 'HTTPS\nJWT', AMBER, '->', 2.0)
    conn(ax, 10.0, 9.8, 14.4, 11.9, 'messages.create()', GREEN, '->', 1.5)
    conn(ax, 2.6, 7.0,  14.4, 8.7, 'fetchCoinGecko()', BLUE, '->', 1.5)
    conn(ax, 2.6, 5.5,  8.8, 2.5,  'spawn python3\nstdin JSON\nstdout JSON', GREEN, '<->', 2.0)
    conn(ax, 0.4, 5.5,  0.4, 4.0,  'Prisma.model.*', LIGHT, '->', 1.5)
    conn(ax, 2.6, 5.5,  4.6, 2.5,  'Redis get/set/del', RED, '->', 1.5)

    save('architecture.png')

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print('Generating Alvio diagrams...')
    gen_mcd()
    gen_mld()
    gen_mpd()
    gen_classes()
    gen_use_cases()
    gen_seq_strategy()
    gen_seq_auth()
    gen_architecture()
    print(f'\nDone — 8 PNG in {OUT}')
