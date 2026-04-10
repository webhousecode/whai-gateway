# Prissammenligning: Anthropic Haiku vs. self-hosted Gemma 4 E4B

> Opdateret: April 2026  
> Grundlag: reelle token-counts fra `pnpm bench` (12 CMS-prompts, gemma4:e4b)

---

## Basis for sammenligning

Vores typiske CMS-kald (alt-text, slug, meta, html-cleanup, css, blog-intro) bruger i gennemsnit:

| | Tokens |
|-|--------|
| Input (system prompt + user prompt) | 86 |
| Output | 32 |
| **Total per kald** | **118** |

Disse tal er målt direkte fra Ollama's usage-respons på de 12 bench-prompts.

---

## Anthropic Claude 3.5 Haiku

| | Pris |
|-|------|
| Input | $0.80 / 1M tokens |
| Output | $4.00 / 1M tokens |

**Pris per kald:**
```
(86 × $0.80 + 32 × $4.00) / 1.000.000
= ($68,80 + $128,00) / 1.000.000
= $0,000197 per kald  (~$0,0002)
```

| Volumen/måned | Månedlig pris (Haiku) |
|---------------|----------------------|
| 1.000 kald    | $0,20                |
| 10.000 kald   | $1,97                |
| 100.000 kald  | $19,70               |
| 1.000.000 kald | $197                |

Haiku er **ekstremt billig** for lav volumen. Det er den vigtigste pointe i dette dokument.

---

## Self-hosted Gemma 4 E4B — GPU-udbydere

Gemma 4 E4B (9,6 GB, int4-kvantiseret) kræver minimum ~10 GB GPU-VRAM.

### GPU-priser (on-demand, april 2026)

| Udbyder | GPU | VRAM | Pris/time | Bemærkninger |
|---------|-----|------|-----------|--------------|
| **RunPod** | L40S | 48 GB | $0,79 | On-demand. Spot-pris ~$0,50 |
| **RunPod** | A100 80 GB SXM | 80 GB | $1,39 | On-demand |
| **Vast.ai** | A100 PCIe | 40/80 GB | $0,67–$1,00 | Marketplace — varierer meget |
| **Lambda Labs** | A10G | 24 GB | $0,60 | Muligvis for lille til fp16 — kræv int8/int4 |
| **Lambda Labs** | A100 80 GB | 80 GB | $1,29 | On-demand, stabilt tilgængeligt |
| **Fly.io** | L40S | 48 GB | $0,70 | ⚠️ **GPU deprecated — lukker aug. 2026** |
| **Fly.io** | A100 40 GB | 40 GB | $1,25 | ⚠️ **GPU deprecated — lukker aug. 2026** |
| **Scaleway** | L40S | 48 GB | €1,40 (~$1,55) | EU-baseret, god til GDPR |

### Estimeret inferens-throughput (Gemma 4 E4B, int4)

På en A100 eller L40S klarer Ollama typisk 150–300 tokens/sek for denne model.  
Med gennemsnitligt 118 tokens per kald:

- **Rent compute-tid per kald**: ~0,5 sek
- **Praktisk throughput** (med HTTP-overhead, Ollama-scheduling): ~2.000–5.000 kald/time

---

## Tre scenarier

### Model A: On-demand — spin op ved behov

Mest realistisk for vores use case (fallback + billige opgaver). GPU startes når den bruges, betales per sekund.

Antagelse: 0,5 sek GPU-tid per kald, RunPod L40S til $0,79/time.

```
Pris per kald = (0,5 / 3600) × $0,79 = $0,000110
```

| Volumen/måned | Haiku | Self-hosted (L40S on-demand) | Forskel |
|---------------|-------|------------------------------|---------|
| 1.000 kald    | $0,20 | $0,11                        | Haiku $0,09 dyrere |
| 10.000 kald   | $1,97 | $1,10                        | Haiku $0,87 dyrere |
| 100.000 kald  | $19,70 | $11,00                      | Haiku $8,70 dyrere |
| 1.000.000 kald | $197  | $110                        | Haiku $87 dyrere |

Self-hosted er **~44% billigere per kald** end Haiku — *men kun hvis GPU'en er fuldt udnyttet*.

---

### Model B: Always-on (GPU kører 24/7)

Relevant hvis man vil have garanteret lav latency og ingen kold start.

Månedlig GPU-pris (730 timer):

| Udbyder/GPU | $/time | Månedlig fast pris |
|-------------|--------|--------------------|
| RunPod L40S | $0,79  | $577 |
| RunPod A100 | $1,39  | $1.015 |
| Vast.ai A100 | ~$0,80 | ~$584 |
| Lambda A100 | $1,29  | $942 |
| Scaleway L40S | $1,55 | $1.132 |

**Break-even vs. Haiku (always-on RunPod L40S til $577/md):**

```
$577 / $0,000197 per kald = ~2.930.000 kald/måned
```

Du skal altså lave **næsten 3 millioner kald om måneden** for at always-on GPU'en er billigere end Haiku. Det svarer til 100.000 kald om dagen.

---

### Model C: Serverless GPU (RunPod Serverless)

RunPod's serverless-platform afregner per sekund med automatisk skalering til nul.  
Typisk pris: ~$0,000225/sek for A100-klasse GPU.

```
Pris per kald = 0,5 sek × $0,000225 = $0,000113
```

Meget tæt på Model A, men med automatisk skalering og ingen kold-start-administration.

---

## Opsummering: hvornår giver self-hosted mening?

| Situation | Anbefaling |
|-----------|-----------|
| < 50.000 kald/md, ingen specielle krav | **Brug Haiku** — billigere og nul drift |
| Primært formål: availability-fallback | **Haiku er stadig OK** — outages er sjældne og kortvarige |
| > 100.000 kald/md med høj forudsigelighed | **On-demand GPU** begynder at give mening |
| Data-suverænitet / GDPR / ingen data til Anthropic | **Self-hosted** uanset pris (Scaleway EU eller on-prem) |
| Prompt-tuning og udvikling | **Lokal CPU-maskine** (gratis, som denne) |

---

## Fly.io — advarsel

Fly.io's GPU-support er **deprecated og lukker 1. august 2026**. Undgå Fly.io til GPU-workloads. Fly.io er fortsat et godt valg til selve Next.js gateway-appen (CPU), men ikke til Ollama.

---

## Rekommandation for Phase 1–3

Arkitekturen vi bygger (Haiku som primær, Gemma som fallback) er den rigtige tilgang:

1. **Normalt flow**: Haiku til alt. Koster ~$2/md ved 10.000 kald.
2. **Fallback**: Gemma på en on-demand GPU (RunPod L40S, ~$0,79/time), kun aktiv under Anthropic-outages.
3. **Billige tasks** (alt-text, slug): Kan gå til Gemma altid — men kræver at en GPU allerede er oppe. Besparelsen er marginal ved lav volumen.

Den store fordel ved self-hosted er **ikke pris ved vores nuværende volumen** — det er **uafhængighed og latency-garanti**.

---

## Kilder

- [Anthropic Haiku 3.5 pricing — platform.claude.com](https://platform.claude.com/docs/en/about-claude/pricing)
- [RunPod GPU pricing](https://www.runpod.io/gpu-pricing)
- [Vast.ai A100 pricing](https://vast.ai/pricing/gpu/A100-PCIE)
- [Lambda Labs pricing](https://lambda.ai/pricing)
- [Fly.io GPU pricing](https://fly.io/docs/about/pricing/) *(deprecated aug. 2026)*
- [Scaleway GPU instances](https://www.scaleway.com/en/pricing/gpu/)
