# -*- coding: utf-8 -*-
"""
Générateur du Rapport de Projet CDA — Alvio
Adam Ijjai — Titre RNCP 37873 (CDA) — 2025-2026
"""

import os, sys, textwrap, io
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Couleurs Alvio ──────────────────────────────────────────────────────────
NAVY    = colors.HexColor('#0f172a')
AMBER   = colors.HexColor('#f59e0b')
GREEN   = colors.HexColor('#10b981')
VIOLET  = colors.HexColor('#6366f1')
GLASS   = colors.HexColor('#1e293b')
LIGHT   = colors.HexColor('#94a3b8')
WHITE   = colors.white
DARKBG  = colors.HexColor('#0d1117')
CODEFG  = colors.HexColor('#e2e8f0')
CODEBG  = colors.HexColor('#1e293b')

W, H = A4

OUT_PATH = os.path.join(os.path.dirname(__file__), 'RAPPORT_PROJET_ALVIO.pdf')

# ── Styles ──────────────────────────────────────────────────────────────────
def make_styles():
    s = getSampleStyleSheet()

    def ps(name, parent='Normal', **kw):
        return ParagraphStyle(name, parent=s[parent], **kw)

    return {
        'title':     ps('MyTitle',   fontSize=32, textColor=AMBER,
                        fontName='Helvetica-Bold', spaceAfter=8,
                        alignment=TA_CENTER, leading=38),
        'subtitle':  ps('MySub',     fontSize=16, textColor=LIGHT,
                        fontName='Helvetica', spaceAfter=6,
                        alignment=TA_CENTER, leading=20),
        'author':    ps('MyAuthor',  fontSize=14, textColor=WHITE,
                        fontName='Helvetica-Bold', alignment=TA_CENTER,
                        spaceAfter=4),
        'h1':        ps('MyH1',      fontSize=20, textColor=AMBER,
                        fontName='Helvetica-Bold', spaceBefore=18,
                        spaceAfter=8, leading=24),
        'h2':        ps('MyH2',      fontSize=15, textColor=GREEN,
                        fontName='Helvetica-Bold', spaceBefore=12,
                        spaceAfter=6, leading=18),
        'h3':        ps('MyH3',      fontSize=12, textColor=VIOLET,
                        fontName='Helvetica-Bold', spaceBefore=8,
                        spaceAfter=4, leading=15),
        'body':      ps('MyBody',    fontSize=10, textColor=CODEFG,
                        fontName='Helvetica', spaceBefore=2,
                        spaceAfter=4, leading=14, alignment=TA_JUSTIFY),
        'bullet':    ps('MyBullet',  fontSize=10, textColor=CODEFG,
                        fontName='Helvetica', leftIndent=16,
                        spaceBefore=2, spaceAfter=2, leading=14,
                        bulletIndent=6),
        'code':      ps('MyCode',    fontSize=8, textColor=CODEFG,
                        fontName='Courier', backColor=CODEBG,
                        leftIndent=10, rightIndent=10, spaceBefore=6,
                        spaceAfter=6, leading=12),
        'caption':   ps('MyCaption', fontSize=9, textColor=LIGHT,
                        fontName='Helvetica-Oblique', alignment=TA_CENTER,
                        spaceBefore=2, spaceAfter=6),
        'label':     ps('MyLabel',   fontSize=9, textColor=AMBER,
                        fontName='Helvetica-Bold'),
        'toc':       ps('MyToc',     fontSize=10, textColor=CODEFG,
                        fontName='Helvetica', spaceAfter=3, leading=14),
        'toc_h1':    ps('MyTocH1',   fontSize=11, textColor=AMBER,
                        fontName='Helvetica-Bold', spaceAfter=3,
                        spaceBefore=6, leading=14),
        'normal':    ps('MyNormal',  fontSize=10, textColor=CODEFG,
                        fontName='Helvetica', spaceAfter=4, leading=14),
    }

ST = make_styles()

# ── Numérotation de pages ───────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def _draw_header_footer(self, page_count):
        page_num = self._saved_page_states.index(dict(self.__dict__)) + 1 \
            if dict(self.__dict__) in self._saved_page_states else 1
        self.saveState()
        # Header bar
        self.setFillColor(NAVY)
        self.rect(0, H - 1.1*cm, W, 1.1*cm, fill=1, stroke=0)
        self.setFillColor(AMBER)
        self.setFont('Helvetica-Bold', 9)
        self.drawString(1*cm, H - 0.75*cm, 'ALVIO — Rapport de Projet CDA')
        self.setFillColor(LIGHT)
        self.setFont('Helvetica', 8)
        self.drawRightString(W - 1*cm, H - 0.75*cm, 'Adam Ijjai · RNCP 37873 · 2025-2026')
        # Footer
        self.setFillColor(NAVY)
        self.rect(0, 0, W, 0.9*cm, fill=1, stroke=0)
        self.setFillColor(LIGHT)
        self.setFont('Helvetica', 8)
        self.drawCentredString(W/2, 0.3*cm, f'Page {page_num}')
        self.restoreState()


def _draw_bg(c, doc):
    c.setFillColor(DARKBG)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def header_footer(c, doc):
    _draw_bg(c, doc)


# ── Helpers ─────────────────────────────────────────────────────────────────
def P(text, style='body'):
    return Paragraph(text, ST[style])

def H1(text):
    return P(f'<b>{text}</b>', 'h1')

def H2(text):
    return P(f'<b>{text}</b>', 'h2')

def H3(text):
    return P(f'<b>{text}</b>', 'h3')

def Sp(h=0.3):
    return Spacer(1, h*cm)

def HR():
    return HRFlowable(width='100%', thickness=1, color=GLASS,
                      spaceAfter=6, spaceBefore=6)

def code_block(txt):
    escaped = txt.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    lines = escaped.split('\n')
    formatted = '<br/>'.join(lines)
    return Paragraph(f'<font name="Courier" size="8">{formatted}</font>', ST['code'])

def info_table(rows, col_widths=None):
    if col_widths is None:
        col_widths = [5*cm, 11*cm]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), GLASS),
        ('BACKGROUND', (1,0), (1,-1), CODEBG),
        ('TEXTCOLOR',  (0,0), (0,-1), AMBER),
        ('TEXTCOLOR',  (1,0), (1,-1), CODEFG),
        ('FONTNAME',   (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME',   (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [GLASS, CODEBG]),
        ('GRID',       (0,0), (-1,-1), 0.5, NAVY),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def styled_table(headers, rows, col_widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  AMBER),
        ('TEXTCOLOR',     (0,0), (-1,0),  NAVY),
        ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('BACKGROUND',    (0,1), (-1,-1), CODEBG),
        ('TEXTCOLOR',     (0,1), (-1,-1), CODEFG),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [CODEBG, GLASS]),
        ('GRID',          (0,0), (-1,-1), 0.5, NAVY),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('FONTNAME',      (0,1), (0,-1),  'Helvetica-Bold'),
        ('TEXTCOLOR',     (0,1), (0,-1),  AMBER),
    ]))
    return t

# ═══════════════════════════════════════════════════════════════════════════
# SECTIONS
# ═══════════════════════════════════════════════════════════════════════════

def page_titre():
    els = []
    els.append(Sp(4))
    # Triangle logo ASCII
    logo = (
        '        ▲\n'
        '       ▲ ▲\n'
        '      ▲▲▲▲▲\n'
        '   ╱‾‾‾‾‾‾‾‾╲\n'
        '  ╱  ALVIO    ╲\n'
        ' ╱____________╲'
    )
    for line in logo.split('\n'):
        els.append(P(f'<font color="#f59e0b"><b>{line}</b></font>', 'title'))
    els.append(Sp(0.5))
    els.append(P('ALVIO', 'title'))
    els.append(P('Plateforme de Trading Propulsée par Intelligence Artificielle', 'subtitle'))
    els.append(Sp(1))
    els.append(HR())
    els.append(Sp(0.5))
    els.append(P('Rapport de Projet — Titre Professionnel', 'subtitle'))
    els.append(P('<font color="#f59e0b"><b>Concepteur Développeur d\'Applications (CDA)</b></font>', 'subtitle'))
    els.append(P('RNCP 37873 — Niveau 6', 'subtitle'))
    els.append(Sp(1))
    els.append(HR())
    els.append(Sp(0.8))
    els.append(P('<b>Adam Ijjai</b>', 'author'))
    els.append(Sp(0.3))
    els.append(P('Année de formation : 2025-2026', 'subtitle'))
    els.append(Sp(2))
    stack = [
        ['Projet',      'Alvio — Plateforme IA de Trading'],
        ['Auteur',      'Adam Ijjai'],
        ['Formation',   'CDA — Concepteur Développeur d\'Applications'],
        ['Référentiel', 'RNCP 37873 — Niveau 6 (Bac+3/4)'],
        ['Année',       '2025-2026'],
        ['Stack',       'NestJS · Next.js · React Native · Python · Claude API'],
        ['Dépôt',       'github.com/adamijjai1/alvio'],
        ['Date',        date.today().strftime('%d/%m/%Y')],
    ]
    els.append(info_table(stack, [5*cm, 10.5*cm]))
    els.append(PageBreak())
    return els


