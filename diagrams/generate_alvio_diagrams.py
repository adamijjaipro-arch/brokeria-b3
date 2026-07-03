#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_alvio_diagrams.py
==========================
Génère 3 diagrammes PNG haute résolution (300 DPI) pour le projet Alvio :
  - MCD_ALVIO.png  : Modèle Conceptuel de Données (entités + relations sémantiques, sans FK)
  - MLD_ALVIO.png  : Modèle Logique de Données (tables + FK + types logiques)
  - MPD_ALVIO.png  : Modèle Physique de Données (SQL exact + contraintes + index)

Usage : python generate_alvio_diagrams.py
Deps  : pip install graphviz pydot pillow
Sys   : Graphviz binaire requis (winget install Graphviz.Graphviz)
"""

import os
import sys

# ─── Résolution automatique du binaire Graphviz ────────────────────────────────
GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
if os.path.isdir(GRAPHVIZ_BIN) and GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

import graphviz  # noqa: E402

# ─── Configuration ─────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
DPI        = "300"
FONT       = "Helvetica"

# ─── Couleurs par domaine ──────────────────────────────────────────────────────
DOMAIN_COLORS = {
    "user":      ("#1E3A5F", "white"),   # Bleu marine — entité centrale
    "trading":   ("#4A1942", "white"),   # Violet       — Signal, Strategy
    "auth":      ("#1B4332", "white"),   # Vert foncé   — AuthLog, WebAuthn
    "analytics": ("#1A3A4A", "white"),   # Bleu pétrole — Report, Portfolio, Sim
    "formation": ("#7B3F00", "white"),   # Marron       — Course, Lesson, Progress
    "enum":      ("#5C4033", "white"),   # Terre        — Enums
}

def domain_color(domain):
    return DOMAIN_COLORS.get(domain, ("#333333", "white"))

def esc(s):
    return str(s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

# ─── Schéma complet Alvio ─────────────────────────────────────────────────────
# Colonnes : (name, prisma_type, sql_type, [constraints...], notes)
# Contraintes reconnues : "PK", "FK:Table", "UK", "NN", "NULL", "DEFAULT:val"

ENUMS = {
    "CourseLevel": ["DEBUTANT", "INTERMEDIAIRE", "AVANCE", "EXPERT"],
    "LessonType":  ["VIDEO", "ARTICLE", "QUIZ"],
}

TABLES = {
    "User": {
        "domain": "user",
        "columns": [
            ("id",                  "String",      "TEXT",             ["PK","NN"],                 "cuid()"),
            ("username",            "String",      "TEXT",             ["UK","NN"],                 ""),
            ("email",               "String",      "TEXT",             ["UK","NN"],                 ""),
            ("passwordHash",        "String?",     "TEXT",             ["NULL"],                    "Null si GitHub/MagicLink"),
            ("githubId",            "String?",     "TEXT",             ["UK","NULL"],               "Null si email/password"),
            ("pin",                 "String?",     "TEXT",             ["NULL"],                    "bcrypt"),
            ("totpSecret",          "String?",     "TEXT",             ["NULL"],                    "AES-256-GCM"),
            ("totpEnabled",         "Boolean",     "BOOLEAN",          ["NN","DEFAULT:false"],       ""),
            ("trading_preference",  "String?",     "TEXT",             ["DEFAULT:'moderate'"],       ""),
            ("email_notifications", "Boolean",     "BOOLEAN",          ["NN","DEFAULT:true"],        ""),
            ("createdAt",           "DateTime",    "TIMESTAMP(3)",     ["NN","DEFAULT:NOW()"],       ""),
            ("updatedAt",           "DateTime",    "TIMESTAMP(3)",     ["NN"],                      "@updatedAt"),
        ],
    },
    "Signal": {
        "domain": "trading",
        "columns": [
            ("id",                "String",   "TEXT",             ["PK","NN"],             "cuid()"),
            ("userId",            "String",   "TEXT",             ["FK:User","NN"],        "CASCADE"),
            ("strategyId",        "String?",  "TEXT",             ["NULL"],                "⚠ INDEX, pas FK"),
            ("asset",             "String",   "TEXT",             ["NN"],                  "ex: bitcoin"),
            ("timeframe",         "String?",  "TEXT",             ["NULL"],                "1h|4h|1d"),
            ("direction",         "String",   "TEXT",             ["NN"],                  "BUY|SELL|HOLD"),
            ("status",            "String",   "TEXT",             ["NN","DEFAULT:'OPEN'"], "OPEN|CLOSED"),
            ("entry_price",       "Float",    "DOUBLE PRECISION", ["NN"],                  ""),
            ("stop_loss",         "Float",    "DOUBLE PRECISION", ["NN"],                  ""),
            ("take_profit",       "Float",    "DOUBLE PRECISION", ["NN"],                  ""),
            ("exit_price",        "Float?",   "DOUBLE PRECISION", ["NULL"],                "à la clôture"),
            ("confidence",        "Float",    "DOUBLE PRECISION", ["NN"],                  "0–100"),
            ("risk_reward_ratio", "Float?",   "DOUBLE PRECISION", ["NULL"],                ""),
            ("patterns",          "String?",  "TEXT",             ["NULL"],                "JSON array"),
            ("indicators",        "String?",  "TEXT",             ["NULL"],                "JSON object"),
            ("closedAt",          "DateTime?","TIMESTAMP(3)",     ["NULL"],                ""),
            ("createdAt",         "DateTime", "TIMESTAMP(3)",     ["NN","DEFAULT:NOW()"],  ""),
            ("updatedAt",         "DateTime", "TIMESTAMP(3)",     ["NN"],                  ""),
        ],
    },
    "Strategy": {
        "domain": "trading",
        "columns": [
            ("id",           "String",  "TEXT",             ["PK","NN"],                "cuid()"),
            ("userId",       "String",  "TEXT",             ["FK:User","NN"],           "CASCADE"),
            ("name",         "String",  "TEXT",             ["NN"],                     ""),
            ("description",  "String?", "TEXT",             ["NULL"],                   ""),
            ("code",         "String",  "TEXT",             ["NN"],                     "JSON StrategyRules"),
            ("asset",        "String",  "TEXT",             ["NN"],                     ""),
            ("timeframe",    "String",  "TEXT",             ["NN"],                     "15m|1h|4h|1d"),
            ("status",       "String",  "TEXT",             ["NN","DEFAULT:'inactive'"], "active|inactive"),
            ("win_rate",     "Float?",  "DOUBLE PRECISION", ["NULL"],                   "post-backtest"),
            ("total_trades", "Int?",    "INTEGER",          ["NULL"],                   "post-backtest"),
            ("profit_factor","Float?",  "DOUBLE PRECISION", ["NULL"],                   "post-backtest"),
            ("createdAt",    "DateTime","TIMESTAMP(3)",     ["NN","DEFAULT:NOW()"],      ""),
            ("updatedAt",    "DateTime","TIMESTAMP(3)",     ["NN"],                      ""),
        ],
    },
    "Report": {
        "domain": "analytics",
        "columns": [
            ("id",                      "String",  "TEXT",             ["PK","NN"],           "cuid()"),
            ("userId",                  "String",  "TEXT",             ["FK:User","NN"],      "CASCADE"),
            ("month",                   "Int",     "INTEGER",          ["NN"],                "1–12"),
            ("year",                    "Int",     "INTEGER",          ["NN"],                ""),
            ("total_signals",           "Int",     "INTEGER",          ["NN"],                ""),
            ("buy_signals",             "Int",     "INTEGER",          ["NN"],                ""),
            ("sell_signals",            "Int",     "INTEGER",          ["NN"],                ""),
            ("hold_signals",            "Int",     "INTEGER",          ["NN"],                ""),
            ("win_rate",                "Float",   "DOUBLE PRECISION", ["NN"],                ""),
            ("avg_confidence",          "Float",   "DOUBLE PRECISION", ["NN"],                ""),
            ("best_signal_confidence",  "Float",   "DOUBLE PRECISION", ["NN"],                ""),
            ("worst_signal_confidence", "Float",   "DOUBLE PRECISION", ["NN"],                ""),
            ("total_pnl_estimate",      "Float",   "DOUBLE PRECISION", ["NN"],                ""),
            ("total_trades_expected",   "Int",     "INTEGER",          ["NN"],                ""),
            ("high_confidence_signals", "Int",     "INTEGER",          ["NN"],                ">=75%"),
            ("patterns_detected",       "String?", "TEXT",             ["NULL"],              "JSON {name:count}"),
            ("indicators_used",         "String?", "TEXT",             ["NULL"],              "JSON array"),
            ("summary",                 "String?", "TEXT",             ["NULL"],              ""),
            ("createdAt",               "DateTime","TIMESTAMP(3)",     ["NN","DEFAULT:NOW()"],""),
            ("updatedAt",               "DateTime","TIMESTAMP(3)",     ["NN"],                ""),
        ],
    },
    "PortfolioSnapshot": {
        "domain": "analytics",
        "columns": [
            ("id",        "String",  "TEXT",            ["PK","NN"],           "cuid()"),
            ("userId",    "String",  "TEXT",            ["FK:User","NN"],      "CASCADE"),
            ("capital",   "Float",   "DOUBLE PRECISION",["NN"],                ""),
            ("month",     "Int",     "INTEGER",         ["NN"],                "1–12"),
            ("year",      "Int",     "INTEGER",         ["NN"],                ""),
            ("createdAt", "DateTime","TIMESTAMP(3)",    ["NN","DEFAULT:NOW()"],""),
        ],
    },
    "SimulationResult": {
        "domain": "analytics",
        "columns": [
            ("id",          "String",  "TEXT",        ["PK","NN"],           "cuid()"),
            ("userId",      "String",  "TEXT",        ["FK:User","NN"],      "CASCADE"),
            ("asset",       "String",  "TEXT",        ["NN"],                ""),
            ("params",      "String",  "TEXT",        ["NN"],                "JSON"),
            ("result",      "String",  "TEXT",        ["NN"],                "JSON"),
            ("monthlyData", "String?", "TEXT",        ["NULL"],              "JSON array"),
            ("createdAt",   "DateTime","TIMESTAMP(3)",["NN","DEFAULT:NOW()"],""),
        ],
    },
    "WebAuthnCredential": {
        "domain": "auth",
        "columns": [
            ("id",           "String",   "TEXT",        ["PK","NN"],            "cuid()"),
            ("userId",       "String",   "TEXT",        ["FK:User","NN"],       "CASCADE"),
            ("credentialId", "String",   "TEXT",        ["UK","NN"],            "base64url"),
            ("publicKey",    "String",   "TEXT",        ["NN"],                 "COSE base64url"),
            ("counter",      "Int",      "INTEGER",     ["NN","DEFAULT:0"],     "anti-rejeu"),
            ("deviceType",   "String?",  "TEXT",        ["NULL"],               "single|multi"),
            ("backedUp",     "Boolean",  "BOOLEAN",     ["NN","DEFAULT:false"], ""),
            ("transports",   "String?",  "TEXT",        ["NULL"],               "JSON array"),
            ("aaguid",       "String?",  "TEXT",        ["NULL"],               "UUID v4"),
            ("createdAt",    "DateTime", "TIMESTAMP(3)",["NN","DEFAULT:NOW()"], ""),
            ("lastUsedAt",   "DateTime?","TIMESTAMP(3)",["NULL"],               ""),
        ],
    },
    "AuthLog": {
        "domain": "auth",
        "columns": [
            ("id",        "String",  "TEXT",        ["PK","NN"],           "cuid()"),
            ("userId",    "String?", "TEXT",        ["NULL"],              "NULL sans FK SQL"),
            ("action",    "String",  "TEXT",        ["NN"],                "AUTH_SUCCESS|FAILURE|..."),
            ("result",    "String",  "TEXT",        ["NN"],                "SUCCESS|FAILURE"),
            ("ip",        "String?", "TEXT",        ["NULL"],              ""),
            ("detail",    "String?", "TEXT",        ["NULL"],              ""),
            ("createdAt", "DateTime","TIMESTAMP(3)",["NN","DEFAULT:NOW()"],""),
        ],
    },
    "Course": {
        "domain": "formation",
        "columns": [
            ("id",           "String",      "TEXT",        ["PK","NN"],            "cuid()"),
            ("title",        "String",      "TEXT",        ["NN"],                 ""),
            ("description",  "String",      "TEXT",        ["NN"],                 ""),
            ("level",        "CourseLevel", "CourseLevel", ["NN"],                 "ENUM"),
            ("category",     "String",      "TEXT",        ["NN"],                 ""),
            ("thumbnail",    "String?",     "TEXT",        ["NULL"],               "URL"),
            ("duration",     "Int",         "INTEGER",     ["NN"],                 "minutes"),
            ("totalLessons", "Int",         "INTEGER",     ["NN"],                 ""),
            ("order",        "Int",         "INTEGER",     ["NN"],                 ""),
            ("isPublished",  "Boolean",     "BOOLEAN",     ["NN","DEFAULT:false"], ""),
            ("createdAt",    "DateTime",    "TIMESTAMP(3)",["NN","DEFAULT:NOW()"], ""),
        ],
    },
    "Lesson": {
        "domain": "formation",
        "columns": [
            ("id",          "String",     "TEXT",        ["PK","NN"],           "cuid()"),
            ("courseId",    "String",     "TEXT",        ["FK:Course","NN"],    "CASCADE"),
            ("title",       "String",     "TEXT",        ["NN"],                ""),
            ("description", "String",     "TEXT",        ["NN"],                ""),
            ("videoUrl",    "String?",    "TEXT",        ["NULL"],              "Null si ARTICLE/QUIZ"),
            ("content",     "String",     "TEXT",        ["NN"],                ""),
            ("duration",    "Int",        "INTEGER",     ["NN"],                "minutes"),
            ("order",       "Int",        "INTEGER",     ["NN"],                ""),
            ("type",        "LessonType", "LessonType",  ["NN"],                "ENUM"),
            ("createdAt",   "DateTime",   "TIMESTAMP(3)",["NN","DEFAULT:NOW()"],""),
        ],
    },
    "UserProgress": {
        "domain": "formation",
        "columns": [
            ("id",        "String",  "TEXT",        ["PK","NN"],           "cuid()"),
            ("userId",    "String",  "TEXT",        ["FK:User","NN"],      "CASCADE"),
            ("courseId",  "String?", "TEXT",        ["FK:Course","NULL"],  "SET NULL"),
            ("lessonId",  "String?", "TEXT",        ["FK:Lesson","NULL"],  "SET NULL"),
            ("completed", "Boolean", "BOOLEAN",     ["NN","DEFAULT:false"],""),
            ("score",     "Int?",    "INTEGER",     ["NULL"],              "Quiz only"),
            ("createdAt", "DateTime","TIMESTAMP(3)",["NN","DEFAULT:NOW()"],""),
            ("updatedAt", "DateTime","TIMESTAMP(3)",["NN"],                ""),
        ],
    },
}

INDEXES = {
    "User":               [("UK","username","User_username_key"),("UK","email","User_email_key"),("UK","githubId","User_githubId_key")],
    "Signal":             [("IDX","userId","Signal_userId_idx"),("IDX","asset","Signal_asset_idx"),("IDX","strategyId","Signal_strategyId_idx"),("CIDX","strategyId+asset+direction+status","Signal_composite_idx")],
    "Strategy":           [("IDX","userId","Strategy_userId_idx")],
    "Report":             [("UK","userId+month+year","Report_userId_month_year_key"),("IDX","userId","Report_userId_idx")],
    "PortfolioSnapshot":  [("UK","userId+month+year","PortfolioSnapshot_userId_month_year_key"),("IDX","userId","PortfolioSnapshot_userId_idx")],
    "SimulationResult":   [("IDX","userId","SimulationResult_userId_idx")],
    "WebAuthnCredential": [("UK","credentialId","WebAuthnCredential_credentialId_key"),("IDX","userId","WebAuthnCredential_userId_idx")],
    "Course":             [("IDX","level","Course_level_idx"),("IDX","isPublished","Course_isPublished_idx")],
    "Lesson":             [("IDX","courseId","Lesson_courseId_idx")],
    "UserProgress":       [("UK","userId+lessonId","UserProgress_userId_lessonId_key"),("IDX","userId","UserProgress_userId_idx"),("IDX","courseId","UserProgress_courseId_idx")],
}

# Relations sémantiques MCD : (from, to, label, card_from, card_to)
RELATIONS_MCD = [
    ("User","Signal",            "génère",     "1","0..N"),
    ("User","Strategy",          "possède",    "1","0..N"),
    ("User","Report",            "reçoit",     "1","0..N"),
    ("User","PortfolioSnapshot", "suit",       "1","0..N"),
    ("User","SimulationResult",  "simule",     "1","0..N"),
    ("User","WebAuthnCredential","enregistre", "1","0..N"),
    ("User","UserProgress",      "progresse",  "1","0..N"),
    ("Signal","Strategy",        "basé sur",   "0..N","0..1"),
    ("Course","Lesson",          "contient",   "1","1..N"),
    ("UserProgress","Course",    "concerne",   "0..N","0..1"),
    ("UserProgress","Lesson",    "porte sur",  "0..N","0..1"),
]

# Relations FK MLD/MPD : (from, from_col, to, to_col, on_delete)
RELATIONS_FK = [
    ("Signal",            "userId",   "User",   "id", "CASCADE"),
    ("Strategy",          "userId",   "User",   "id", "CASCADE"),
    ("Report",            "userId",   "User",   "id", "CASCADE"),
    ("PortfolioSnapshot", "userId",   "User",   "id", "CASCADE"),
    ("SimulationResult",  "userId",   "User",   "id", "CASCADE"),
    ("WebAuthnCredential","userId",   "User",   "id", "CASCADE"),
    ("UserProgress",      "userId",   "User",   "id", "CASCADE"),
    ("Lesson",            "courseId", "Course", "id", "CASCADE"),
    ("UserProgress",      "courseId", "Course", "id", "SET NULL"),
    ("UserProgress",      "lessonId", "Lesson", "id", "SET NULL"),
]

# ─── Helpers ───────────────────────────────────────────────────────────────────

def row_color(constraints):
    if "PK" in constraints:
        return "#FFF9C4"
    if any(c.startswith("FK:") for c in constraints):
        return "#E3F2FD"
    if "UK" in constraints:
        return "#E8F5E9"
    return "white"

def is_fk(constraints):
    return any(c.startswith("FK:") for c in constraints)

def base_graph(name, rankdir="LR", size="28,20", extra=None):
    attrs = {
        "rankdir": rankdir,
        "bgcolor": "white",
        "fontname": FONT,
        "fontsize": "11",
        "splines": "spline",
        "nodesep": "0.9",
        "ranksep": "1.6",
        "pad": "0.8",
        "dpi": DPI,
        "size": size,
        "overlap": "false",
    }
    if extra:
        attrs.update(extra)
    return graphviz.Digraph(
        name,
        graph_attr=attrs,
        node_attr={"fontname": FONT, "fontsize": "11"},
        edge_attr={"fontname": FONT, "fontsize": "9", "color": "#444444"},
    )

# ─── Nœuds MCD ────────────────────────────────────────────────────────────────

def node_mcd_entity(g, name, domain):
    bg, fg = domain_color(domain)
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8" BGCOLOR="white">'
        f'<TR><TD BGCOLOR="{bg}"><FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="15"><B>{esc(name)}</B></FONT></TD></TR>'
        f'</TABLE>>'
    )
    g.node(name, label=label, shape="none", margin="0")

def node_mcd_enum(g, enum_name, values):
    bg, fg = domain_color("enum")
    rows = "".join(
        f'<TR><TD ALIGN="LEFT" CELLPADDING="4"><FONT FACE="{FONT}" POINT-SIZE="10">{esc(v)}</FONT></TD></TR>'
        for v in values
    )
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="white">'
        f'<TR><TD BGCOLOR="{bg}" CELLPADDING="6"><FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="11">'
        f'<B>&lt;&lt;enum&gt;&gt;<BR/>{esc(enum_name)}</B></FONT></TD></TR>'
        f'{rows}</TABLE>>'
    )
    g.node(f"enum_{enum_name}", label=label, shape="none", margin="0")

# ─── Nœuds MLD ────────────────────────────────────────────────────────────────

def node_mld(g, name, columns, domain):
    bg, fg = domain_color(domain)
    rows = []
    for col, ptype, _, constraints, _ in columns:
        rc = row_color(constraints)
        marker = "# " if "PK" in constraints else ("* " if is_fk(constraints) else ("◆ " if "UK" in constraints else "  "))
        null_tag = " ?" if ("NULL" in constraints and "NN" not in constraints) else ""
        rows.append(
            f'<TR>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="4"><FONT FACE="{FONT}" POINT-SIZE="10">{esc(marker + col + null_tag)}</FONT></TD>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="4"><FONT FACE="{FONT}" POINT-SIZE="9" COLOR="#555555">{esc(ptype)}</FONT></TD>'
            f'</TR>'
        )
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="white">'
        f'<TR><TD COLSPAN="2" BGCOLOR="{bg}" ALIGN="CENTER" CELLPADDING="7">'
        f'<FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="13"><B>{esc(name)}</B></FONT></TD></TR>'
        + "".join(rows) +
        f'</TABLE>>'
    )
    g.node(name, label=label, shape="none", margin="0")

def node_mld_enum(g, enum_name, values):
    bg, fg = domain_color("enum")
    rows = "".join(
        f'<TR><TD ALIGN="LEFT" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="9">{esc(v)}</FONT></TD></TR>'
        for v in values
    )
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="white">'
        f'<TR><TD BGCOLOR="{bg}" CELLPADDING="5"><FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="10">'
        f'<B>«enum»<BR/>{esc(enum_name)}</B></FONT></TD></TR>'
        f'{rows}</TABLE>>'
    )
    g.node(f"enum_{enum_name}", label=label, shape="none", margin="0")

# ─── Nœuds MPD ────────────────────────────────────────────────────────────────

def node_mpd(g, name, columns, domain, indexes=None):
    bg, fg = domain_color(domain)
    rows = []
    for col, _, stype, constraints, notes in columns:
        rc = row_color(constraints)
        parts = []
        if "PK" in constraints:       parts.append("PK")
        for c in constraints:
            if c.startswith("FK:"):   parts.append(c)
        if "UK" in constraints:       parts.append("UK")
        if "NN" in constraints:       parts.append("NOT NULL")
        else:                         parts.append("NULL")
        for c in constraints:
            if c.startswith("DEFAULT:"):  parts.append(c)
        cons_str = " | ".join(parts)
        notes_cell = esc(notes) if notes else "&#160;"
        rows.append(
            f'<TR>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="9"><B>{esc(col)}</B></FONT></TD>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#1565C0">{esc(stype)}</FONT></TD>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#555555">{esc(cons_str)}</FONT></TD>'
            f'<TD ALIGN="LEFT" BGCOLOR="{rc}" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#999999">{notes_cell}</FONT></TD>'
            f'</TR>'
        )
    # en-tête colonnes
    header_row = (
        f'<TR>'
        f'<TD BGCOLOR="#DDDDDD" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8"><B>Colonne</B></FONT></TD>'
        f'<TD BGCOLOR="#DDDDDD" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8"><B>Type SQL</B></FONT></TD>'
        f'<TD BGCOLOR="#DDDDDD" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8"><B>Contraintes</B></FONT></TD>'
        f'<TD BGCOLOR="#DDDDDD" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="8"><B>Notes</B></FONT></TD>'
        f'</TR>'
    )
    # section index
    idx_html = ""
    if indexes:
        badges = {"UK": "🔒", "IDX": "📑", "CIDX": "📊"}
        idx_html = (
            f'<TR><TD COLSPAN="4" BGCOLOR="#EEEEEE" CELLPADDING="3">'
            f'<FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#333333"><B>INDEX</B></FONT></TD></TR>'
        )
        for itype, icols, iname in indexes:
            badge = badges.get(itype, "")
            idx_html += (
                f'<TR><TD COLSPAN="4" BGCOLOR="#F5F5F5" CELLPADDING="2">'
                f'<FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#666666">{esc(badge)} {esc(iname)} ({esc(icols)})</FONT>'
                f'</TD></TR>'
            )
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="white">'
        f'<TR><TD COLSPAN="4" BGCOLOR="{bg}" ALIGN="CENTER" CELLPADDING="6">'
        f'<FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="12"><B>{esc(name)}</B></FONT></TD></TR>'
        + header_row
        + "".join(rows)
        + idx_html
        + f'</TABLE>>'
    )
    g.node(name, label=label, shape="none", margin="0")

def node_mpd_enum(g, enum_name, values):
    bg, fg = domain_color("enum")
    rows = "".join(
        f"<TR><TD ALIGN='LEFT' CELLPADDING='3'><FONT FACE='{FONT}' POINT-SIZE='8'>'{esc(v)}'</FONT></TD></TR>"
        for v in values
    )
    label = (
        f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="white">'
        f'<TR><TD BGCOLOR="{bg}" CELLPADDING="4"><FONT COLOR="{fg}" FACE="{FONT}" POINT-SIZE="9">'
        f'<B>CREATE TYPE<BR/>"{esc(enum_name)}"<BR/>AS ENUM</B></FONT></TD></TR>'
        f'{rows}</TABLE>>'
    )
    g.node(f"enum_{enum_name}", label=label, shape="none", margin="0")

# ─── Légende MCD ──────────────────────────────────────────────────────────────

def add_legend(g):
    items = [
        ("#1E3A5F","white","User — entité centrale"),
        ("#4A1942","white","Signal, Strategy"),
        ("#1B4332","white","AuthLog, WebAuthn"),
        ("#1A3A4A","white","Report, Portfolio, Sim"),
        ("#7B3F00","white","Course, Lesson, Progress"),
        ("#5C4033","white","Enum"),
    ]
    rows = "".join(
        f'<TR><TD BGCOLOR="{bg}" WIDTH="20" HEIGHT="12"></TD>'
        f'<TD ALIGN="LEFT" CELLPADDING="3"><FONT FACE="{FONT}" POINT-SIZE="9">{esc(label)}</FONT></TD></TR>'
        for bg, _, label in items
    )
    g.node(
        "legend",
        label=f'<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="2" BGCOLOR="white" CELLPADDING="3">'
               f'<TR><TD COLSPAN="2" BGCOLOR="#DDDDDD" ALIGN="CENTER" CELLPADDING="4">'
               f'<FONT FACE="{FONT}" POINT-SIZE="10"><B>Légende</B></FONT></TD></TR>'
               f'{rows}</TABLE>>',
        shape="none",
        margin="0",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MCD
# ═══════════════════════════════════════════════════════════════════════════════

def generate_mcd():
    print("  Génération MCD ...")
    g = base_graph("MCD_Alvio", rankdir="LR", size="26,18")

    for name, vals in ENUMS.items():
        node_mcd_enum(g, name, vals)

    for name, tdef in TABLES.items():
        node_mcd_entity(g, name, tdef["domain"])

    add_legend(g)

    for frm, to, lbl, cf, ct in RELATIONS_MCD:
        g.edge(
            frm, to,
            label=f"  {lbl}  ",
            taillabel=cf, headlabel=ct,
            arrowhead="vee", arrowtail="none", dir="forward",
            fontsize="9", color="#555555",
            labeldistance="2.2", labelangle="30",
        )

    g.edge("enum_CourseLevel", "Course", style="dashed", arrowhead="open",
           color="#888888", fontsize="9", label="  level  ")
    g.edge("enum_LessonType",  "Lesson",  style="dashed", arrowhead="open",
           color="#888888", fontsize="9", label="  type  ")

    out = os.path.join(OUTPUT_DIR, "MCD_ALVIO")
    g.render(out, format="png", cleanup=True)
    print(f"  OK  ->  {out}.png")


# ═══════════════════════════════════════════════════════════════════════════════
# MLD
# ═══════════════════════════════════════════════════════════════════════════════

def generate_mld():
    print("  Génération MLD ...")
    g = base_graph("MLD_Alvio", rankdir="LR", size="34,22")

    for name, vals in ENUMS.items():
        node_mld_enum(g, name, vals)

    for name, tdef in TABLES.items():
        node_mld(g, name, tdef["columns"], tdef["domain"])

    # Note strategyId sans FK
    g.node(
        "note_sig",
        label=f'<<TABLE BORDER="1" CELLSPACING="0" BGCOLOR="#FFFDE7" CELLPADDING="5">'
               f'<TR><TD><FONT FACE="{FONT}" POINT-SIZE="9" COLOR="#E65100">'
               f'<B>Signal.strategyId</B><BR/>INDEX sans FK SQL<BR/>(intentionnel — audit trail)</FONT></TD></TR></TABLE>>',
        shape="none",
    )
    g.edge("note_sig", "Signal", style="dotted", arrowhead="none", color="#FF6F00")

    for frm, fc, to, tc, od in RELATIONS_FK:
        color = "#C62828" if od == "CASCADE" else "#E65100"
        g.edge(
            frm, to,
            label=f"  {fc} -> {tc}  ",
            taillabel="N", headlabel="1",
            arrowhead="vee", arrowtail="crow", dir="both",
            color=color, fontsize="8",
            labeldistance="2.3", labelangle="25",
        )

    g.edge("enum_CourseLevel", "Course", style="dashed", arrowhead="open",
           color="#888888", fontsize="8", label="  level  ")
    g.edge("enum_LessonType",  "Lesson",  style="dashed", arrowhead="open",
           color="#888888", fontsize="8", label="  type  ")

    out = os.path.join(OUTPUT_DIR, "MLD_ALVIO")
    g.render(out, format="png", cleanup=True)
    print(f"  OK  ->  {out}.png")


# ═══════════════════════════════════════════════════════════════════════════════
# MPD
# ═══════════════════════════════════════════════════════════════════════════════

def generate_mpd():
    print("  Génération MPD ...")
    g = base_graph("MPD_Alvio", rankdir="LR", size="46,30",
                   extra={"nodesep": "1.1", "ranksep": "2.2"})

    for name, vals in ENUMS.items():
        node_mpd_enum(g, name, vals)

    for name, tdef in TABLES.items():
        node_mpd(g, name, tdef["columns"], tdef["domain"], INDEXES.get(name))

    # Note Signal.strategyId
    g.node(
        "note_sig_fk",
        label=f'<<TABLE BORDER="1" CELLSPACING="0" BGCOLOR="#FFFDE7" CELLPADDING="5">'
               f'<TR><TD><FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#E65100">'
               f'<B>Signal.strategyId</B><BR/>INDEX seulement, pas de FK<BR/>'
               f'(survie apres DELETE Strategy)</FONT></TD></TR></TABLE>>',
        shape="none",
    )
    g.edge("note_sig_fk", "Signal", style="dotted", arrowhead="none", color="#FF6F00")

    # Note AuthLog.userId
    g.node(
        "note_auth_fk",
        label=f'<<TABLE BORDER="1" CELLSPACING="0" BGCOLOR="#FFFDE7" CELLPADDING="5">'
               f'<TR><TD><FONT FACE="{FONT}" POINT-SIZE="8" COLOR="#E65100">'
               f'<B>AuthLog.userId</B><BR/>NULL sans FK SQL<BR/>'
               f'(capture tentatives anonymes)</FONT></TD></TR></TABLE>>',
        shape="none",
    )
    g.edge("note_auth_fk", "AuthLog", style="dotted", arrowhead="none", color="#FF6F00")

    for frm, fc, to, tc, od in RELATIONS_FK:
        color = "#C62828" if od == "CASCADE" else "#E65100"
        lbl = f"  FK ({fc})\n  REF {to}({tc})\n  {od}  "
        g.edge(
            frm, to,
            label=lbl,
            arrowhead="vee", arrowtail="crow", dir="both",
            color=color, fontsize="7",
            labeldistance="2.6", labelangle="20",
        )

    g.edge("enum_CourseLevel", "Course", style="dashed", arrowhead="open",
           color="#888888", fontsize="7", label='  "level" CourseLevel  ')
    g.edge("enum_LessonType",  "Lesson",  style="dashed", arrowhead="open",
           color="#888888", fontsize="7", label='  "type" LessonType  ')

    out = os.path.join(OUTPUT_DIR, "MPD_ALVIO")
    g.render(out, format="png", cleanup=True)
    print(f"  OK  ->  {out}.png")


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print()
    print("=" * 62)
    print("  ALVIO — Génération MCD / MLD / MPD")
    print(f"  Output : {OUTPUT_DIR}")
    print(f"  DPI    : {DPI}")
    print("=" * 62)
    generate_mcd()
    generate_mld()
    generate_mpd()
    print("=" * 62)
    print("  Tous les diagrammes generes avec succes !")
    print(f"  diagrams/MCD_ALVIO.png")
    print(f"  diagrams/MLD_ALVIO.png")
    print(f"  diagrams/MPD_ALVIO.png")
    print("=" * 62)
    print()
