/* Blog engine. Publishing a post = adding `content/blog/<slug>.md` (front matter + Markdown) and
   deploying. Posts with `draft: true` are hidden in production but visible in `npm run dev`. */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const DIR = path.join(process.cwd(), 'content', 'blog');

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;          // ISO yyyy-mm-dd
  author: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
}
export interface Post extends PostMeta { html: string }

const showDrafts = process.env.NODE_ENV !== 'production';

function read(slug: string): Post | null {
  const file = path.join(DIR, slug + '.md');
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: String(data.date ?? '1970-01-01').slice(0, 10),
    author: String(data.author ?? 'Wi-Fi Calling & Texting Team'),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: data.draft === true,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    html: marked.parse(content, { async: false, gfm: true }) as string,
  };
}

/** All published posts, newest first. */
export function getPosts(): PostMeta[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => read(f.replace(/\.md$/, '')))
    .filter((p): p is Post => !!p && (showDrafts || !p.draft))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ html: _html, ...meta }) => meta); // eslint-disable-line @typescript-eslint/no-unused-vars
}

export function getPost(slug: string): Post | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const p = read(slug);
  return p && (showDrafts || !p.draft) ? p : null;
}

export const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