def page_remerciements():
    els = [H1('Présentation & Remerciements')]
    els.append(HR())
    els.append(H2('Présentation du rapport'))
    els.append(P(
        'Ce rapport de projet a été rédigé dans le cadre de la validation du titre professionnel '
        '<b>Concepteur Développeur d\'Applications (CDA)</b>, de niveau 6 (RNCP 37873). '
        'Il présente la conception, le développement et le déploiement de la plateforme <b>Alvio</b>, '
        'une application fullstack web et mobile intégrant un moteur d\'intelligence artificielle '
        'pour accompagner les traders dans l\'analyse de leurs stratégies personnelles.'
    ))
    els.append(Sp(0.5))
    els.append(P(
        'Le projet couvre l\'ensemble des compétences attendues par le référentiel CDA : '
        'analyse des besoins, conception technique (UML, MCD/MLD), développement sécurisé '
        'multicouches (API REST, frontend, mobile), intégration IA, tests, et déploiement cloud.'
    ))
    els.append(Sp(0.8))
    els.append(H2('Remerciements'))
    els.append(P(
        'Je remercie l\'ensemble de l\'équipe pédagogique pour leur accompagnement tout au long '
        'de cette formation intensive. Ce projet est le fruit d\'un apprentissage rigoureux '
        'et d\'une passion pour l\'ingénierie logicielle et les technologies d\'intelligence '
        'artificielle appliquées aux marchés financiers.'
    ))
    els.append(PageBreak())
    return els


def page_about():
    els = [H1('À Propos de Moi')]
    els.append(HR())
    rows = [
        ['Nom',         'Adam Ijjai'],
        ['Formation',   'Titre Professionnel CDA — RNCP 37873 — Niveau 6'],
        ['Spécialité',  'Développement fullstack & Intelligence Artificielle'],
        ['Technologies','TypeScript · Python · NestJS · Next.js · React Native'],
        ['Contact',     'adamijjai1@gmail.com'],
        ['GitHub',      'github.com/adamijjai1'],
    ]
    els.append(info_table(rows))
    els.append(Sp(0.8))
    els.append(P(
        'Passionné par le croisement entre la technologie et les marchés financiers, '
        'j\'ai conçu <b>Alvio</b> pour résoudre un problème concret que vivent tous les traders '
        'algorithmiques : la difficulté à formaliser, tester et détecter automatiquement '
        'les patterns de leurs propres stratégies en temps réel. '
        'Ce projet m\'a permis de maîtriser l\'ensemble de la chaîne de développement moderne : '
        'architecture API, frontend réactif, application mobile, pipeline IA/ML, '
        'sécurité applicative et déploiement cloud.'
    ))
    els.append(PageBreak())
    return els


def sommaire():
    els = [H1('Sommaire')]
    els.append(HR())
    toc = [
        ('1.', 'Introduction', ''),
        ('1.1', 'Contexte et Présentation', ''),
        ('1.2', 'Problématique et Motivation', ''),
        ('1.3', 'Livrables attendus', ''),
        ('2.', 'Gestion de Projet', ''),
        ('2.1', 'Méthodologie Agile (Scrum)', ''),
        ('2.2', 'Organisation solo & Sprints', ''),
        ('2.3', 'Gestion des risques', ''),
        ('3.', 'Conception Fonctionnelle (UI/UX)', ''),
        ('3.1', 'Zoning et wireframes Web', ''),
        ('3.2', 'Zoning et wireframes Mobile', ''),
        ('3.3', 'Charte graphique Alvio', ''),
        ('4.', 'Conception Technique — Base de Données', ''),
        ('4.1', 'Dictionnaire de données', ''),
        ('4.2', 'MCD — Modèle Conceptuel', ''),
        ('4.3', 'MLD — Modèle Logique', ''),
        ('5.', 'Modélisation UML', ''),
        ('5.1', 'Diagramme de cas d\'utilisation', ''),
        ('5.2', 'Diagramme de classes', ''),
        ('5.3', 'Diagrammes de séquence', ''),
        ('6.', 'Architecture Logicielle', ''),
        ('6.1', 'Vue d\'ensemble', ''),
        ('6.2', 'Endpoints API', ''),
        ('6.3', 'Sécurité & Authentification', ''),
        ('6.4', 'Gestion des vulnérabilités', ''),
        ('7.', 'Application Web (Next.js)', ''),
        ('7.1', 'Vue d\'ensemble', ''),
        ('7.2', 'Fonctionnalités principales', ''),
        ('8.', 'Application Mobile (React Native)', ''),
        ('9.', 'Module IA / ML', ''),
        ('9.1', 'Pipeline IA', ''),
        ('9.2', 'Strategy Engine — Claude API', ''),
        ('9.3', 'Détection de patterns Python', ''),
        ('10.', 'Tests', ''),
        ('11.', 'Déploiement (Railway + Vercel)', ''),
        ('12.', 'Mapping Blocs de Compétences RNCP', ''),
    ]
    for num, title, _ in toc:
        indent = 0 if '.' not in num[1:] else 16
        style = 'toc_h1' if '.' not in num[1:] else 'toc'
        els.append(P(f'<font color="#f59e0b"><b>{num}</b></font>  {title}',
                     style))
    els.append(PageBreak())
    return els


def section_introduction():
    els = [H1('1. Introduction')]
    els.append(HR())

    els.append(H2('1.1 Contexte et Présentation'))
    els.append(P(
        'Le marché des cryptomonnaies et des actifs financiers numériques connaît une croissance '
        'exponentielle, attirant une nouvelle génération de traders particuliers qui développent '
        'leurs propres stratégies d\'analyse technique. <b>Alvio</b> est une plateforme fullstack '
        'web et mobile qui répond à ce besoin en proposant un moteur d\'intelligence artificielle '
        'capable d\'<b>apprendre les stratégies personnelles de chaque trader</b> et de détecter '
        'en temps réel les patterns de marché correspondants.'
    ))
    els.append(Sp(0.4))
    els.append(P(
        'Alvio combine plusieurs technologies de pointe : une API NestJS hautement sécurisée, '
        'un frontend Next.js en temps réel, une application mobile React Native/Expo, '
        'un module Python d\'analyse technique (TA-Lib, pandas, scikit-learn), '
        'et l\'API Claude d\'Anthropic pour l\'extraction intelligente de règles de trading '
        'à partir de documents PDF ou texte.'
    ))
    els.append(Sp(0.6))

    els.append(H2('1.2 Problématique et Motivation'))
    els.append(P(
        '<b>Problème central :</b> Un trader algorithmique dispose souvent de stratégies '
        'documentées (PDF, notes personnelles) mais n\'a pas les outils pour :'
    ))
    for item in [
        'Formaliser automatiquement ces règles en conditions d\'entrée/sortie structurées',
        'Détecter en temps réel quand le marché présente exactement ce pattern',
        'Calculer un score de confiance multi-facteurs sur chaque signal généré',
        'Simuler l\'impact à long terme de ses stratégies via un simulateur DCA',
        'Suivre ses performances dans des rapports mensuels automatisés',
    ]:
        els.append(P(f'• {item}', 'bullet'))
    els.append(Sp(0.4))
    els.append(P(
        '<b>Solution Alvio :</b> Un pipeline IA complet qui transforme un document de stratégie '
        'en un moteur de détection actif, connecté aux données marché en temps réel (CoinGecko), '
        'avec génération automatique de signaux BUY/SELL/HOLD horodatés et scorés.'
    ))
    els.append(Sp(0.6))

    els.append(H2('1.3 Livrables Attendus'))
    livrables = [
        ['Livrable', 'Description', 'Statut'],
        ['API Backend NestJS', 'Serveur REST sécurisé — 14 controllers, 19 services', '✅ Réalisé'],
        ['Frontend Web Next.js', '31 pages — auth, markets, signals, formation, simulator', '✅ Réalisé'],
        ['App Mobile React Native', 'Navigation complète, auth, markets, signals', '✅ Réalisé'],
        ['Module IA Python', '15 scripts — patterns, indicateurs, scoring, DCA', '✅ Réalisé'],
        ['Intégration Claude API', 'Extraction de stratégies depuis PDF/TXT via Claude Sonnet', '✅ Réalisé'],
        ['Monitoring Stack', 'Prometheus + Grafana + ELK (5 règles SIEM)', '✅ Réalisé'],
        ['CI/CD Docker', 'docker-compose 7 services, Dockerfiles multi-stage', '✅ Réalisé'],
        ['Déploiement', 'Railway (backend) + Vercel (frontend)', '🔄 Prévu'],
    ]
    els.append(styled_table(livrables[0], livrables[1:], [4.5*cm, 6.5*cm, 3*cm]))
    els.append(PageBreak())
    return els


