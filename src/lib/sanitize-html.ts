/**
 * Sanitize HTML for email templates.
 * Strips script tags, iframes, event handlers, and other dangerous content.
 * Allows safe HTML tags used in emails (p, br, a, strong, em, ul, ol, li, h1-h6, etc.)
 */
export function sanitizeEmailHtml(html: string): string {
  let clean = html;

  // Remove script tags and their content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove iframe, object, embed, form, input tags
  clean = clean.replace(/<\/?(?:iframe|object|embed|form|input|textarea|select|button)\b[^>]*>/gi, "");

  // Remove event handlers (onclick, onload, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src=""');

  // Remove data: URLs (except data:image for inline images)
  clean = clean.replace(/(?:href|src)\s*=\s*"data:(?!image\/)[^"]*"/gi, 'href="#"');

  // Remove style attributes that could contain expressions
  clean = clean.replace(/style\s*=\s*"[^"]*expression\s*\([^"]*"/gi, "");
  clean = clean.replace(/style\s*=\s*"[^"]*javascript:[^"]*"/gi, "");

  // Remove base tags
  clean = clean.replace(/<base\b[^>]*>/gi, "");

  // Remove meta tags (except charset)
  clean = clean.replace(/<meta\b(?![^>]*charset)[^>]*>/gi, "");

  return clean.trim();
}
