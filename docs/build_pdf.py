#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_pdf.py — Assembleur PDF du Rapport de Projet CDA Alvio
Lit 15 sections .md + 8 PNG et produit RAPPORT_PROJET_ALVIO.pdf
"""

import os
import re
import sys
import unicodedata
from pathlib import Path

from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, Paragraph, Spacer, Image as RLImage,
    PageBreak, HRFlowable, Preformatted, Table, TableStyle,
    KeepTogether, Frame, PageTemplate, NextPageTemplate,
)
from reportlab.platypus.tableofcontents import TableOfContents

# ── Chemins ────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent
SECTIONS_DIR = BASE_DIR / 'sections'
IMG_DIR      = BASE_DIR / 'img'
OUTPUT       = BASE_DIR / 'RAPPORT_PROJET_ALVIO.pdf'

# ── Sections attendues (ordre strict) ─────────────────────────────────────────
SECTIONS = [
    "01_presentation_remerciements.md",
    "02_a_propos_de_moi.md",
    "03_introduction.md",
    "04_gestion_de_projet.md",
    "05_conception_ui_ux.md",
    "06_conception_bdd.md",
    "07_modelisation_uml.md",
    "08_architecture_logicielle.md",
    "09_application_web.md",
    "10_application_mobile.md",
    "11_module_ia_ml.md",
    "12_tests.md",
    "13_deploiement.md",
    "15_annexes.md",
    "16_mapping_rncp.md",
]

# ── Palette Alvio ──────────────────────────────────────────────────────────────
NAVY   = HexColor('#0f172a')
AMBER  = HexColor('#f59e0b')
GREEN  = HexColor('#10b981')
VIOLET = HexColor('#6366f1')
SLATE  = HexColor('#1e293b')
LIGHT  = HexColor('#94a3b8')
FGWHITE = HexColor('#f1f5f9')
FGDARK  = HexColor('#1e293b')

PAGE_W, PAGE_H = A4
MARGIN     = 2.0 * cm
CONTENT_W  = PAGE_W - 2 * MARGIN

# ── Styles ReportLab ──────────────────────────────────────────────────────────
def build_styles():
    S = {}
    S['body'] = ParagraphStyle('body',
        fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=FGDARK, spaceAfter=5, alignment=TA_JUSTIFY)

    S['h1'] = ParagraphStyle('H1',
        fontName='Helvetica-Bold', fontSize=17, leading=22,
        textColor=AMBER, spaceBefore=6, spaceAfter=12)

    S['h2'] = ParagraphStyle('H2',
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=NAVY, spaceBefore=12, spaceAfter=7)

    S['h3'] = ParagraphStyle('H3',
        fontName='Helvetica-Bold', fontSize=11, leading=15,
        textColor=VIOLET, spaceBefore=9, spaceAfter=5)

    S['h4'] = ParagraphStyle('H4',
        fontName='Helvetica-Bold', fontSize=10, leading=14,
        textColor=SLATE, spaceBefore=7, spaceAfter=4)

    S['bullet'] = ParagraphStyle('bullet',
        fontName='Helvetica', fontSize=9, leading=13,
        textColor=FGDARK, leftIndent=18, firstLineIndent=0,
        spaceBefore=2, spaceAfter=2)

    S['subbullet'] = ParagraphStyle('subbullet',
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=FGDARK, leftIndent=36, firstLineIndent=0,
        spaceBefore=1, spaceAfter=1)

    S['code'] = ParagraphStyle('code',
        fontName='Courier', fontSize=7, leading=10,
        textColor=FGWHITE, backColor=NAVY,
        spaceBefore=6, spaceAfter=6, leftIndent=8, rightIndent=8,
        borderPad=6)

    S['caption'] = ParagraphStyle('caption',
        fontName='Helvetica', fontSize=8, leading=11,
        textColor=LIGHT, alignment=TA_CENTER, spaceAfter=10)

    S['quote'] = ParagraphStyle('quote',
        fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=VIOLET, leftIndent=20, spaceBefore=8, spaceAfter=8,
        borderLeftColor=VIOLET, borderLeftWidth=3, borderLeftPadding=8)

    S['th'] = ParagraphStyle('th',
        fontName='Helvetica-Bold', fontSize=8, leading=11,
        textColor=white, alignment=TA_CENTER)

    S['td'] = ParagraphStyle('td',
        fontName='Helvetica', fontSize=7.5, leading=11,
        textColor=FGDARK, alignment=TA_LEFT, wordWrap='CJK')

    S['toc0'] = ParagraphStyle('toc0',
        fontName='Helvetica-Bold', fontSize=11, leading=16,
        textColor=AMBER, spaceBefore=6, spaceAfter=2)

    S['toc1'] = ParagraphStyle('toc1',
        fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=NAVY, leftIndent=20, spaceBefore=1, spaceAfter=1)

    return S

STYLES = build_styles()

# ── Page callbacks ─────────────────────────────────────────────────────────────
def on_content_page(canvas, doc):
    """En-tête et pied de page sur toutes les pages de contenu."""
    canvas.saveState()
    # ── En-tête ──
    canvas.setStrokeColor(AMBER)
    canvas.setLineWidth(0.8)
    canvas.line(MARGIN, PAGE_H - 1.4*cm, PAGE_W - MARGIN, PAGE_H - 1.4*cm)
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.setFillColor(AMBER)
    canvas.drawString(MARGIN, PAGE_H - 1.15*cm, 'ALVIO')
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(LIGHT)
    canvas.drawString(MARGIN + 1.0*cm, PAGE_H - 1.15*cm,
                      '— Rapport de Projet CDA RNCP 37873 — Adam Ijjai')
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.15*cm,
                           f'Page {doc.page}')
    # ── Pied de page ──
    canvas.setStrokeColor(SLATE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 1.4*cm, PAGE_W - MARGIN, 1.4*cm)
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(LIGHT)
    canvas.drawString(MARGIN, 1.0*cm, 'Promotion 2025-2026 — Titre RNCP 37873 Niveau 6')
    canvas.drawRightString(PAGE_W - MARGIN, 1.0*cm, f'{doc.page}')
    canvas.restoreState()

def on_title_page(canvas, doc):
    """Page de titre pleine page — fond navy."""
    canvas.saveState()
    # Fond navy pleine page
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Bande amber en bas du tiers supérieur
    canvas.setFillColor(AMBER)
    canvas.rect(0, PAGE_H * 0.72, PAGE_W, 4, fill=1, stroke=0)

    # Triangle décoratif (logo Alvio)
    canvas.setFillColor(AMBER)
    canvas.setStrokeColor(AMBER)
    cx = PAGE_W / 2
    ty = PAGE_H * 0.82
    p = canvas.beginPath()
    p.moveTo(cx, ty + 2.5*cm)
    p.lineTo(cx - 1.5*cm, ty)
    p.lineTo(cx + 1.5*cm, ty)
    p.close()
    canvas.drawPath(p, fill=1, stroke=0)
    # Ligne graphique ascendante (logo)
    canvas.setStrokeColor(GREEN)
    canvas.setLineWidth(3)
    p2 = canvas.beginPath()
    p2.moveTo(cx - 1.8*cm, ty + 0.3*cm)
    p2.lineTo(cx - 0.6*cm, ty + 1.2*cm)
    p2.lineTo(cx + 0.6*cm, ty + 0.6*cm)
    p2.lineTo(cx + 1.8*cm, ty + 1.8*cm)
    canvas.drawPath(p2, fill=0, stroke=1)

    # Titre "Alvio"
    canvas.setFont('Helvetica-Bold', 48)
    canvas.setFillColor(AMBER)
    canvas.drawCentredString(cx, PAGE_H * 0.68, 'Alvio')

    # Sous-titre
    canvas.setFont('Helvetica', 16)
    canvas.setFillColor(FGWHITE)
    canvas.drawCentredString(cx, PAGE_H * 0.62,
                             'Plateforme de Trading propulsée par IA')

    # Séparateur
    canvas.setStrokeColor(VIOLET)
    canvas.setLineWidth(1.5)
    canvas.line(cx - 5*cm, PAGE_H * 0.59, cx + 5*cm, PAGE_H * 0.59)

    # Sous-titre rapport
    canvas.setFont('Helvetica-Bold', 12)
    canvas.setFillColor(VIOLET)
    canvas.drawCentredString(cx, PAGE_H * 0.555,
                             'Rapport de Projet — Titre Professionnel CDA')
    canvas.setFont('Helvetica', 11)
    canvas.setFillColor(LIGHT)
    canvas.drawCentredString(cx, PAGE_H * 0.525,
                             'RNCP 37873 — Niveau 6 (Bac+4)')

    # Bloc identité
    canvas.setFont('Helvetica-Bold', 14)
    canvas.setFillColor(FGWHITE)
    canvas.drawCentredString(cx, PAGE_H * 0.45, 'Adam Ijjai')
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(LIGHT)
    canvas.drawCentredString(cx, PAGE_H * 0.42, 'Concepteur Développeur d\'Applications')
    canvas.drawCentredString(cx, PAGE_H * 0.395, 'Promotion 2025-2026')

    # Stack technique
    canvas.setFont('Helvetica', 8.5)
    canvas.setFillColor(GREEN)
    stack_line = ('NestJS 10  ·  Next.js 13  ·  React Native  ·  '
                  'Python IA  ·  Claude API  ·  PostgreSQL  ·  Redis  ·  Docker')
    canvas.drawCentredString(cx, PAGE_H * 0.30, stack_line)

    # Bande verte en bas
    canvas.setFillColor(HexColor('#0d2117'))
    canvas.rect(0, 0, PAGE_W, 2.5*cm, fill=1, stroke=0)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GREEN)
    canvas.drawCentredString(cx, 1.1*cm,
                             'Juin 2026  —  Dossier de certification jury RNCP 37873')
    canvas.restoreState()

# ── Document template ─────────────────────────────────────────────────────────
class AlvioDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        self.chapter_num = 0
        BaseDocTemplate.__init__(self, filename, **kwargs)

        title_frame = Frame(0, 0, PAGE_W, PAGE_H, id='title')
        toc_frame = Frame(
            MARGIN, MARGIN + 0.8*cm,
            CONTENT_W, PAGE_H - 2*MARGIN - 1.8*cm,
            id='toc')
        content_frame = Frame(
            MARGIN, MARGIN + 0.8*cm,
            CONTENT_W, PAGE_H - 2*MARGIN - 1.8*cm,
            id='content')

        self.addPageTemplates([
            PageTemplate('TitlePage',  [title_frame],   onPage=on_title_page),
            PageTemplate('TOCPage',    [toc_frame],     onPage=on_content_page),
            PageTemplate('Content',    [content_frame], onPage=on_content_page),
        ])

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            sname = flowable.style.name
            txt   = flowable.getPlainText()
            if sname == 'H1':
                self.notify('TOCEntry', (0, txt, self.page))
            elif sname == 'H2':
                self.notify('TOCEntry', (1, txt, self.page))

# ── Utilitaires texte ──────────────────────────────────────────────────────────
def strip_emoji(text):
    """Retire les caractères hors Latin Extended / Basic Multilingual Plane."""
    cleaned = []
    for ch in text:
        cp = ord(ch)
        # Garde ASCII + Latin + ponctuation courante ; vire les emoji (>= U+2300)
        if cp < 0x2300 or 0x2600 <= cp <= 0x26FF and ch in '→←↑↓⇒':
            cleaned.append(ch)
        elif cp < 0x1F000:
            # Caractères Unicode standards (lettres accentuées, symboles techniques)
            try:
                name = unicodedata.name(ch, '')
                if 'LATIN' in name or 'ARROW' in name or 'BOX' in name:
                    cleaned.append(ch)
                else:
                    cleaned.append(' ')
            except Exception:
                cleaned.append(' ')
        else:
            cleaned.append(' ')  # emoji → espace
    return ''.join(cleaned).strip()

def xml_escape(text):
    """Échappe les caractères spéciaux XML."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text