def section_gestion_projet():
    els = [H1('2. Gestion de Projet')]
    els.append(HR())

    els.append(H2('2.1 Méthodologie Agile (Scrum)'))
    els.append(P(
        'Bien que le projet soit réalisé en solo, la méthodologie <b>Scrum adaptée</b> a été '
        'appliquée avec des sprints de 2 semaines, un backlog produit priorisé, et des '
        'retrospectives personnelles à chaque fin de sprint.'
    ))
    els.append(Sp(0.4))
    sprints = [
        ['Sprint', 'Durée', 'Objectifs principaux', 'Vélocité'],
        ['S1', '2 sem.', 'Architecture, auth email/password, JWT, Prisma schema', '8 pts'],
        ['S2', '2 sem.', 'MFA (TOTP, WebAuthn, PIN), Magic Link, GitHub OAuth', '13 pts'],
        ['S3', '2 sem.', 'Module Markets (CoinGecko + Redis cache + charts)', '8 pts'],
        ['S4', '2 sem.', 'Strategy Engine (upload PDF → Claude API → JSON)', '13 pts'],
        ['S5', '2 sem.', 'Module Python IA (patterns, indicateurs, signaux)', '13 pts'],
        ['S6', '2 sem.', 'Formation, Simulator DCA, Reports mensuels', '10 pts'],
        ['S7', '2 sem.', 'App Mobile React Native, monitoring ELK, tests', '10 pts'],
        ['S8', '2 sem.', 'CI/CD Docker, optimisation, documentation', '8 pts'],
    ]
    els.append(styled_table(sprints[0], sprints[1:], [1.5*cm, 1.5*cm, 8*cm, 2*cm]))
    els.append(Sp(0.6))

    els.append(H2('2.2 Organisation Solo & Outils'))
    els.append(P(
        'En tant que projet individuel, la matrice RACI se simplifie : Adam Ijjai est '
        'Responsable, Accountable, Consulted et Informed pour l\'ensemble des décisions. '
        'Les outils de suivi utilisés :'
    ))
    outils = [
        ['Outil', 'Usage'],
        ['Git / GitHub', 'Versioning, branches par feature (feat/, fix/, chore/)'],
        ['Trello', 'Backlog produit, colonnes : Todo / In Progress / Done / Review'],
        ['Notion', 'Documentation technique, notes de sprint, ADR (Architecture Decision Records)'],
        ['Discord (solo)', 'Journal de bord quotidien, captures de blocages'],
        ['VS Code', 'IDE principal avec extensions ESLint, Prettier, Prisma'],
        ['Postman', 'Tests manuels des endpoints API avant écriture des tests Jest'],
    ]
    els.append(styled_table(outils[0], outils[1:], [4*cm, 10*cm]))
    els.append(Sp(0.6))

    els.append(H2('2.3 Gestion des Risques'))
    risques = [
        ['Risque', 'Probabilité', 'Impact', 'Mitigation'],
        ['Rate limiting CoinGecko (HTTP 429)', 'Haute', 'Critique', 'Cache Redis + fallback stale (1h)'],
        ['Coût API Claude (tokens)', 'Moyenne', 'Moyen', 'Chunking documents, max_tokens=4096'],
        ['PostgreSQL indisponible en dev', 'Moyenne', 'Haut', 'Docker-compose, fallback SQLite (dev.db)'],
        ['Erreurs TypeScript strict', 'Haute', 'Moyen', 'tsconfig strict, types Prisma explicites'],
        ['Sécurité JWT/tokens', 'Faible', 'Critique', 'JTI rotation, httpOnly cookies, CORS strict'],
        ['Performance Python bridge', 'Moyenne', 'Moyen', 'child_process async, timeout 30s, cache résultats'],
    ]
    els.append(styled_table(risques[0], risques[1:], [4.5*cm, 2*cm, 2*cm, 5.5*cm]))
    els.append(PageBreak())
    return els


def section_conception_ux():
    els = [H1('3. Conception Fonctionnelle (UI/UX)')]
    els.append(HR())

    els.append(H2('3.1 Zoning Web — Structure des Pages'))
    els.append(P(
        'Le frontend Next.js 13 (App Router) est organisé en <b>31 pages</b> réparties '
        'en deux grandes zones : les pages d\'authentification (13 pages) et les fonctionnalités '
        'métier (14 pages + 3 routes API proxy).'
    ))
    els.append(Sp(0.4))

    wireframe_web = """
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR  [Logo Alvio ▲]  Markets | Signals | Formation | Profile│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  STAT CARD   │  │  STAT CARD   │  │  STAT CARD           │  │
│  │  Total Sig.  │  │  Win Rate    │  │  Avg Confidence      │  │
│  │  [24 ▲]      │  │  [68% ▲]    │  │  [73.5% ━━━━━]       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────┐  ┌───────────────────────┐  │
│  │  TRADING CHART (lightweight)  │  │  SIGNAL FEED          │  │
│  │  BTC/USD  ┌──┐ ┌─┐ ┌──┐     │  │  ● BUY  BTC   87%    │  │
│  │           │  │ │ │ │  │ ▲   │  │  ● SELL ETH   71%    │  │
│  │           └──┘ └─┘ └──┘     │  │  ● HOLD SOL   55%    │  │
│  │  [1D] [1W] [1M] [3M] [1Y]   │  │  [Voir tous →]        │  │
│  └───────────────────────────────┘  └───────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MODULE IA — Importer une stratégie PDF                  │   │
│  │  [Glisser PDF ici]  ou  [Parcourir]   [Analyser IA ▶]   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘"""
    els.append(code_block(wireframe_web))
    els.append(P('Zoning Dashboard principal — vue desktop (1440px)', 'caption'))

    els.append(Sp(0.6))
    els.append(H2('3.2 Zoning Mobile — React Native / Expo'))
    wireframe_mobile = """
  ┌──────────────────┐
  │  ▲ ALVIO    🔔   │   ← Header avec notif
  ├──────────────────┤
  │                  │
  │  BTC/USD         │
  │  $67,234  +2.3%  │   ← Prix temps réel
  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │   ← Sparkline
  │                  │
  ├──────────────────┤
  │  🟢 BUY  87%     │   ← Signal actif
  │  Entry: $67,200  │
  │  SL:    $65,000  │
  │  TP:    $71,500  │
  ├──────────────────┤
  │  📊  🔔  📚  👤  │   ← Bottom tabs
  └──────────────────┘"""
    els.append(code_block(wireframe_mobile))
    els.append(P('Zoning Mobile — écran principal Signal actif', 'caption'))

    els.append(Sp(0.6))
    els.append(H2('3.3 Charte Graphique Alvio'))
    els.append(P(
        'La charte graphique Alvio s\'inspire de l\'esthétique <b>glassmorphism</b> '
        'des interfaces de trading professionnelles (Bloomberg Terminal, TradingView) '
        'avec une identité visuelle distinctive basée sur l\'ambre et le navy profond.'
    ))
    charte = [
        ['Élément',         'Valeur',    'Usage'],
        ['Fond principal',  '#0f172a',   'Navy profond — fond de toutes les pages'],
        ['Primaire',        '#f59e0b',   'Amber — logo, titres, CTAs principaux'],
        ['Accent signaux',  '#10b981',   'Vert émeraude — signaux BUY, succès'],
        ['Accent violet',   '#6366f1',   'Violet — éléments IA, badges, tags'],
        ['Texte secondaire','#94a3b8',   'Slate — labels, sous-titres, meta'],
        ['Cartes verre',    'rgba(255,255,255,0.05)', 'Glassmorphism + backdrop-filter blur'],
        ['Police',          'Inter / Helvetica', 'Sans-serif, geometric'],
    ]
    els.append(styled_table(charte[0], charte[1:], [4*cm, 3*cm, 7*cm]))
    els.append(Sp(0.4))
    els.append(P(
        '<b>Logo :</b> Triangle équilatéral (symbole de croissance, chandelier haussier) '
        'combiné à une ligne de graphique ascendante. Le triangle ▲ est utilisé comme '
        'favicon et icône de l\'application mobile.'
    ))
    els.append(PageBreak())
    return els


