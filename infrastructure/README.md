# 🏗️ Infrastructure — Docker, CI/CD, Monitoring

## 📁 Fichiers et dossiers réels

```
08_Code_Base/
├── docker-compose.yml         ← Stack complète (9 services)
│   ├── postgres:15-alpine
│   ├── redis:7-alpine
│   ├── backend (NestJS, build ./backend-code)
│   ├── frontend (Next.js, build ./frontend-web)
│   ├── prometheus
│   ├── grafana
│   ├── elasticsearch
│   ├── kibana
│   └── logstash
├── backend-code/docker-compose.yml   ← Compose dev léger (postgres + redis seuls)
├── .github/workflows/
│   └── ci.yml                 ← Seul workflow CI/CD existant
└── monitoring/
    ├── prometheus/prometheus.yml
    ├── grafana/dashboards/mfa-security.json
    ├── grafana/provisioning/{dashboards,datasources}/
    ├── logstash/pipeline/brokeria.conf
    └── elasticsearch/detection-rules.ndjson
```

## 🎯 Déploiement

- **Local** : `docker-compose up` depuis `08_Code_Base/` (stack complète avec observabilité)
- **Backend** : Railway (variables d'env via `backend-code/.env.example`)
- **Frontend** : Vercel (CI/CD automatique)

## 📊 Observabilité

`LoggingService` (backend) alimente 4 canaux : console, table `AuthLog` (Postgres), Syslog UDP → Logstash → Elasticsearch → Kibana, et métriques Prometheus (`GET /metrics`, IP-allowlisté) → Grafana.

## ⚠️ À savoir

Les deux `docker-compose.yml` (racine et `backend-code/`) utilisent maintenant la même version de Postgres (`15-alpine`, alignée le 2026-07-09 — voir historique git du sous-module).

## 📖 Voir aussi

- Docker Compose complet → [`../docker-compose.yml`](../docker-compose.yml)
- CI/CD → [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Monitoring → [`../monitoring/`](../monitoring/)
- Détail des services et connexions externes → [`ARCHITECTURE_ALVIO_COMPLET.md`](../../../ARCHITECTURE_ALVIO_COMPLET.md) §8-9 (racine du repo)
