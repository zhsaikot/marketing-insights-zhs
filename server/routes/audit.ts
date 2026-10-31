import { Router, Request, Response } from 'express';
import * as cheerio from 'cheerio';

const router = Router();

export interface SeoFault {
  id: string;
  category: 'meta' | 'headings' | 'images' | 'indexability' | 'security' | 'social' | 'links' | 'performance';
  severity: 'critical' | 'warning' | 'passed';
  title: string;
  description: string;
  recommendation: string;
  details?: string[] | Record<string, any>;
}

export interface DetectedTech {
  name: string;
  category: 'analytics' | 'tag_manager' | 'advertising' | 'cms' | 'frontend' | 'security';
  id?: string;
  icon?: string;
  details?: string;
}

export interface WebsiteAuditReport {
  url: string;
  finalUrl: string;
  hostname: string;
  auditTime: string;
  fetchTimeMs: number;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summary: {
    criticalCount: number;
    warningCount: number;
    passedCount: number;
    totalChecks: number;
  };
  overview: {
    title: string;
    description: string;
    h1: string;
    wordCount: number;
    imageCount: number;
    imagesMissingAlt: number;
    internalLinksCount: number;
    externalLinksCount: number;
    hasSsl: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    canonicalUrl: string | null;
    robotsMeta: string | null;
  };
  socialPreview: {
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    ogUrl: string | null;
    twitterCard: string | null;
    twitterImage: string | null;
  };
  techStack: DetectedTech[];
  schemaTypes: string[];
  faults: SeoFault[];
  estimatedMetrics: {
    visibilityScore: number;
    estimatedMonthlyVisits: string;
    potentialKeywordReach: string;
    onPageSeoHealth: string;
  };
}

export function getRuleGroup(faultId: string): string {
  if (faultId.startsWith('title-')) return 'title';
  if (faultId.startsWith('desc-')) return 'description';
  if (faultId.startsWith('h1-')) return 'h1';
  if (faultId.startsWith('images-')) return 'images';
  if (faultId.startsWith('robots-file-')) return 'robots-file';
  if (faultId.startsWith('robots-')) return 'robots';
  if (faultId.startsWith('canonical-')) return 'canonical';
  if (faultId.startsWith('viewport-')) return 'viewport';
  if (faultId.startsWith('social-')) return 'social';
  if (faultId.startsWith('schema-')) return 'schema';
  if (faultId.startsWith('sitemap-')) return 'sitemap';
  if (faultId.startsWith('security-')) return 'security';
  if (faultId.startsWith('content-')) return 'content';
  return faultId;
}