def section_bdd():
    els = [H1('4. Conception Technique — Base de Données')]
    els.append(HR())

    els.append(H2('4.1 Dictionnaire de Données'))
    els.append(P(
        'La base de données PostgreSQL comprend <b>11 modèles Prisma</b> couvrant '
        'l\'ensemble des besoins fonctionnels de la plateforme.'
    ))
    els.append(Sp(0.4))

    dico = [
        ['Entité', 'Attributs clés', 'Description'],
        ['User', 'id, email, username, passwordHash?, githubId?, pin?, totpSecret?, totpEnabled',
         'Utilisateur multi-auth (email/GitHub/MagicLink)'],
        ['Signal', 'asset, direction, entry_price, stop_loss, take_profit, confidence, patterns, indicators, status',
         'Signal trading BUY/SELL/HOLD généré par l\'IA'],
        ['Strategy', 'name, code, asset, timeframe, status, win_rate, profit_factor',
         'Stratégie importée et analysée par Claude API'],
        ['Report', 'month, year, total_signals, win_rate, avg_confidence, total_pnl_estimate',
         'Rapport mensuel de performance automatisé'],
        ['Course', 'title, level(DEBUTANT→EXPERT), category, duration, totalLessons',
         'Cours du module Formation'],
        ['Lesson', 'title, type(VIDEO/ARTICLE/QUIZ), videoUrl, content, duration',
         'Leçon individuelle d\'un cours'],
        ['UserProgress', 'userId, courseId, lessonId, completed, score',
         'Suivi de progression de l\'utilisateur'],
        ['WebAuthnCredential', 'credentialId, publicKey, counter, deviceType, transports',
         'Clé FIDO2/WebAuthn biométrique'],
        ['SimulationResult', 'asset, params(JSON), result(JSON), monthlyData(JSON)',
         'Simulation DCA persistée pour replay exact'],
        ['PortfolioSnapshot', 'capital, month, year',
         'Snapshot mensuel du capital de l\'utilisateur'],
        ['AuthLog', 'action, result, ip, detail',
         'Journal d\'audit des événements d\'authentification'],
    ]
    els.append(styled_table(dico[0], dico[1:], [3*cm, 6.5*cm, 4.5*cm]))
    els.append(Sp(0.6))

    els.append(H2('4.2 MCD — Modèle Conceptuel de Données'))
    els.append(P(
        'Le MCD ci-dessous représente les entités principales et leurs associations. '
        'L\'entité centrale est <b>User</b>, reliée à l\'ensemble des domaines fonctionnels.'
    ))
    mcd = """
                        ┌──────────────────┐
                        │      USER        │
                        │──────────────────│
                        │ id (PK)          │
                        │ email (UNIQUE)   │
                        │ username (UNIQUE)│
                        │ passwordHash?    │
                        │ githubId?        │
                        │ pin?             │
                        │ totpSecret?      │
                        │ totpEnabled      │
                        └────────┬─────────┘
           ┌────────────────────┼────────────────────┐
           │                    │                    │
    (1,N) POSSEDE        (1,N) CREE          (1,N) SUIT
           │                    │                    │
    ┌──────┴──────┐    ┌────────┴──────┐    ┌───────┴───────┐
    │   SIGNAL    │    │   STRATEGY    │    │  USERPROGRESS │
    │─────────────│    │───────────────│    │───────────────│
    │ asset       │    │ name          │    │ courseId?     │
    │ direction   │    │ code          │    │ lessonId?     │
    │ entry_price │    │ asset         │    │ completed     │
    │ stop_loss   │    │ timeframe     │    │ score?        │
    │ take_profit │    │ win_rate?     │    └───────┬───────┘
    │ confidence  │    │ profit_factor?│            │
    │ status      │    └───────────────┘     (N,1) CONCERNE
    └─────────────┘                                 │
                                            ┌───────┴───────┐
    ┌──────────────────┐                    │    COURSE     │
    │ WEBAUTHN_CRED    │                    │───────────────│
    │──────────────────│                    │ title         │
    │ credentialId     │    ┌───────────────┤ level         │
    │ publicKey        │    │    LESSON     │ category      │
    │ counter          │    │───────────────│ duration      │
    │ deviceType       │    │ title         └───────────────┘
    └──────────────────┘    │ type (VIDEO..)│
                            │ videoUrl?     │
    ┌──────────────────┐    └───────────────┘
    │ SIMULATIONRESULT │
    │──────────────────│    ┌───────────────┐
    │ asset            │    │    REPORT     │
    │ params (JSON)    │    │───────────────│
    │ result (JSON)    │    │ month, year   │
    │ monthlyData?     │    │ win_rate      │
    └──────────────────┘    │ avg_confidence│
                            └───────────────┘"""
    els.append(code_block(mcd))
    els.append(P('MCD — Modèle Conceptuel de Données Alvio (11 entités)', 'caption'))
    els.append(Sp(0.6))

    els.append(H2('4.3 MLD — Modèle Logique de Données (extrait Prisma)'))
    els.append(P(
        'Le MLD est directement issu du fichier <b>schema.prisma</b>. '
        'Les clés étrangères sont gérées par Prisma avec cascade sur suppression.'
    ))
    els.append(code_block(
        'User ( id PK, username UNIQUE, email UNIQUE, passwordHash?, githubId?,\n'
        '       pin?, totpSecret?, totpEnabled, trading_preference, email_notifications )\n\n'
        'Signal ( id PK, userId FK→User, strategyId?, asset, timeframe?, direction,\n'
        '         status, entry_price, stop_loss, take_profit, exit_price?, confidence,\n'
        '         risk_reward_ratio?, patterns?(JSON), indicators?(JSON),\n'
        '         closedAt?, createdAt, updatedAt )\n\n'
        'Strategy ( id PK, userId FK→User, name, description?, code, asset,\n'
        '           timeframe, status, win_rate?, total_trades?, profit_factor? )\n\n'
        'Course ( id PK, title, description, level(ENUM), category,\n'
        '         duration, totalLessons, order, isPublished )\n\n'
        'Lesson ( id PK, courseId FK→Course CASCADE, title, type(ENUM),\n'
        '         videoUrl?, content, duration, order )\n\n'
        'UserProgress ( id PK, userId FK→User, courseId? FK→Course,\n'
        '               lessonId? FK→Lesson UNIQUE(userId,lessonId) )\n\n'
        'WebAuthnCredential ( id PK, userId FK→User, credentialId UNIQUE,\n'
        '                     publicKey, counter, deviceType?, transports? )\n\n'
        'SimulationResult ( id PK, userId FK→User, asset, params(JSON), result(JSON) )\n\n'
        'PortfolioSnapshot ( id PK, userId FK→User, capital, month, year\n'
        '                    UNIQUE(userId, month, year) )\n\n'
        'Report ( id PK, userId FK→User, month, year, total_signals, win_rate,\n'
        '         avg_confidence, total_pnl_estimate UNIQUE(userId,month,year) )\n\n'
        'AuthLog ( id PK, userId?, action, result, ip?, detail? )'
    ))
    els.append(PageBreak())
    return els


def section_uml():
    els = [H1('5. Modélisation UML')]
    els.append(HR())

    els.append(H2('5.1 Diagramme de Cas d\'Utilisation'))
    uml_uc = """
┌────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME ALVIO                                   │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Auth :  S'inscrire  |  Se connecter  |  Magic Link         │  │
│  │          GitHub OAuth  |  Setup PIN  |  TOTP/WebAuthn       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Marchés : Consulter prix temps réel  |  Voir graphique     │  │
│  │            Analyser OHLCV  |  Comparer cryptos              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  IA Trading : Importer PDF stratégie  |  Analyser via Claude│  │
│  │              Détecter patterns Python  |  Générer signal    │  │
│  │              Simuler DCA  |  Générer rapport mensuel         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Formation : Voir cours  |  Jouer vidéo  |  Quiz  |  Progrès│  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  👤 TRADER (acteur principal)    🤖 IA / Claude API (acteur ext.) │
│  📊 CoinGecko API (acteur ext.)  📧 SMTP (acteur ext.)           │
└────────────────────────────────────────────────────────────────────┘"""
    els.append(code_block(uml_uc))
    els.append(P('Diagramme de cas d\'utilisation — Acteurs et fonctionnalités Alvio', 'caption'))
    els.append(Sp(0.6))

    els.append(H2('5.2 Diagramme de Classes (simplifié)'))
    uml_class = """
┌───────────────────┐         ┌──────────────────────┐
│     AuthService   │         │     AIService         │
│───────────────────│         │──────────────────────│
│ - maxFailures: int│         │ - pythonModulePath    │
│ - lockTtl: int    │         │──────────────────────│
│───────────────────│         │ + analyzeStrategy()  │
│ + register()      │◄───────►│ + detectPatterns()   │
│ + login()         │         │ + generateSignal()   │
│ + requestMagicLink│         │ + backtestStrategy() │
│ + verifyMagicLink │         └──────────────────────┘
│ + handleGithub()  │                    │ uses
│ + issueTokens()   │                    ▼
│ + refresh()       │         ┌──────────────────────┐
│ + logout()        │         │  SignalGenerator (Py) │
└────────┬──────────┘         │──────────────────────│
         │ uses               │ + generate_signal()   │
         ▼                    │ + detect_patterns()   │
┌───────────────────┐         │ + calculate_rsi()     │
│   MarketsService  │         │ + calculate_macd()    │
│───────────────────│         └──────────────────────┘
│ - BASE: string    │
│ - apiKey: string  │         ┌──────────────────────┐
│───────────────────│         │  FormationService     │
│ + getTopCoins()   │         │──────────────────────│
│ + getCoinDetail() │         │ + getCourses()        │
│ + getOhlcv()      │         │ + getLessonById()     │
│ - cacheGet()      │         │ + markComplete()      │
│ - cacheSet()      │         │ + getUserProgress()   │
│ - fetchCoinGecko()│         └──────────────────────┘
└───────────────────┘"""
    els.append(code_block(uml_class))
    els.append(P('Diagramme de classes — Services principaux Alvio', 'caption'))
    els.append(Sp(0.6))

    els.append(H2('5.3 Diagramme de Séquence — Analyse d\'une Stratégie IA'))
    seq = """
Trader       Frontend      Backend API      Claude API       Python IA
  │              │              │                │                │
  │ Upload PDF   │              │                │                │
  │─────────────►│              │                │                │
  │              │POST /strategies/import        │                │
  │              │─────────────►│                │                │
  │              │              │ parse PDF      │                │
  │              │              │ (pdf-parse)    │                │
  │              │              │                │                │
  │              │              │ messages.create│                │
  │              │              │───────────────►│                │
  │              │              │                │ Analyse texte  │
  │              │              │                │ Extrait JSON   │
  │              │              │◄───────────────│                │
  │              │              │ StrategyRules  │                │
  │              │              │ { entry_cond,  │                │
  │              │              │   exit_cond,   │                │
  │              │              │   indicators } │                │
  │              │              │                │                │
  │              │              │ Prisma.strategy.create()        │
  │              │              │                │                │
  │              │              │ exec('python signal_gen.py')    │
  │              │              │────────────────────────────────►│
  │              │              │                │  TradingSignal │
  │              │              │◄────────────────────────────────│
  │              │◄─────────────│                │                │
  │              │ Signal JSON  │                │                │
  │◄─────────────│              │                │                │
  │ { direction, entry, SL, TP, confidence }     │                │"""
    els.append(code_block(seq))
    els.append(P('Séquence — Import PDF → Claude API → Signal Python', 'caption'))
    els.append(PageBreak())
    return els


