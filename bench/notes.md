# Benchmark notes — whai-gateway Phase 1

Machine: Ubuntu, Intel HD Graphics 520 (CPU-only — no NVIDIA GPU found despite handover expectation)
Model: gemma4:e4b via Ollama 0.20.5
Date: 2026-04-10

## Latency summary

- **avg: 17 235 ms**
- **p95: 26 410 ms**
- 12/12 requests ok (0 failures)

All numbers are CPU-only. GPU would likely be 10–20x faster.

## Quality assessment per task type

### alt_text ✅ Strong
Both outputs are concise, descriptive, and well within 125 chars. No "Image of" prefix. Follows spec correctly.
- "Red mountain bike rests against a weathered brick wall in warm late afternoon li[ght]."
- "Silver MacBook Pro M1 and black coffee mug arranged on a clean white desk."

### meta_description ✅ Good
Output length is reasonable and captures the topic. Could be closer to 155 chars (outputs are slightly short) but usable.
- "Accelerate development 3x with WebHouse's AI-native workflows, planning docs, an[d Claude Code...]"
- "Compare self-hosted Gemma 4 vs. Claude for CMS tasks like alt-text and meta desc[riptions...]"

### slug ⚠️ Mostly good, one issue
ASCII-only slug works for English titles. Danish title ("WebHouse fejrer 30 år") preserves "første" → `første` (non-ASCII). Spec says "ASCII slug" — this is a quality gap to watch.
- `how-we-cut-our-llm-bill-by-60-with-local-gemma-4-fallback` ✅
- `webhouse-fejrer-30-aar-som-danmarks-første-webbureau` ⚠️ non-ASCII 'ø'

### html_cleanup ⚠️ Mixed
First case (simple `<P>` normalization) is clean and correct.
Second case (legacy `<font color=red>` + inline style) partially sanitized but kept `style="color: red;"` in output instead of using `<strong>` or `<em>`. Not fully semantic.
- `<p>hello world<br><strong>important</strong><br>line</p>` ✅
- `<p style="color: red;">Warning:</p>…` ⚠️ inline style kept, not semantic

### css_snippet ✅ Strong
Both outputs are clean Tailwind v4 utility class strings with no commentary. Hover state correctly handled.
- `max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6` ✅
- `bg-[#3D97D3] text-white py-[12px] px-[24px] rounded-md hover:bg-[#2e7aae]` ✅

### blog_intro ✅ Good
Both intros are conversational, 2-3 sentences, no clichés. The "Ever had…" opener is slightly formulaic but acceptable. No markdown, plain text.
- "Ever had your whole system crash because a major service went down?…" ✅
- "Ever wondered what it's like to get a big language model running smoothly…" ✅ (same opener pattern)

### raw
Not included in bench prompts — basic passthrough, works fine in smoke test.

## Areas to improve

1. **slug**: Add a post-processing step (transliterate non-ASCII before sending, or strip in code) — model doesn't reliably produce pure ASCII for non-English input.
2. **html_cleanup**: Tighten system prompt to explicitly say "convert deprecated `<font>` tags and inline style to semantic HTML5 elements" — model hedges.
3. **blog_intro**: Two prompts both got "Ever had…" opener — consider injecting a seed sentence constraint to vary tone.

## GPU / hardware notes

- Expected NVIDIA GPU per handover prompt — none found on this machine.
- Intel HD Graphics 520 (integrated, no CUDA).
- Ollama running on CPU only — 17s avg vs expected ~1-2s on GPU.
- `nvidia-smi` not present.
