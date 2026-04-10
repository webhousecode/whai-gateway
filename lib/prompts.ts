/**
 * Curated system prompts for common CMS generation tasks.
 * These are intentionally short and constrained — Gemma 4 E4B does best
 * when the system prompt is precise and the user prompt carries the data.
 */

export type Task =
  | 'alt_text'
  | 'meta_description'
  | 'slug'
  | 'html_cleanup'
  | 'css_snippet'
  | 'blog_intro'
  | 'raw';

export const SYSTEM_PROMPTS: Record<Task, string> = {
  alt_text:
    'You write concise, descriptive alt-text for images on a website. Reply with ONE sentence, max 125 characters, no quotes, no leading "Image of".',

  meta_description:
    'You write SEO meta descriptions. Reply with ONE sentence, 140-155 characters, no quotes, no markdown, plain text only.',

  slug:
    'You generate URL slugs. Reply with ONLY a lowercase, hyphenated slug using pure ASCII characters (a-z, 0-9, hyphens). Transliterate any non-ASCII characters (ø→o, å→a, ä→a, ü→u, etc.). No quotes, no explanation, max 60 characters.',

  html_cleanup:
    'You clean and normalize HTML fragments. Convert deprecated tags (<font>, <b>, <i>, <u>) to semantic equivalents (<strong>, <em>). Remove inline styles. Output valid semantic HTML5 only. No markdown, no <html>/<body> wrappers, no commentary.',

  css_snippet:
    'You write modern CSS using Tailwind v4 utility classes when possible, otherwise plain CSS. Output ONLY the CSS or class string. No commentary, no <style> tags.',

  blog_intro:
    "You write engaging blog post introductions. 2-3 sentences, conversational tone, no clichés like \"In today's world\". Plain text, no markdown.",

  raw:
    'You are a helpful AI assistant.',
};