def section_architecture():
    els = [H1('6. Architecture Logicielle')]
    els.append(HR())

    els.append(H2('6.1 Vue d\'Ensemble'))
    els.append(P(
        'Alvio suit une architecture <b>hexagonale en couches</b> avec séparation stricte '
        'des responsabilités. Les 4 couches communiquent via des interfaces TypeScript typées.'
    ))
    arch = """
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTS                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │  Next.js 13 (Web)    │    │  React Native / Expo (Mobile)│  │
│  │  Port 3000           │    │  iOS / Android               │  │
│  │  Zustand + Axios     │    │  @react-navigation           │  │
│  └──────────┬───────────┘    └──────────────┬───────────────┘  │
└─────────────┼────────────────────────────────┼─────────────────┘
              │  HTTP/HTTPS (JWT Bearer)        │
┌─────────────▼────────────────────────────────▼─────────────────┐
│                   API GATEWAY — NestJS 10                       │
│  Port 3001  │  Guards JWT  │  CORS  │  Rate Limit  │  Helmet   │
│─────────────────────────────────────────────────────────────────│
│  Controllers : auth · markets · ai · signals · strategies       │
│               formation · reports · simulator · portfolio        │
│─────────────────────────────────────────────────────────────────│
│  Services :   AuthService · MarketsService · AIService          │
│               LoggingService · MetricsService · EmailService     │
│─────────────────────────────────────────────────────────────────│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Prisma ORM │  │  Redis Cache │  │  child_process       │  │
│  │   (PrismaService)│ (RedisService)│ │  Python Bridge       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────── ┼────────────┘
          │                 │                        │
┌─────────▼───┐   ┌─────────▼──┐   ┌───────────────▼──────────┐
│ PostgreSQL  │   │   Redis    │   │   Python AI Module (15)  │
│ (Port 5432) │   │ (Port 6379)│   │   signal_generator.py    │
│ 11 modèles  │   │ TTL cache  │   │   candlestick_patterns.py│
│ Prisma v5   │   │ JWT refresh│   │   indicators_calculator  │
└─────────────┘   └────────────┘   │   scoring_engine.py      │
                                   └────────────┬─────────────┘
                                                │
                                   ┌────────────▼─────────────┐
                                   │   APIS EXTERNES           │
                                   │   Claude API (Anthropic)  │
                                   │   CoinGecko API (marché) │
                                   └──────────────────────────┘"""
    els.append(code_block(arch))
    els.append(P('Architecture Alvio — Vue d\'ensemble des couches', 'caption'))
    els.append(Sp(0.6))

    els.append(H2('6.2 Vue des Endpoints API'))
    endpoints = [
        ['Méthode', 'Route', 'Auth', 'Description'],
        ['POST', '/auth/register', 'Public', 'Inscription email/password'],
        ['POST', '/auth/login', 'Public', 'Connexion + OTP si activé'],
        ['POST', '/auth/magic-link', 'Public', 'Envoi lien magique par email'],
        ['GET',  '/auth/magic?token=', 'Public', 'Vérification lien magique'],
        ['GET',  '/auth/github', 'Public', 'Redirect OAuth GitHub'],
        ['POST', '/auth/refresh', 'Cookie', 'Rotation JWT (JTI)'],
        ['POST', '/auth/logout', 'JWT', 'Révocation refresh Redis'],
        ['GET',  '/markets', 'JWT', 'Top 20 cryptos (cache Redis 60s)'],
        ['GET',  '/markets/:id', 'JWT', 'Détail crypto (cache 30s)'],
        ['GET',  '/markets/:id/ohlcv', 'JWT', 'Chandeliers ou line chart'],
        ['POST', '/strategies/import', 'JWT', 'Upload PDF → Claude API'],
        ['GET',  '/strategies', 'JWT', 'Liste stratégies utilisateur'],
        ['POST', '/ai/detect-patterns', 'JWT', 'Détection Python bridge'],
        ['GET',  '/signals', 'JWT', 'Signaux de l\'utilisateur'],
        ['POST', '/signals/generate', 'JWT', 'Génération signal IA'],
        ['GET',  '/formation/courses', 'JWT', 'Liste des cours'],
        ['POST', '/formation/progress', 'JWT', 'Marquer leçon complète'],
        ['POST', '/simulator/run', 'JWT', 'Simulation DCA'],
        ['GET',  '/reports/:year/:month', 'JWT', 'Rapport mensuel'],
        ['GET',  '/metrics', 'IP restrict', 'Prometheus metrics'],
    ]
    els.append(styled_table(endpoints[0], endpoints[1:], [1.5*cm, 5.5*cm, 2*cm, 5*cm]))
    els.append(PageBreak())
    return els


def section_securite():
    els = [H1('6.3 Sécurité & Authentification MFA')]
    els.append(HR())

    els.append(P(
        'Alvio implémente une authentification <b>multi-facteurs à 3 niveaux</b> conforme '
        'aux recommandations NIST SP 800-63B, couvrant les 3 catégories de facteurs.'
    ))
    els.append(Sp(0.4))
    mfa = [
        ['Facteur', 'Catégorie NIST', 'Implémentation Alvio'],
        ['1er facteur', 'Connaissance (SYK)', 'Email+password (bcrypt 12 rounds) OU Magic Link (crypto.randomBytes 32) OU GitHub OAuth'],
        ['2ème facteur', 'Possession (SYH)', 'OTP 6 chiffres par email (15 min) OU TOTP RFC 6238 (otplib, AES-256-GCM, ±1 window) OU WebAuthn FIDO2 (biométrique)'],
        ['3ème facteur', 'Connaissance (SYK)', 'Code PIN personnel (4-8 chiffres, hashé bcrypt)'],
    ]
    els.append(styled_table(mfa[0], mfa[1:], [3*cm, 3.5*cm, 7.5*cm]))
    els.append(Sp(0.6))

    els.append(H2('Code — Gestion du verrouillage de compte (auth.service.ts)'))
    els.append(code_block(
        '// Seuils configurables via .env\n'
        'private get maxFailures(): number {\n'
        '  return parseInt(this.config.get("MAX_AUTH_FAILURES") ?? "3", 10);\n'
        '}\n'
        'private get lockTtl(): number {\n'
        '  return parseInt(this.config.get("LOCK_TTL_SECONDS") ?? "1800", 10);\n'
        '}\n\n'
        'private async recordFailure(userId: string, step: string, ip?: string): Promise<never> {\n'
        '  const key   = `fail:${step}:${userId}`;\n'
        '  const count = parseInt(await this.redis.get(key) ?? "0") + 1;\n'
        '  await this.redis.set(key, count.toString(), this.lockTtl);\n\n'
        '  if (count >= this.maxFailures) {\n'
        '    await this.redis.set(`locked:${userId}`, "true", this.lockTtl);\n'
        '    await this.redis.del(key);\n'
        '    throw new HttpException(\n'
        '      `Compte bloqué après ${this.maxFailures} tentatives.`, 423);\n'
        '  }\n'
        '  throw new UnauthorizedException(\n'
        '    `Code incorrect. ${this.maxFailures - count} tentative(s) restante(s).`);\n'
        '}'
    ))
    els.append(Sp(0.4))

    els.append(H2('Stratégie JWT — Rotation JTI'))
    els.append(P(
        'Les tokens JWT utilisent un identifiant unique <b>JTI (JWT ID)</b> stocké dans Redis '
        '(TTL 7 jours). À chaque refresh, l\'ancien JTI est révoqué et un nouveau est émis, '
        'empêchant le rejeu de tokens volés.'
    ))
    els.append(code_block(
        '// issueTokens() — auth.service.ts\n'
        'const jti = crypto.randomUUID();\n'
        'const accessToken = this.jwtService.sign(\n'
        '  { sub: userId, email }, { expiresIn: "15m" }\n'
        ');\n'
        'const refreshToken = this.jwtService.sign(\n'
        '  { sub: userId, email, jti }, { expiresIn: "7d",\n'
        '    secret: this.config.get("JWT_REFRESH_SECRET") }\n'
        ');\n'
        '// Stockage refresh dans Redis (TTL 7j) + cookie httpOnly\n'
        'await this.redis.set(`refresh:${jti}`, userId, 7 * 24 * 3600);\n'
        'res.cookie("refresh_token", refreshToken, {\n'
        '  httpOnly: true, secure: true, sameSite: "strict",\n'
        '  maxAge: 7 * 24 * 3600 * 1000\n'
        '});'
    ))
    els.append(Sp(0.4))

    els.append(H2('6.4 Gestion des Vulnérabilités OWASP'))
    vulns = [
        ['Vulnérabilité', 'Mesure implémentée dans Alvio'],
        ['SQL Injection', 'Prisma ORM avec requêtes paramétrées — aucune interpolation SQL directe'],
        ['XSS', 'Next.js escaping automatique, CSP headers via Helmet, DOMPurify côté client'],
        ['CSRF', 'Tokens JWT stateless + SameSite=Strict sur cookies refresh'],
        ['Broken Auth', 'bcrypt 12 rounds, lockout 3 échecs/30min, JTI rotation, MFA 3 facteurs'],
        ['Sensitive Data', 'TOTP secret chiffré AES-256-GCM en BDD, pas de token en localStorage'],
        ['Rate Limiting', 'Redis counter par IP (MAX_IP_FAILURES=10/h), SUSPICIOUS_IP event SIEM'],
        ['Security Logging', 'AuthLog Prisma + RFC 5424 Syslog UDP → Elasticsearch → Kibana SIEM'],
        ['CORS', 'Origins whitelist stricte via CORS_ORIGINS env var'],
        ['Headers', 'Helmet NestJS — X-Frame-Options, X-Content-Type, HSTS'],
    ]
    els.append(styled_table(vulns[0], vulns[1:], [3.5*cm, 10.5*cm]))
    els.append(PageBreak())
    return els


