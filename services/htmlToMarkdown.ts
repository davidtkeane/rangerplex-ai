import TurndownService from 'turndown';

/**
 * Converts an HTML string to Markdown.
 * Cleans up common non-content elements like scripts, styles, navs, and footers before conversion.
 */
export const convertHtmlToMarkdown = (html: string): string => {
  try {
    // Parse HTML string into a DOM document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove unwanted elements that clutter the RAG context
    const selectorToRemove = [
      'script',
      'style',
      'noscript',
      'iframe',
      'svg',
      'nav',
      'footer',
      'header',
      'aside',
      '.ad',
      '.advertisement',
      '#cookie-banner'
    ].join(',');

    const elementsToRemove = doc.querySelectorAll(selectorToRemove);
    elementsToRemove.forEach((el) => el.remove());

    // Initialize Turndown service
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Custom rule to drop images if needed, but we often want alt text. 
    // Keeping images for now as they might have relevant alt text.

    // Convert body content
    return turndownService.turndown(doc.body.innerHTML);
  } catch (error) {
    console.error("HTML to Markdown conversion failed:", error);
    return ""; // Return empty or original text on failure
  }
};