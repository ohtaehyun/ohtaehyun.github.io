import { site } from '../data/site';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap-index.xml\n`);
}