def section_web():
    els = [H1('7. Application Web (Next.js 13)')]
    els.append(HR())

    els.append(H2('7.1 Vue d\'Ensemble'))
    stats = [
        ['Métrique', 'Valeur'],
        ['Framework', 'Next.js 13.4.0 — App Router'],
        ['Pages', '31 (13 auth + 14 features + 3 API routes + 1 landing)'],
        ['State management', 'Zustand — access token en mémoire, refresh en httpOnly cookie'],
        ['Graphiques', 'lightweight-charts 4.2 (TradingView-compatible)'],
        ['Animations', 'Framer Motion 12 — page transitions, hover effects'],
        ['Auth avancée', '@simplewebauthn/browser — WebAuthn registration & authentication'],
        ['Port dev', '3000 (npm run dev)'],
        ['Build', 'next build → optimisation statique + ISR'],
    ]
    els.append(styled_table(stats[0], stats[1:], [4*cm, 10*cm]))
    els.append(Sp(0.6))

    els.append(H2('7.2 Module Markets — CoinGecko + Redis Cache'))
    els.append(P(
        'La page Markets est l\'une des fonctionnalités les plus complexes d\'Alvio : '
        'elle combine données temps réel CoinGecko, cache Redis multi-niveau, '
        'et graphiques chandeliers/ligne adaptatifs.'
    ))
    els.append(code_block(
        '// markets.service.ts — getOhlcv() avec fallback line chart\n'
        'async getOhlcv(coinId: string, days: number): Promise<OhlcApiResponse> {\n'
        '  const key = `markets:ohlcv:${coinId}:${days}`;\n'
        '  const ttl = this.ohlcTtl(days); // 60s→1800s selon la plage\n'
        '  const hit = await this.cacheGet<OhlcApiResponse>(key);\n'
        '  if (hit) return hit;  // Cache hit → retour immédiat\n\n'
        '  // Tentative 1 : /ohlc (chandeliers OHLCV)\n'
        '  const raw = await this.fetchCoinGecko(`/coins/${coinId}/ohlc`,\n'
        '    { vs_currency: "usd", days: String(days) });\n'
        '  if (raw?.length > 0) {\n'
        '    await this.cacheSet(key, { mode: "candle", data: raw }, ttl);\n'
        '    return { mode: "candle", data: raw };\n'
        '  }\n'
        '  // Fallback : /market_chart (line chart si OHLCV indisponible)\n'
        '  const chart = await this.fetchCoinGecko(`/coins/${coinId}/market_chart`,\n'
        '    { vs_currency: "usd", days: String(days) });\n'
        '  const response = { mode: "line", data: chart.prices };\n'
        '  await this.cacheSet(key, response, ttl);\n'
        '  return response;\n'
        '}\n\n'
        '// Cache stale : en cas de 429, sert le cache vieux jusqu\'à 1h\n'
        'private async cacheSet<T>(key: string, value: T, ttl: number) {\n'
        '  const s = JSON.stringify(value);\n'
        '  await this.redis.set(key, s, ttl);          // Cache frais\n'
        '  await this.redis.set(`${key}:stale`, s, 3600); // Fallback 429\n'
        '}'
    ))
    els.append(Sp(0.4))

    els.append(H2('7.3 Module Formation'))
    els.append(P(
        'Le module Formation propose des cours structurés sur le trading algorithmique, '
        'organisés en 4 niveaux (<b>DEBUTANT → INTERMEDIAIRE → AVANCE → EXPERT</b>) '
        'avec 3 types de leçons : VIDEO, ARTICLE, QUIZ.'
    ))
    els.append(P('Contenu seedé en base : cours SMC, RSI, MACD, trading algorithmique, '
                 'avec embeds YouTube et contenu markdown interactif.'))
    els.append(PageBreak())
    return els


def section_mobile():
    els = [H1('8. Application Mobile (React Native / Expo)')]
    els.append(HR())

    els.append(H2('8.1 Vue d\'Ensemble'))
    mob = [
        ['Paramètre', 'Valeur'],
        ['Framework', 'React Native 0.72.3 + Expo 49'],
        ['Navigation', '@react-navigation/native 6.1.6 — Stack + Bottom Tabs'],
        ['HTTP client', 'Axios 1.4 avec intercepteurs JWT'],
        ['Plateformes', 'iOS + Android + Web (expo start --web)'],
        ['Auth', 'Même flux que le web — JWT Bearer header'],
    ]
    els.append(styled_table(mob[0], mob[1:], [4*cm, 10*cm]))
    els.append(Sp(0.6))

    els.append(H2('8.2 Écrans Principaux'))
    for screen in [
        ('Dashboard Mobile', 'Résumé KPIs, solde portfolio, signal actif du jour'),
        ('Markets',          'Liste cryptos triées par market cap, sparklines, prix temps réel'),
        ('Signals',          'Feed des signaux générés par l\'IA avec direction et confiance'),
        ('Formation',        'Catalogue des cours, lecteur vidéo intégré, progression'),
        ('Profil',           'Paramètres compte, gestion MFA, trading_preference'),
    ]:
        els.append(P(f'<b>• {screen[0]}</b> : {screen[1]}', 'bullet'))

    els.append(Sp(0.6))
    els.append(H2('8.3 Intégration Backend'))
    els.append(P(
        'L\'application mobile consomme exactement la même API NestJS que le frontend web. '
        'L\'authentification utilise un <b>Bearer token JWT</b> dans le header Authorization '
        '(pas de cookie httpOnly, car le stockage sécurisé mobile utilise '
        'expo-secure-store pour le refresh token).'
    ))
    els.append(code_block(
        '// api/index.ts — Intercepteur Axios mobile\n'
        'api.interceptors.request.use(async (config) => {\n'
        '  const token = await SecureStore.getItemAsync("access_token");\n'
        '  if (token) config.headers.Authorization = `Bearer ${token}`;\n'
        '  return config;\n'
        '});\n\n'
        'api.interceptors.response.use(\n'
        '  (res) => res,\n'
        '  async (err) => {\n'
        '    if (err.response?.status === 401) {\n'
        '      await refreshTokens(); // Rotation transparente\n'
        '    }\n'
        '    return Promise.reject(err);\n'
        '  }\n'
        ');'
    ))
    els.append(PageBreak())
    return els


def section_ia():
    els = [H1('9. Module IA / ML')]
    els.append(HR())

    els.append(H2('9.1 Pipeline IA Complet'))
    els.append(P(
        'Le module IA est le cœur différenciateur d\'Alvio. Il se compose de '
        '<b>15 scripts Python</b> appelés via un bridge <code>child_process</code> '
        'depuis NestJS, et de l\'API Claude d\'Anthropic pour l\'extraction de stratégies.'
    ))
    pipeline = """
┌──────────────────────────────────────────────────────────────────┐
│                     PIPELINE IA ALVIO                            │
│                                                                  │
│  ┌──────────────┐   ┌─────────────────┐   ┌───────────────────┐ │
│  │  1. IMPORT   │   │  2. EXTRACTION  │   │  3. DÉTECTION     │ │
│  │  PDF/TXT     │──►│  Claude API     │──►│  Python Engine    │ │
│  │  (Multer)    │   │  (StrategyRules)│   │  (Patterns+Indic) │ │
│  └──────────────┘   └─────────────────┘   └────────┬──────────┘ │
│                                                     │            │
│  ┌──────────────┐   ┌─────────────────┐   ┌────────▼──────────┐ │
│  │  6. RAPPORTS │   │  5. SIMULATION  │   │  4. SCORING       │ │
│  │  Mensuels    │◄──│  DCA long terme │◄──│  Multi-facteurs   │ │
│  │  (auto)      │   │  (DCASimulator) │   │  (ScoringEngine)  │ │
│  └──────────────┘   └─────────────────┘   └───────────────────┘ │
└──────────────────────────────────────────────────────────────────┘"""
    els.append(code_block(pipeline))
    els.append(Sp(0.6))

    els.append(H2('9.2 Strategy Engine — Intégration Claude API'))
    els.append(P(
        'Le <b>Strategy Engine</b> est la fonctionnalité signature d\'Alvio. '
        'L\'utilisateur importe un document PDF ou texte décrivant sa stratégie de trading. '
        'NestJS extrait le texte (pdf-parse), puis l\'envoie à <b>Claude Sonnet 4</b> '
        'avec un prompt système structuré pour obtenir un JSON de règles.'
    ))
    els.append(code_block(
        '// ai.service.ts — Appel Claude API\n'
        "const CLAUDE_MODEL = 'claude-sonnet-4-6';\n\n"
        'const SYSTEM_PROMPT = `Tu es un expert en trading algorithmique.\n'
        'Analyse le document et extrais TOUTES les règles de trading.\n'
        'Réponds UNIQUEMENT avec un objet JSON valide :\n'
        '{\n'
        '  "name": string,\n'
        '  "entry_conditions": string[],\n'
        '  "exit_conditions": string[],\n'
        '  "indicators": [{ "name": string, "params": string }],\n'
        '  "risk_management": { "stop_loss", "take_profit", "risk_reward" },\n'
        '  "confidence_score": number\n'
        '}`;\n\n'
        'async analyzeStrategyDocument(text: string): Promise<StrategyRules> {\n'
        '  const client = new Anthropic({ apiKey });\n'
        '  const response = await client.messages.create({\n'
        '    model:      CLAUDE_MODEL,\n'
        '    max_tokens: 4096,\n'
        '    system:     SYSTEM_PROMPT,\n'
        '    messages:   [{ role: "user", content: text }],\n'
        '  });\n'
        '  const raw = (response.content[0] as TextBlock).text;\n'
        '  return JSON.parse(cleanJsonResponse(raw)) as StrategyRules;\n'
        '}'
    ))
    els.append(Sp(0.4))

    els.append(H2('9.3 Détection de Patterns — Python Bridge'))
    els.append(P(
        'La détection de patterns en temps réel est réalisée par des scripts Python '
        'appelés depuis NestJS via <b>child_process.exec()</b>. '
        'Le module couvre 5 familles de patterns :'
    ))
    patterns = [
        ['Module Python', 'Patterns détectés'],
        ['candlestick_patterns.py', 'Doji, Hammer, Hanging Man, Engulfing (Bull/Bear), Morning/Evening Star, Shooting Star'],
        ['chart_patterns.py', 'Head & Shoulders, Double Top/Bottom, Triangle (Asc/Desc/Symétrique), Wedge, Flag'],
        ['elliott_waves.py', 'Ondes d\'Elliott (5 vagues impulsives + 3 correctives), identification de degré'],
        ['harmonic_patterns.py', 'Gartley, Butterfly, Bat, Crab (ratios Fibonacci: 0.382, 0.618, 0.786)'],
        ['ichimoku_indicator.py', 'Tenkan-sen, Kijun-sen, Senkou A/B, Chikou Span, nuage Kumo'],
    ]
    els.append(styled_table(patterns[0], patterns[1:], [5*cm, 9*cm]))
    els.append(Sp(0.4))

    els.append(code_block(
        '# signal_generator.py — Génération d\'un signal multi-facteurs\n'
        'def generate_signal(self) -> TradingSignal:\n'
        '    current_price = self.close[-1]\n'
        '    atr = TechnicalIndicators(self.df).atr(14)[-1]\n\n'
        '    # Détection patterns chandeliers + chart\n'
        '    patterns    = CandlestickPatternDetector(self.df).detect_all()\n'
        '    chart_pats  = ChartPatternDetector(self.df).detect_all()\n\n'
        '    # Calcul indicateurs techniques\n'
        '    indicators  = TechnicalIndicators(self.df)\n'
        '    rsi         = indicators.rsi(14)[-1]\n'
        '    macd_line   = indicators.macd(12, 26, 9)[-1]\n'
        '    bollinger   = indicators.bollinger_bands(20, 2)\n\n'
        '    # Scoring multi-facteurs : RSI < 30 → +2 pts BUY\n'
        '    buy_signals = sum(1 for p in patterns if p.direction == "BUY")\n'
        '    if rsi < 30:  buy_signals  += 2   # Survente\n'
        '    if rsi > 70:  sell_signals += 2   # Surachat\n'
        '    if macd_line > 0: buy_signals += 1\n\n'
        '    direction = "BUY" if buy_signals > sell_signals else "SELL"\n'
        '    stop_loss   = current_price - (2 * atr)\n'
        '    take_profit = current_price + (3 * atr)  # RR 1:3\n'
        '    return TradingSignal(\n'
        '        asset=self.asset, direction=direction,\n'
        '        entry_price=current_price, stop_loss=stop_loss,\n'
        '        take_profit=take_profit,\n'
        '        confidence=ScoringEngine(...).calculate(),\n'
        '        risk_reward_ratio=3.0\n'
        '    )'
    ))
    els.append(PageBreak())
    return els