export function findFaultByRuleGroup(faults: SeoFault[], group: string): SeoFault | undefined {
  return faults.find((f) => getRuleGroup(f.id) === group);
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return 'https://example.com';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

async function probeUrlStatus(url: string, timeoutMs: number = 4000): Promise<{ reachable: boolean; status: number; textSnippet?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MarketingInsightsAuditBot/1.0 (+https://marketing-insights.local)',
        'Cache-Control': 'no-cache, no-store',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const snippet = res.ok ? (await res.text()).slice(0, 300) : undefined;
    return { reachable: res.ok, status: res.status, textSnippet: snippet };
  } catch {
    return { reachable: false, status: 0 };
  }
}

export async function performDeepAudit(cleanUrl: string): Promise<WebsiteAuditReport> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  const startTime = Date.now();
  let html = '';
  let finalUrl = cleanUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const fetchResponse = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 MarketingInsightsBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    finalUrl = fetchResponse.url;

    if (!fetchResponse.ok) {
      throw new Error(`Could not fetch website (${fetchResponse.status} ${fetchResponse.statusText})`);
    }

    html = await fetchResponse.text();
  } catch (err: any) {
    console.error('[SiteAudit] Fetch failed:', err);
    throw new Error(`Failed to connect to ${cleanUrl}: ${err.message || 'Connection timeout or network error'}`);
  }

  const fetchTimeMs = Date.now() - startTime;
  const $ = cheerio.load(html);

  // Parallel probe for robots.txt and sitemap.xml
  const origin = parsedUrl.origin;
  const [robotsProbe, sitemapProbe] = await Promise.all([
    probeUrlStatus(`${origin}/robots.txt`),
    probeUrlStatus(`${origin}/sitemap.xml`),
  ]);

  // Extraction
  const title = $('title').first().text().trim();
  const metaDescription =
    $('meta[name="description" i]').attr('content')?.trim() ||
    $('meta[property="og:description" i]').attr('content')?.trim() ||
    '';
  const metaRobots = $('meta[name="robots" i]').attr('content')?.trim() || null;
  const canonicalUrl = $('link[rel="canonical" i]').attr('href')?.trim() || null;
  const metaViewport = $('meta[name="viewport" i]').attr('content')?.trim() || null;

  // Headings
  const h1Elements = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // Images
  const allImages = $('img');
  const imageCount = allImages.length;
  const imagesWithoutAlt: string[] = [];
  allImages.each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (typeof alt !== 'string' || alt.trim() === '') {
      if (src && !imagesWithoutAlt.includes(src) && imagesWithoutAlt.length < 10) {
        imagesWithoutAlt.push(src);
      }
    }
  });
  const imagesMissingAltCount = allImages.filter((_, el) => {
    const alt = $(el).attr('alt');
    return typeof alt !== 'string' || alt.trim() === '';
  }).length;

  // Links
  const links = $('a[href]');
  let internalLinksCount = 0;
  let externalLinksCount = 0;
  links.each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    try {
      const resolved = new URL(href, finalUrl);
      if (resolved.hostname === parsedUrl.hostname) {
        internalLinksCount++;
      } else {
        externalLinksCount++;
      }
    } catch {
      internalLinksCount++;
    }
  });

  // Word count (strip scripts, styles, noscript)
  $('script, style, noscript, svg, nav, footer').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  // Social Open Graph & Twitter Cards
  const ogTitle = $('meta[property="og:title" i]').attr('content')?.trim() || null;
  const ogDescription = $('meta[property="og:description" i]').attr('content')?.trim() || null;
  const ogImage = $('meta[property="og:image" i]').attr('content')?.trim() || null;
  const ogUrl = $('meta[property="og:url" i]').attr('content')?.trim() || null;
  const twitterCard = $('meta[name="twitter:card" i]').attr('content')?.trim() || null;
  const twitterImage = $('meta[name="twitter:image" i]').attr('content')?.trim() || null;

  // Structured Data (JSON-LD)
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html()?.trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed['@type']) {
          schemaTypes.push(Array.isArray(parsed['@type']) ? parsed['@type'].join(', ') : parsed['@type']);
        } else if (Array.isArray(parsed['@graph'])) {
          parsed['@graph'].forEach((item: any) => {
            if (item['@type']) schemaTypes.push(item['@type']);
          });
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  // Tech Stack & Tag Sniffer
  const techStack: DetectedTech[] = [];

  const ga4Match = html.match(/\b(G-[A-Z0-9]{8,12})\b/);
  if (ga4Match) {
    techStack.push({
      name: 'Google Analytics 4',
      category: 'analytics',
      id: ga4Match[1],
      details: `Active Tracking Measurement ID: ${ga4Match[1]}`,
    });
  }

  const gtmMatch = html.match(/\b(GTM-[A-Z0-9]{5,10})\b/);
  if (gtmMatch) {
    techStack.push({
      name: 'Google Tag Manager',
      category: 'tag_manager',
      id: gtmMatch[1],
      details: `Container ID: ${gtmMatch[1]}`,
    });
  }

  const pixelMatch = html.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]([0-9]{12,18})['"]/i) || html.match(/connect\.facebook\.net/);
  if (pixelMatch) {
    const pixelId = pixelMatch[1] || 'Detected in Scripts';
    techStack.push({
      name: 'Meta (Facebook) Pixel',
      category: 'advertising',
      id: pixelId,
      details: `Pixel Active (${pixelId})`,
    });
  }

  if (html.includes('wp-content') || html.includes('wp-includes') || /<meta[^>]*name=["']generator["'][^>]*content=["'][^"']*WordPress/i.test(html)) {
    techStack.push({
      name: 'WordPress CMS',
      category: 'cms',
      details: 'Powers blogging & content management',
    });
  } else if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) {
    techStack.push({
      name: 'Shopify Store',
      category: 'cms',
      details: 'E-commerce platform detected',
    });
  } else if (html.includes('__NEXT_DATA__') || html.includes('/_next/static')) {
    techStack.push({
      name: 'Next.js (React)',
      category: 'frontend',
      details: 'Server-side rendered modern React app',
    });
  } else if (html.includes('webflow.js') || html.includes('data-wf-page')) {
    techStack.push({
      name: 'Webflow',
      category: 'cms',
      details: 'No-code visual CMS platform',
    });
  }

  const hasSsl = finalUrl.startsWith('https://');
  if (hasSsl) {
    techStack.push({
      name: 'SSL / TLS Encryption',
      category: 'security',
      details: 'Secure HTTPS protocol active',
    });
  }

  // Faults Analysis Engine
  const faults: SeoFault[] = [];

  // 1. Title Tag
  if (!title) {
    faults.push({
      id: 'title-missing',
      category: 'meta',
      severity: 'critical',
      title: 'Title Tag is Missing',
      description: 'The webpage has no <title> tag. Search engines cannot properly index or display your page in search results.',
      recommendation: 'Add a descriptive and keyword-rich <title> tag between 40-60 characters.',
    });
  } else if (title.length < 30) {
    faults.push({
      id: 'title-short',
      category: 'meta',
      severity: 'warning',
      title: 'Title Tag is Too Short',
      description: `Your title is only ${title.length} characters long ("${title}"). Short titles miss out on valuable ranking opportunities.`,
      recommendation: 'Expand the title to between 40-60 characters including your primary keyword and brand name.',
    });
  } else if (title.length > 65) {
    faults.push({
      id: 'title-long',
      category: 'meta',
      severity: 'warning',
      title: 'Title Tag is Too Long',
      description: `Your title is ${title.length} characters long. Google typically truncates titles longer than 60 characters in SERP results with "..."`,
      recommendation: 'Shorten your title to under 60 characters to ensure it displays completely on desktop and mobile.',
    });
  } else {
    faults.push({
      id: 'title-optimal',
      category: 'meta',
      severity: 'passed',
      title: 'Title Tag is Well Optimized',
      description: `Title length (${title.length} chars) is within the ideal 30-65 character range: "${title}"`,
      recommendation: 'Maintain this length and ensure target keywords remain prominent.',
    });
  }

  // 2. Meta Description
  if (!metaDescription) {
    faults.push({
      id: 'desc-missing',
      category: 'meta',
      severity: 'critical',
      title: 'Meta Description is Missing',
      description: 'The page lacks a meta description tag. Google will generate arbitrary snippets that may lower your organic click-through rate (CTR).',
      recommendation: 'Add a compelling meta description between 120-160 characters with a clear call-to-action.',
    });
  } else if (metaDescription.length < 70) {
    faults.push({
      id: 'desc-short',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description is Too Short',
      description: `Your meta description is only ${metaDescription.length} characters. You are underutilizing valuable search preview space.`,
      recommendation: 'Aim for 120-160 characters describing the page value and enticing user clicks.',
    });
  } else if (metaDescription.length > 165) {
    faults.push({
      id: 'desc-long',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description May Be Truncated',
      description: `Meta description is ${metaDescription.length} characters. Google typically truncates descriptions after 155-160 characters.`,
      recommendation: 'Trim description to under 160 characters so the full message is visible in search results.',
    });
  } else {
    faults.push({
      id: 'desc-optimal',
      category: 'meta',
      severity: 'passed',
      title: 'Meta Description is Optimal',
      description: `Meta description length (${metaDescription.length} chars) is in the sweet spot (70-165 chars).`,
      recommendation: 'Keep descriptions engaging and aligned with user search intent.',
    });
  }

  // 3. H1 Heading Hierarchy
  if (h1Elements.length === 0) {
    faults.push({
      id: 'h1-missing',
      category: 'headings',
      severity: 'critical',
      title: 'Missing H1 Heading',
      description: 'The page has no <h1> tag. Search engine crawlers rely heavily on the primary H1 to determine the main subject of your page.',
      recommendation: 'Add exactly one clean <h1> heading near the top of the page representing the core topic.',
    });
  } else if (h1Elements.length > 1) {
    faults.push({
      id: 'h1-multiple',
      category: 'headings',
      severity: 'warning',
      title: `Multiple H1 Tags Detected (${h1Elements.length} Found)`,
      description: `Found ${h1Elements.length} <h1> tags on the page. Multiple H1 tags can dilute page focus and confuse crawlers.`,
      recommendation: 'Use only one <h1> for the main page title, and downgrade secondary sections to <h2> and <h3> tags.',
      details: h1Elements,
    });
  } else {
    faults.push({
      id: 'h1-optimal',
      category: 'headings',
      severity: 'passed',
      title: 'Single Focused H1 Tag Found',
      description: `Page has exactly one clear <h1>: "${h1Elements[0]}"`,
      recommendation: 'Ensure your H1 aligns closely with your page title and user search intent.',
    });
  }

  // 4. Images & Alt Attributes
  if (imageCount === 0) {
    faults.push({
      id: 'images-none',
      category: 'images',
      severity: 'warning',
      title: 'No Images Found on Page',
      description: 'The page contains no visual image elements. Visual content enhances user engagement and time on page.',
      recommendation: 'Incorporate relevant, compressed imagery or infographics to enrich content quality.',
    });
  } else if (imagesMissingAltCount > 0) {
    const isCritical = imagesMissingAltCount >= 5 || imagesMissingAltCount / imageCount > 0.3;
    faults.push({
      id: 'images-missing-alt',
      category: 'images',
      severity: isCritical ? 'critical' : 'warning',
      title: `${imagesMissingAltCount} of ${imageCount} Images Lack ALT Text`,
      description: `${imagesMissingAltCount} image(s) have empty or missing alt attributes. This damages accessibility (screen readers) and hurts Google Image Search rankings.`,
      recommendation: 'Add descriptive alt text to every non-decorative image explaining what is shown.',
      details: imagesWithoutAlt,
    });
  } else {
    faults.push({
      id: 'images-alt-passed',
      category: 'images',
      severity: 'passed',
      title: 'All Images Have ALT Attributes',
      description: `All ${imageCount} images on the page have alt attributes defined. Excellent accessibility and image SEO.`,
      recommendation: 'Ensure alt descriptions remain succinct and descriptive without keyword stuffing.',
    });
  }

  // 5. Indexability & Meta Robots
  if (metaRobots && (metaRobots.toLowerCase().includes('noindex') || metaRobots.toLowerCase().includes('none'))) {
    faults.push({
      id: 'robots-noindex',
      category: 'indexability',
      severity: 'critical',
      title: 'Critical: "noindex" Meta Tag Detected!',
      description: `The page contains '<meta name="robots" content="${metaRobots}">'. This explicitly forbids Google and Bing from indexing this page in organic search!`,
      recommendation: 'If this is a public live website, immediately remove "noindex" from your HTML header.',
    });
  } else {
    faults.push({
      id: 'robots-indexable',
      category: 'indexability',
      severity: 'passed',
      title: 'Page is Freely Indexable by Search Engines',
      description: 'No blocking "noindex" or "none" robots directives were detected. Search crawlers are allowed to index this URL.',
      recommendation: 'Keep robots meta instructions permissive for public landing pages.',
    });
  }

  // 6. Canonical URL
  if (!canonicalUrl) {
    faults.push({
      id: 'canonical-missing',
      category: 'indexability',
      severity: 'warning',
      title: 'Missing Canonical Link Tag',
      description: 'No rel="canonical" link found. Without a canonical URL, search engines may treat URL parameters or duplicate versions as competing content.',
      recommendation: `Add '<link rel="canonical" href="${finalUrl}" />' to specify the preferred authoritative URL.`,
    });
  } else {
    faults.push({
      id: 'canonical-present',
      category: 'indexability',
      severity: 'passed',
      title: 'Canonical URL Configured',
      description: `Canonical tag specifies: ${canonicalUrl}`,
      recommendation: 'Ensure canonical always points to the exact canonical HTTPS protocol and trailing slash structure.',
    });
  }

  // 7. Mobile Viewport
  if (!metaViewport) {
    faults.push({
      id: 'viewport-missing',
      category: 'indexability',
      severity: 'critical',
      title: 'Missing Mobile Viewport Tag',
      description: 'No <meta name="viewport"> tag detected. The website will fail Google Mobile-Friendly requirements and rank poorly on smartphones.',
      recommendation: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to the <head>.',
    });
  } else {
    faults.push({
      id: 'viewport-passed',
      category: 'indexability',
      severity: 'passed',
      title: 'Mobile Responsive Viewport Active',
      description: `Viewport tag configured: "${metaViewport}"`,
      recommendation: 'Ensure mobile tap targets and font sizes remain comfortable on handheld screens.',
    });
  }

  // 8. Open Graph & Social Sharing
  if (!ogTitle || !ogImage) {
    faults.push({
      id: 'social-og-incomplete',
      category: 'social',
      severity: 'warning',
      title: 'Incomplete Open Graph (Social Sharing) Tags',
      description: `Missing crucial social preview tags: ${[!ogTitle && 'og:title', !ogImage && 'og:image'].filter(Boolean).join(', ')}. Shared links on Facebook, LinkedIn, and WhatsApp will show blank cards.`,
      recommendation: 'Implement standard og:title, og:description, and high-resolution og:image (1200x630px).',
    });
  } else {
    faults.push({
      id: 'social-og-passed',
      category: 'social',
      severity: 'passed',
      title: 'Social Open Graph Tags Configured',
      description: `Found og:title ("${ogTitle}") and social share image preview.`,
      recommendation: 'Ensure share image is at least 1200x630px for high-DPI displays.',
    });
  }

  // 9. Structured Data (Schema.org)
  if (schemaTypes.length === 0) {
    faults.push({
      id: 'schema-missing',
      category: 'meta',
      severity: 'warning',
      title: 'No Structured Schema (JSON-LD) Found',
      description: 'No JSON-LD structured data detected. Schema helps search engines generate rich snippets (star ratings, site links, FAQs, organization details).',
      recommendation: 'Add Organization, WebSite, or BreadcrumbList Schema.org JSON-LD scripts to stand out in SERPs.',
    });
  } else {
    faults.push({
      id: 'schema-passed',
      category: 'meta',
      severity: 'passed',
      title: `Structured Schema Active (${schemaTypes.slice(0, 3).join(', ')})`,
      description: `Found ${schemaTypes.length} schema type definitions, enabling enhanced Google Rich Snippets.`,
      recommendation: 'Verify schema syntax regularly using Google Rich Results Test tool.',
    });
  }

  // 10. Robots.txt & Sitemap.xml
  if (!robotsProbe.reachable) {
    faults.push({
      id: 'robots-file-missing',
      category: 'indexability',
      severity: 'warning',
      title: 'robots.txt File is Not Reachable',
      description: `Probed ${origin}/robots.txt but received status ${robotsProbe.status || 'Unreachable'}. Having a clear robots.txt guides search bot crawl budgets.`,
      recommendation: 'Deploy a valid robots.txt file at the root of your domain specifying crawl rules and sitemap location.',
    });
  } else {
    faults.push({
      id: 'robots-file-passed',
      category: 'indexability',
      severity: 'passed',
      title: 'robots.txt File Found and Accessible',
      description: `Successfully probed ${origin}/robots.txt (HTTP ${robotsProbe.status}).`,
      recommendation: 'Ensure disallow directives do not accidentally block important CSS, JS, or image assets.',
    });
  }

  if (!sitemapProbe.reachable) {
    faults.push({
      id: 'sitemap-missing',
      category: 'indexability',
      severity: 'warning',
      title: 'XML Sitemap Not Found at Standard Root',
      description: `Could not reach ${origin}/sitemap.xml (HTTP ${sitemapProbe.status || 'Not Found'}). Sitemaps help search engines discover newly published pages faster.`,
      recommendation: 'Generate an XML sitemap and reference its full URL in your robots.txt file.',
    });
  } else {
    faults.push({
      id: 'sitemap-passed',
      category: 'indexability',
      severity: 'passed',
      title: 'XML Sitemap Reachable at /sitemap.xml',
      description: `Successfully probed sitemap at ${origin}/sitemap.xml.`,
      recommendation: 'Keep sitemap automatically synced with your CMS whenever new content is published.',
    });
  }

  // 11. Security & HTTPS
  if (!hasSsl) {
    faults.push({
      id: 'security-no-ssl',
      category: 'security',
      severity: 'critical',
      title: 'Website Not Using Secure HTTPS',
      description: 'The website loads over insecure HTTP protocol. Browsers flag this as "Not Secure" and Google imposes a direct ranking penalty.',
      recommendation: 'Install an SSL certificate (e.g. free via Let\'s Encrypt or Cloudflare) and enforce 301 HTTPS redirects.',
    });
  } else {
    faults.push({
      id: 'security-ssl-passed',
      category: 'security',
      severity: 'passed',
      title: 'Secure HTTPS Encryption Active',
      description: 'The site transmits data over an encrypted SSL/TLS tunnel.',
      recommendation: 'Ensure all sub-resources (images, scripts, styles) load over HTTPS to avoid mixed content warnings.',
    });
  }

  // 12. Content Word Count
  if (wordCount < 250) {
    faults.push({
      id: 'content-thin',
      category: 'meta',
      severity: 'warning',
      title: 'Thin Content Detected',
      description: `Page text has approximately ${wordCount} words. Pages with very little text struggle to rank for competitive search queries.`,
      recommendation: 'Expand content depth with helpful explanations, FAQs, and topic coverage.',
    });
  } else {
    faults.push({
      id: 'content-length-passed',
      category: 'meta',
      severity: 'passed',
      title: `Substantial Content Length (${wordCount} words)`,
      description: `Found approximately ${wordCount} words of text on the page.`,
      recommendation: 'Break long copy with scannable subheadings, bullet points, and callout boxes.',
    });
  }

  // Calculate Overall Score & Grade
  const criticalCount = faults.filter((f) => f.severity === 'critical').length;
  const warningCount = faults.filter((f) => f.severity === 'warning').length;
  const passedCount = faults.filter((f) => f.severity === 'passed').length;
  const totalChecks = faults.length;

  let calculatedScore = 100 - criticalCount * 14 - warningCount * 4;
  calculatedScore = Math.max(15, Math.min(100, calculatedScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
  if (calculatedScore >= 95) grade = 'A+';
  else if (calculatedScore >= 85) grade = 'A';
  else if (calculatedScore >= 75) grade = 'B';
  else if (calculatedScore >= 65) grade = 'C';
  else if (calculatedScore >= 50) grade = 'D';
  else grade = 'F';

  // Estimated Traffic & Visibility Benchmarks
  const visibilityScore = Math.round((calculatedScore * 0.7) + (hasSsl ? 15 : 0) + (ga4Match ? 15 : 0));
  const estimatedVisits = Math.round((calculatedScore / 100) * (wordCount > 500 ? 18500 : 7500) + (internalLinksCount * 45));
  const potentialReach = Math.round((calculatedScore * 12) + (internalLinksCount * 8));

  return {
    url: cleanUrl,
    finalUrl,
    hostname: parsedUrl.hostname,
    auditTime: new Date().toISOString(),
    fetchTimeMs,
    overallScore: calculatedScore,
    grade,
    summary: {
      criticalCount,
      warningCount,
      passedCount,
      totalChecks,
    },
    overview: {
      title,
      description: metaDescription,
      h1: h1Elements[0] || '',
      wordCount,
      imageCount,
      imagesMissingAlt: imagesMissingAltCount,
      internalLinksCount,
      externalLinksCount,
      hasSsl,
      hasRobotsTxt: robotsProbe.reachable,
      hasSitemap: sitemapProbe.reachable,
      canonicalUrl,
      robotsMeta: metaRobots,
    },
    socialPreview: {
      ogTitle,
      ogDescription,
      ogImage,
      ogUrl,
      twitterCard,
      twitterImage,
    },
    techStack,
    schemaTypes: Array.from(new Set(schemaTypes)),
    faults,
    estimatedMetrics: {
      visibilityScore: Math.min(100, visibilityScore),
      estimatedMonthlyVisits: estimatedVisits.toLocaleString(),
      potentialKeywordReach: `${potentialReach.toLocaleString()} Keywords`,
      onPageSeoHealth: `${calculatedScore}% Optimized`,
    },
  };
}

// GET /api/audit/website?url=...
router.get('/website', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url query parameter' });
  }

  const cleanUrl = normalizeUrl(targetUrl);
  try {
    const report = await performDeepAudit(cleanUrl);
    return res.json(report);
  } catch (err: any) {
    console.error('[SiteAudit] Execution failed:', err);
    return res.status(502).json({ error: err.message || 'Audit failed' });
  }
});

// POST /api/audit/recheck-item
router.post('/recheck-item', async (req: Request, res: Response) => {
  const { url, faultId } = req.body;
  if (!url || !faultId) {
    return res.status(400).json({ error: 'Missing url or faultId in request body' });
  }

  const cleanUrl = normalizeUrl(url);
  try {
    const freshReport = await performDeepAudit(cleanUrl);
    const group = getRuleGroup(faultId);
    const updatedFault = findFaultByRuleGroup(freshReport.faults, group) || freshReport.faults.find((f) => f.id === faultId);
    
    const isResolved = updatedFault ? updatedFault.severity === 'passed' : false;

    return res.json({
      faultId,
      ruleGroup: group,
      resolved: isResolved,
      currentSeverity: updatedFault?.severity || 'passed',
      updatedFault,
      updatedReport: freshReport,
    });
  } catch (err: any) {
    console.error('[SiteAudit] Re-check failed:', err);
    return res.status(502).json({ error: err.message || 'Re-check failed' });
  }
});

export default router;