def md_inline(text):
    """Convertit le markdown inline en balises XML ReportLab."""
    text = xml_escape(text)
    # **bold**
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # *italic* (pas **)
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', text)
    # `inline code`
    text = re.sub(r'`([^`]+)`',
                  r'<font name="Courier" color="#f59e0b">\1</font>', text)
    # [link text](url) → gras
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'<b>\1</b>', text)
    return text.strip()

# ── Parser Markdown → flowables ────────────────────────────────────────────────
def parse_md(filepath, chapter_num, img_dir):
    """
    Lit un fichier .md et retourne une liste de ReportLab flowables.
    Gère : H1-H4, paragraphes, listes à puces (2 niveaux), blocs de code,
           tables, images, citations (> ...), séparateurs ---.
    """
    flowables = []
    text = Path(filepath).read_text(encoding='utf-8')
    lines = text.splitlines()

    in_code    = False
    code_lines = []
    code_lang  = ''
    in_table   = False
    table_rows = []
    para_lines = []

    def flush_para():
        """Vide le buffer de paragraphe en cours."""
        if para_lines:
            raw = ' '.join(para_lines).strip()
            raw = strip_emoji(raw)
            if raw:
                flowables.append(Paragraph(md_inline(raw), STYLES['body']))
                flowables.append(Spacer(1, 2))
            para_lines.clear()

    def flush_table():
        """Construit un Table ReportLab depuis les lignes accumulées."""
        nonlocal table_rows
        if not table_rows:
            return
        # Filtre la ligne de séparateur (|---|---|)
        data_rows = [r for r in table_rows if not re.match(r'^\|[-: |]+\|$', r)]
        if not data_rows:
            table_rows = []
            return

        parsed = []
        for row in data_rows:
            cells = [c.strip() for c in row.strip('|').split('|')]
            parsed.append(cells)

        if not parsed:
            table_rows = []
            return

        max_cols = max(len(r) for r in parsed)
        # Normalise les lignes
        for r in parsed:
            while len(r) < max_cols:
                r.append('')

        # Première ligne = en-tête
        header  = parsed[0]
        body_r  = parsed[1:]

        col_w = CONTENT_W / max(max_cols, 1)

        tdata = []
        # En-tête
        tdata.append([
            Paragraph(strip_emoji(xml_escape(c)), STYLES['th'])
            for c in header
        ])
        for row in body_r:
            tdata.append([
                Paragraph(strip_emoji(md_inline(c)), STYLES['td'])
                for c in row
            ])

        t = Table(tdata, colWidths=[col_w] * max_cols, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,0),  SLATE),
            ('TEXTCOLOR',    (0,0), (-1,0),  white),
            ('ALIGN',        (0,0), (-1,-1), 'LEFT'),
            ('VALIGN',       (0,0), (-1,-1), 'TOP'),
            ('FONTNAME',     (0,0), (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',     (0,0), (-1,-1), 7.5),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [HexColor('#f8fafc'), white]),
            ('GRID',         (0,0), (-1,-1), 0.4, HexColor('#cbd5e1')),
            ('TOPPADDING',   (0,0), (-1,-1), 4),
            ('BOTTOMPADDING',(0,0), (-1,-1), 4),
            ('LEFTPADDING',  (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        flowables.append(Spacer(1, 4))
        flowables.append(t)
        flowables.append(Spacer(1, 8))
        table_rows = []

    def flush_code():
        """Crée un bloc Preformatted depuis les lignes de code."""
        nonlocal code_lines, code_lang
        if not code_lines:
            code_lines = []
            code_lang  = ''
            return
        # Supprime les lignes vides en tête et en queue
        while code_lines and not code_lines[0].strip():
            code_lines.pop(0)
        while code_lines and not code_lines[-1].strip():
            code_lines.pop()
        if not code_lines:
            code_lines = []
            code_lang  = ''
            return

        raw = '\n'.join(code_lines)
        # Échappe XML
        raw = raw.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        # Tronque les très longues lignes
        short_lines = []
        for ln in raw.split('\n'):
            if len(ln) > 110:
                short_lines.append(ln[:110] + '…')
            else:
                short_lines.append(ln)
        raw = '\n'.join(short_lines)

        # Étiquette de langage
        lang_label = ''
        if code_lang and code_lang.strip():
            lang_map = {
                'typescript': 'TypeScript', 'ts': 'TypeScript',
                'javascript': 'JavaScript', 'js': 'JavaScript',
                'python': 'Python', 'py': 'Python',
                'bash': 'Bash / Shell', 'sh': 'Shell',
                'sql': 'SQL', 'json': 'JSON', 'yaml': 'YAML',
                'dockerfile': 'Dockerfile', 'txt': 'Texte',
            }
            lang_label = lang_map.get(code_lang.lower().strip(), code_lang.strip())

        if lang_label:
            flowables.append(
                Paragraph(f'<font color="#94a3b8">{xml_escape(lang_label)}</font>',
                          STYLES['caption'])
            )

        pre = Preformatted(raw, ParagraphStyle(
            'code_pre',
            fontName='Courier', fontSize=6.8, leading=10,
            textColor=FGWHITE, backColor=NAVY,
            leftIndent=6, rightIndent=6,
            spaceBefore=2, spaceAfter=8,
            borderPad=8,
        ))
        flowables.append(pre)
        code_lines = []
        code_lang  = ''

    # ── Boucle principale ──────────────────────────────────────────────────────
    first_h1 = True
    for line in lines:
        raw_line = line

        # ── Blocs de code ──────────────────────────────────────────────────────
        if raw_line.startswith('```'):
            if not in_code:
                flush_para()
                flush_table()
                in_code   = True
                code_lang = raw_line[3:].strip()
            else:
                in_code = False
                flush_code()
            continue

        if in_code:
            code_lines.append(raw_line)
            continue

        # ── Tables ─────────────────────────────────────────────────────────────
        if raw_line.startswith('|'):
            if not in_table:
                flush_para()
                in_table = True
            table_rows.append(raw_line)
            continue
        else:
            if in_table:
                in_table = False
                flush_table()

        # ── Lignes vides ───────────────────────────────────────────────────────
        if not raw_line.strip():
            flush_para()
            continue

        # ── Séparateurs --- ────────────────────────────────────────────────────
        if re.match(r'^---+$', raw_line.strip()):
            flush_para()
            flowables.append(HRFlowable(width='100%', thickness=0.5,
                                        color=SLATE, spaceAfter=6))
            continue

        # ── Titres ─────────────────────────────────────────────────────────────
        h4m = re.match(r'^####\s+(.*)', raw_line)
        h3m = re.match(r'^###\s+(.*)', raw_line)
        h2m = re.match(r'^##\s+(.*)', raw_line)
        h1m = re.match(r'^#\s+(.*)', raw_line)

        if h1m:
            flush_para()
            title_txt = strip_emoji(h1m.group(1).strip())
            if not first_h1:
                flowables.append(PageBreak())
            else:
                first_h1 = False
            label = f'{chapter_num}. {title_txt}'
            flowables.append(Paragraph(label, STYLES['h1']))
            flowables.append(HRFlowable(width='100%', thickness=1.5,
                                        color=AMBER, spaceAfter=8))
            continue

        if h2m:
            flush_para()
            title_txt = strip_emoji(h2m.group(1).strip())
            flowables.append(Spacer(1, 4))
            flowables.append(Paragraph(title_txt, STYLES['h2']))
            continue

        if h3m:
            flush_para()
            title_txt = strip_emoji(h3m.group(1).strip())
            flowables.append(Paragraph(title_txt, STYLES['h3']))
            continue

        if h4m:
            flush_para()
            title_txt = strip_emoji(h4m.group(1).strip())
            flowables.append(Paragraph(title_txt, STYLES['h4']))
            continue

        # ── Images ─────────────────────────────────────────────────────────────
        img_m = re.match(r'^!\[([^\]]*)\]\(([^\)]+)\)', raw_line.strip())
        if img_m:
            flush_para()
            alt   = img_m.group(1)
            ipath = img_m.group(2)
            # Résolution du chemin depuis img_dir
            fname = Path(ipath).name
            full  = img_dir / fname
            if full.exists():
                try:
                    max_w = CONTENT_W
                    max_h = 14 * cm
                    img   = RLImage(str(full), width=max_w, height=max_h,
                                   kind='proportional')
                    flowables.append(Spacer(1, 6))
                    flowables.append(img)
                    cap = f'Figure — {strip_emoji(alt)} ({fname})'
                    flowables.append(Paragraph(cap, STYLES['caption']))
                    flowables.append(Spacer(1, 6))
                except Exception as e:
                    flowables.append(Paragraph(
                        f'[Image non chargée : {fname} — {e}]', STYLES['body']))
            else:
                flowables.append(Paragraph(
                    f'[Image manquante : {fname}]', STYLES['body']))
            continue

        # ── Citation > ──────────────────────────────────────────────────────────
        quote_m = re.match(r'^>\s*(.*)', raw_line)
        if quote_m:
            flush_para()
            qt = strip_emoji(quote_m.group(1))
            if qt:
                flowables.append(Paragraph(
                    f'<i>{md_inline(qt)}</i>', STYLES['quote']))
            continue

        # ── Listes à puces ─────────────────────────────────────────────────────
        # Niveau 2 (4 espaces ou tab)
        sub_m = re.match(r'^(?:    |\t)\s*[-*]\s+(.*)', raw_line)
        # Niveau 1
        bul_m = re.match(r'^[-*]\s+(.*)', raw_line)

        if sub_m:
            flush_para()
            txt = strip_emoji(sub_m.group(1))
            flowables.append(Paragraph(
                f'&nbsp;&nbsp;&nbsp;&nbsp;&#8226; {md_inline(txt)}',
                STYLES['subbullet']))
            continue

        if bul_m:
            flush_para()
            txt = strip_emoji(bul_m.group(1))
            flowables.append(Paragraph(
                f'&#8226; {md_inline(txt)}',
                STYLES['bullet']))
            continue

        # ── Lignes numérotées ──────────────────────────────────────────────────
        num_m = re.match(r'^(\d+)\.\s+(.*)', raw_line)
        if num_m:
            flush_para()
            num = num_m.group(1)
            txt = strip_emoji(num_m.group(2))
            flowables.append(Paragraph(
                f'<b>{num}.</b> {md_inline(txt)}',
                STYLES['bullet']))
            continue

        # ── Paragraphe ordinaire ───────────────────────────────────────────────
        para_lines.append(strip_emoji(raw_line.strip()))

    # Fin du fichier
    flush_para()
    flush_table()
    if in_code:
        flush_code()

    return flowables

# ── Sommaire ────────────────────────────────────────────────────────────────────
def build_toc():
    """Retourne le flowable TableOfContents ReportLab."""
    toc = TableOfContents()
    toc.levelStyles = [STYLES['toc0'], STYLES['toc1']]
    toc.dotsMinLevel = 0
    return toc

# ── Page de titre (flowable) ───────────────────────────────────────────────────
class TitlePageFlowable:
    """Pseudo-flowable déclenchant la page de titre via NextPageTemplate."""
    pass

# ── Assemblage principal ───────────────────────────────────────────────────────
def build_pdf():
    # ── 1. Vérification des fichiers ───────────────────────────────────────────
    print('\nVérification des 15 fichiers sections...')
    missing = []
    for fname in SECTIONS:
        p = SECTIONS_DIR / fname
        if not p.exists():
            missing.append(fname)
            print(f'  MANQUANT : {fname}')
        else:
            print(f'  OK : {fname}')

    if missing:
        print(f'\nERREUR : {len(missing)} fichier(s) manquant(s). Arrêt.')
        sys.exit(1)

    print(f'\nTous les {len(SECTIONS)} fichiers sont presents.')

    # ── 2. Construction du document ────────────────────────────────────────────
    doc = AlvioDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN + 0.8*cm, bottomMargin=MARGIN + 0.8*cm,
    )

    story = []

    # ── Page de titre ──────────────────────────────────────────────────────────
    story.append(NextPageTemplate('TitlePage'))
    story.append(PageBreak())

    # ── Sommaire ───────────────────────────────────────────────────────────────
    story.append(NextPageTemplate('TOCPage'))
    story.append(PageBreak())
    story.append(Paragraph('Sommaire', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=AMBER, spaceAfter=12))
    toc = build_toc()
    story.append(toc)

    # ── Contenu des 15 sections ────────────────────────────────────────────────
    story.append(NextPageTemplate('Content'))
    story.append(PageBreak())

    section_titles = []
    for i, fname in enumerate(SECTIONS, start=1):
        fpath = SECTIONS_DIR / fname
        print(f'  Parsing {fname}...')
        flowables = parse_md(str(fpath), i, IMG_DIR)
        # Récupère le titre H1 pour le résumé
        first_h1 = None
        for fl in flowables:
            if isinstance(fl, Paragraph) and fl.style.name == 'H1':
                first_h1 = fl.getPlainText()
                break
        section_titles.append((i, fname, first_h1 or fname))
        story.extend(flowables)
        story.append(PageBreak())

    # ── Build deux passes (pour TOC avec numéros de page) ─────────────────────
    print('\nGeneration du PDF (2 passes pour le sommaire)...')
    doc.multiBuild(story)

    return section_titles

# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('=' * 62)
    print('  BUILD PDF — Rapport de Projet CDA Alvio')
    print('=' * 62)

    section_titles = build_pdf()

    # ── Résumé final ──────────────────────────────────────────────────────────
    pdf_size = OUTPUT.stat().st_size

    # Nombre de pages via réouverture du PDF (compte les occurrences de /Page )
    try:
        from reportlab.lib.utils import ImageReader
        # Approche simple : re-lecture du doc pour compter les pages
        with open(str(OUTPUT), 'rb') as f:
            content = f.read()
        page_count = content.count(b'/Type /Page\n') + content.count(b'/Type/Page\n')
        if page_count == 0:
            page_count = content.count(b'/Page ')
    except Exception:
        page_count = '?'

    print()
    print('=' * 62)
    print('  RÉSUMÉ DE GÉNÉRATION')
    print('=' * 62)
    print(f'\n  Sections incluses ({len(section_titles)}/15) :')
    for num, fname, title in section_titles:
        label = title[:55] + '...' if len(title) > 55 else title
        print(f'    {num:02d}. {label}')

    print(f'\n  Pages totales estimées : {page_count}')
    print(f'  Chemin de sortie       : {OUTPUT}')
    print(f'  Taille du fichier      : {pdf_size / 1024 / 1024:.2f} MB')
    print()
    print('=' * 62)
    print('  PDF genere avec succes.')
    print('=' * 62)