def section_tests():
    els = [H1('10. Tests')]
    els.append(HR())

    els.append(H2('10.1 Stratégie de Tests'))
    els.append(P(
        'Alvio applique une stratégie de tests en <b>3 couches</b> : '
        'tests unitaires Jest (backend), tests composants Vitest (frontend), '
        'et tests d\'intégration via scripts bash/PowerShell.'
    ))
    tests_stats = [
        ['Couche', 'Outil', 'Fichiers', 'Couverture cible'],
        ['Backend Unit', 'Jest + ts-jest', '5 spec files', '70% (seuil Jest)'],
        ['Frontend Unit', 'Vitest + RTL', '2 test files', 'Composants critiques'],
        ['Python AI', 'pytest', '1 test file', 'Signal generation'],
        ['Intégration', 'test_backend.sh / test_all.ps1', '2 scripts', 'E2E flows'],
    ]
    els.append(styled_table(tests_stats[0], tests_stats[1:], [3*cm, 3.5*cm, 3*cm, 4.5*cm]))
    els.append(Sp(0.6))

    els.append(H2('10.2 Exemples de Tests Backend (Jest)'))
    els.append(P('<b>auth.service.spec.ts</b> — Test du verrouillage de compte :'))
    els.append(code_block(
        '// auth.service.spec.ts\n'
        'describe("AuthService — account lockout", () => {\n'
        '  it("locks account after MAX_AUTH_FAILURES attempts", async () => {\n'
        '    const userId = "user-123";\n'
        '    // Simuler MAX_AUTH_FAILURES-1 échecs\n'
        '    for (let i = 0; i < 2; i++) {\n'
        '      await expect(\n'
        '        service.login({ email: "test@test.com", password: "wrong" }, res)\n'
        '      ).rejects.toThrow(UnauthorizedException);\n'
        '    }\n'
        '    // Le 3ème échec verrouille le compte\n'
        '    await expect(\n'
        '      service.login({ email: "test@test.com", password: "wrong" }, res)\n'
        '    ).rejects.toThrow(HttpException); // 423 Locked\n'
        '    // Vérifier que Redis a le flag locked\n'
        '    expect(redisMock.set).toHaveBeenCalledWith(\n'
        '      `locked:${userId}`, "true", 1800\n'
        '    );\n'
        '  });\n'
        '});'
    ))
    els.append(Sp(0.4))

    els.append(P('<b>SignalCard.test.tsx</b> — Test composant React :'))
    els.append(code_block(
        '// components/common/SignalCard.test.tsx\n'
        'import { render, screen } from "@testing-library/react";\n'
        'import SignalCard from "./SignalCard";\n\n'
        'test("renders BUY signal with correct confidence", () => {\n'
        '  const signal = {\n'
        '    direction: "BUY", asset: "BTC", confidence: 87.5,\n'
        '    entry_price: 67000, stop_loss: 65000, take_profit: 71500\n'
        '  };\n'
        '  render(<SignalCard signal={signal} />);\n'
        '  expect(screen.getByText("BUY")).toBeInTheDocument();\n'
        '  expect(screen.getByText("87.5%")).toBeInTheDocument();\n'
        '  expect(screen.getByText("BTC")).toBeInTheDocument();\n'
        '});'
    ))
    els.append(PageBreak())
    return els


def section_deploiement():
    els = [H1('11. Déploiement')]
    els.append(HR())

    els.append(H2('11.1 Architecture de Déploiement'))
    els.append(P(
        'Alvio est déployé sur deux plateformes cloud complémentaires : '
        '<b>Railway</b> pour le backend (NestJS + PostgreSQL + Redis) '
        'et <b>Vercel</b> pour le frontend Next.js.'
    ))
    deploy = """
┌──────────────────────────────────────────────────────────────┐
│                   PRODUCTION CLOUD                            │
│                                                              │
│  ┌────────────────────────────────────────┐                  │
│  │          VERCEL (Frontend)             │                  │
│  │  Next.js 13 — Build statique + ISR     │                  │
│  │  CDN global — HTTPS automatique        │                  │
│  │  Env vars sécurisées Vercel dashboard  │                  │
│  └────────────────────────────────────────┘                  │
│                        │ API calls HTTPS                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              RAILWAY (Backend)                         │  │
│  │                                                        │  │
│  │  ┌────────────────┐  ┌───────────┐  ┌──────────────┐  │  │
│  │  │  NestJS API    │  │PostgreSQL │  │    Redis     │  │  │
│  │  │  Port: $PORT   │  │(Railway   │  │  (Railway    │  │  │
│  │  │  (auto-détecté)│  │ managed)  │  │   managed)   │  │  │
│  │  └────────────────┘  └───────────┘  └──────────────┘  │  │
│  │  Health check: GET /health → 200 OK                    │  │
│  │  Start cmd: npx prisma db push && npm run start:prod   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘"""
    els.append(code_block(deploy))
    els.append(Sp(0.6))

    els.append(H2('11.2 Dockerfile Backend (Multi-stage)'))
    els.append(code_block(
        '# backend-code/Dockerfile\n'
        'FROM node:18-alpine\n\n'
        '# Python pour le module IA\n'
        'RUN apk add --no-cache python3 py3-pip openssl\n'
        'RUN pip3 install pandas numpy --break-system-packages\n\n'
        'WORKDIR /app\n'
        'COPY package*.json ./\n'
        'RUN npm install\n\n'
        'COPY prisma ./prisma\n'
        'RUN npx prisma generate\n\n'
        'COPY . .\n'
        'RUN npm run build\n\n'
        'EXPOSE 3000\n'
        '# Railway injecte automatiquement $PORT\n'
        'CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]'
    ))
    els.append(Sp(0.4))

    els.append(H2('11.3 Docker Compose — Dev Local (7 services)'))
    services = [
        ['Service', 'Image', 'Port', 'Rôle'],
        ['postgres', 'postgres:15-alpine', '5432', 'Base de données principale'],
        ['redis', 'redis:7-alpine', '6379', 'Cache + sessions JWT'],
        ['backend', 'Custom (Dockerfile)', '3001', 'API NestJS'],
        ['frontend', 'Custom (Dockerfile)', '3000', 'Next.js'],
        ['prometheus', 'prom/prometheus:v2.51', '9090', 'Métriques'],
        ['grafana', 'grafana/grafana:10.4', '3003', 'Dashboard monitoring'],
        ['logstash', 'logstash:8.13', '514/udp', 'Pipeline logs SIEM'],
    ]
    els.append(styled_table(services[0], services[1:], [2.5*cm, 4.5*cm, 2*cm, 5*cm]))
    els.append(Sp(0.4))
    els.append(P(
        '<b>Démarrage complet :</b> <code>docker-compose up -d</code> — '
        'Une seule commande démarre l\'ensemble de la stack avec health checks '
        'PostgreSQL, Redis et Elasticsearch.'
    ))
    els.append(PageBreak())
    return els


def section_monitoring():
    els = [H1('11.4 Monitoring & Observabilité')]
    els.append(HR())

    els.append(H2('Stack Prometheus + Grafana + ELK'))
    els.append(P(
        'Alvio intègre un stack de monitoring complet, inspiré des pratiques '
        'de production des équipes SRE. Cette stack couvre les 3 piliers '
        'de l\'observabilité : <b>Métriques, Logs, Traces</b>.'
    ))
    obs = [
        ['Pilier', 'Outil', 'Détail'],
        ['Métriques', 'Prometheus + Grafana', '4 compteurs, 1 histogramme, 1 gauge — dashboard 17 panels'],
        ['Logs', 'RFC 5424 Syslog UDP → Logstash → Elasticsearch', 'Index brokeria-security-YYYY.MM.DD'],
        ['SIEM', 'Kibana + 5 règles', 'Brute Force, MFA Bypass, Off-Hours, Suspicious IP, Enumeration'],
    ]
    els.append(styled_table(obs[0], obs[1:], [2.5*cm, 5.5*cm, 6*cm]))
    els.append(Sp(0.4))

    els.append(H2('Métriques Prometheus (metrics.service.ts)'))
    els.append(code_block(
        '// metrics.service.ts\n'
        "authAttempts = new Counter({\n"
        "  name: 'auth_attempts_total',\n"
        "  help: 'Total authentication attempts',\n"
        "  labelNames: ['method', 'result']\n"
        "});\n\n"
        "authLatency = new Histogram({\n"
        "  name: 'auth_latency_seconds',\n"
        "  help: 'Authentication latency',\n"
        "  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]\n"
        "});\n\n"
        "activeSessions = new Gauge({\n"
        "  name: 'active_sessions_total',\n"
        "  help: 'Current active JWT sessions'\n"
        "});"
    ))
    els.append(Sp(0.4))

    els.append(H2('Règles SIEM Kibana (Detection Rules)'))
    siem = [
        ['Règle', 'Sévérité', 'Condition', 'Fenêtre'],
        ['Brute Force', 'HIGH', '≥5 AUTH_FAILURE même userId', '5 min'],
        ['MFA Bypass', 'CRITICAL', 'AUTH_SUCCESS sans 2FA', 'Immédiat'],
        ['Off-Hours Login', 'MEDIUM', 'Connexion réussie 00h-05h UTC', '1h'],
        ['Suspicious IP', 'HIGH', '1 IP, ≥3 comptes différents', '10 min'],
        ['Enumeration', 'MEDIUM', '≥5 emails inconnus depuis 1 IP', '10 min'],
    ]
    els.append(styled_table(siem[0], siem[1:], [4*cm, 2*cm, 5*cm, 2*cm]))
    els.append(PageBreak())
    return els


def section_rncp():
    els = [H1('12. Mapping Blocs de Compétences RNCP 37873')]
    els.append(HR())
    els.append(P(
        'Cette section démontre explicitement comment le projet Alvio couvre '
        'l\'ensemble des compétences attendues par le titre professionnel '
        '<b>Concepteur Développeur d\'Applications (CDA) — RNCP 37873 — Niveau 6</b>.'
    ))
    els.append(Sp(0.6))

    els.append(H2('Bloc 1 — Développer une Application Sécurisée'))
    bloc1 = [
        ['Compétence', 'Preuve dans Alvio', 'Section'],
        ['Analyser un besoin et formaliser les specs',
         'MCD, MLD, diagrammes UML, 11 modèles Prisma, 14 controllers',
         'Sect. 4 & 5'],
        ['Développer des composants sécurisés (BDD)',
         'Prisma ORM typé, requêtes paramétrées (0 SQL injection), indexes optimisés',
         'Sect. 4'],
        ['Écrire des tests unitaires',
         '5 spec Jest backend, 2 tests Vitest frontend, 1 module pytest Python',
         'Sect. 10'],
        ['Gérer la sécurité (auth, hashing)',
         'bcrypt 12 rounds, MFA 3 facteurs, JWT JTI rotation, AES-256-GCM TOTP',
         'Sect. 6.3'],
        ['Respect des bonnes pratiques OWASP',
         'CSRF/XSS/SQLi/Broken Auth : toutes mitigations documentées et implémentées',
         'Sect. 6.4'],
    ]
    els.append(styled_table(bloc1[0], bloc1[1:], [5*cm, 7*cm, 2*cm]))
    els.append(Sp(0.6))

    els.append(H2('Bloc 2 — Concevoir et Développer une Application Multicouche'))
    bloc2 = [
        ['Compétence', 'Preuve dans Alvio', 'Section'],
        ['Architecture en couches',
         'Next.js → NestJS Controllers → Services → Prisma/Redis + Python bridge',
         'Sect. 6.1'],
        ['Développement frontend',
         '31 pages Next.js 13, Zustand, Axios, lightweight-charts, Framer Motion',
         'Sect. 7'],
        ['Développement mobile',
         'React Native 0.72 + Expo 49, navigation, authentification, marchés',
         'Sect. 8'],
        ['Intégration API externes',
         'CoinGecko (cache Redis multi-TTL), Claude API (extraction JSON), SMTP',
         'Sect. 7 & 9'],
        ['Modélisation UML complète',
         'Cas d\'utilisation, classes, 3 séquences (auth, import PDF, génération signal)',
         'Sect. 5'],
        ['Module IA innovant',
         '15 scripts Python : patterns, indicateurs, scoring, DCA, NLP, rapports',
         'Sect. 9'],
    ]
    els.append(styled_table(bloc2[0], bloc2[1:], [5*cm, 7*cm, 2*cm]))
    els.append(Sp(0.6))

    els.append(H2('Bloc 3 — Préparer le Déploiement d\'une Application Sécurisée'))
    bloc3 = [
        ['Compétence', 'Preuve dans Alvio', 'Section'],
        ['Containerisation Docker',
         'Dockerfile multi-stage backend + frontend, docker-compose 7 services',
         'Sect. 11'],
        ['Variables d\'environnement & secrets',
         '.env.example avec 25+ variables, aucun secret hardcodé en code',
         'Sect. 6.5'],
        ['Déploiement cloud',
         'Railway (NestJS + PostgreSQL + Redis) + Vercel (Next.js)',
         'Sect. 11'],
        ['Monitoring & observabilité',
         'Prometheus + Grafana (17 panels) + ELK Stack + 5 règles SIEM Kibana',
         'Sect. 11.4'],
        ['CI/CD',
         'health check endpoints, prisma db push au démarrage, npm run start:prod',
         'Sect. 11'],
        ['Documentation technique',
         'README, DEPLOYMENT_GUIDE, TESTING_GUIDE, PROJECT_STRUCTURE, INDEX',
         'Annexes'],
    ]
    els.append(styled_table(bloc3[0], bloc3[1:], [5*cm, 7*cm, 2*cm]))
    els.append(Sp(0.6))

    els.append(H2('Bilan de Couverture'))
    els.append(P(
        'Le projet Alvio couvre <b>100% des compétences</b> des 3 blocs du référentiel CDA RNCP 37873. '
        'La dimension IA (Claude API, Python ML) constitue un élément différenciateur fort '
        'qui dépasse les attendus du référentiel et démontre une maîtrise avancée '
        'de l\'intégration de services d\'intelligence artificielle dans une application de production.'
    ))
    els.append(PageBreak())
    return els


def conclusion():
    els = [H1('Conclusion')]
    els.append(HR())
    els.append(P(
        'Le projet <b>Alvio</b> représente une réalisation technique ambitieuse qui couvre '
        'l\'intégralité du spectre du développement d\'applications modernes : '
        'de la conception BDD (Prisma + PostgreSQL) jusqu\'au déploiement cloud '
        '(Railway + Vercel), en passant par une API sécurisée MFA 3-facteurs, '
        'des interfaces web et mobile réactives, et un module IA/ML innovant.'
    ))
    els.append(Sp(0.4))
    els.append(P(
        'Les choix techniques effectués (NestJS pour la structure modulaire, '
        'Next.js 13 App Router pour les performances SSR, Claude API pour l\'extraction '
        'sémantique, Python pour l\'analyse technique) reflètent une vision claire '
        'de l\'architecture d\'une application SaaS de trading de nouvelle génération.'
    ))
    els.append(Sp(0.4))
    els.append(P(
        'Ce projet valide l\'ensemble des compétences du titre RNCP 37873 (CDA) '
        'et constitue une base solide pour une mise en production réelle, '
        'avec un chemin de déploiement documenté et une stack de monitoring '
        'prête pour les contraintes d\'un environnement de production.'
    ))
    els.append(Sp(1))
    els.append(H2('Perspectives d\'Évolution'))
    for item in [
        'Backtesting historique sur données réelles (CCXT + Binance API)',
        'Modèle ML supervisé (Random Forest) pour améliorer le scoring des signaux',
        'WebSocket temps réel pour les prix et signaux (sans polling CoinGecko)',
        'Module social : partage de stratégies entre traders de la communauté',
        'Intégration broker réel (paper trading puis live trading Binance)',
    ]:
        els.append(P(f'• {item}', 'bullet'))
    els.append(PageBreak())
    return els


# ═══════════════════════════════════════════════════════════════════════════
# ASSEMBLAGE
# ═══════════════════════════════════════════════════════════════════════════

def build_pdf():
    doc = SimpleDocTemplate(
        OUT_PATH,
        pagesize=A4,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        topMargin=1.8*cm, bottomMargin=1.5*cm,
        title='Rapport de Projet CDA — Alvio',
        author='Adam Ijjai',
        subject='RNCP 37873 — Concepteur Développeur d\'Applications',
    )

    story = []
    story += page_titre()
    story += page_remerciements()
    story += page_about()
    story += sommaire()
    story += section_introduction()
    story += section_gestion_projet()
    story += section_conception_ux()
    story += section_bdd()
    story += section_uml()
    story += section_architecture()
    story += section_securite()
    story += section_web()
    story += section_mobile()
    story += section_ia()
    story += section_tests()
    story += section_deploiement()
    story += section_monitoring()
    story += section_rncp()
    story += conclusion()

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f'PDF genere : {OUT_PATH}')
    print(f'   Taille : {os.path.getsize(OUT_PATH) / 1024:.0f} Ko')


if __name__ == '__main__':
    build_pdf()
