/**
 * Enhanced Markdown to HTML Converter
 * Converts Markdown to WordPress-compatible HTML
 */

export class MarkdownConverter {
    /**
     * Convert Markdown to HTML with advanced features
     */
    static toHTML(markdown: string): string {
        let html = markdown;

        // Code blocks (must be before inline code)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            return `<pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // Headers (h1-h6)
        html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        html = html.replace(/^\*\*\*$/gim, '<hr>');

        // Blockquotes
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Unordered lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Ordered lists
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

        // Bold and italic (must be before single asterisk)
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks and paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Wrap in paragraph tags
        html = `<p>${html}</p>`;

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');

        return html;
    }

    /**
     * Escape HTML special characters
     */
    private static escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Extract title from Markdown content
     */
    static extractTitle(markdown: string): string | null {
        const match = markdown.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract excerpt from Markdown content
     */
    static extractExcerpt(markdown: string, maxLength: number = 200): string {
        // Remove headers
        let text = markdown.replace(/^#+\s+.+$/gm, '');

        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, '');

        // Remove inline code
        text = text.replace(/`[^`]+`/g, '');

        // Remove links but keep text
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        // Remove images
        text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

        // Remove formatting
        text = text.replace(/[*_~`]/g, '');

        // Clean up whitespace
        text = text.trim().replace(/\s+/g, ' ');

        // Truncate
        if (text.length > maxLength) {
            text = text.substring(0, maxLength).trim() + '...';
        }

        return text;
    }

    /**
     * Extract tags from Markdown content
     */
    static extractTags(markdown: string): string[] {
        const tags: string[] = [];

        // Look for tags in format: Tags: tag1, tag2, tag3
        const tagMatch = markdown.match(/^Tags?:\s*(.+)$/im);
        if (tagMatch) {
            const tagList = tagMatch[1].split(',').map(t => t.trim());
            tags.push(...tagList);
        }

        // Look for hashtags
        const hashtagMatches = markdown.match(/#(\w+)/g);
        if (hashtagMatches) {
            const hashtags = hashtagMatches.map(t => t.substring(1));
            tags.push(...hashtags);
        }

        // Remove duplicates
        return [...new Set(tags)];
    }

    /**
     * Extract categories from Markdown content
     */
    static extractCategories(markdown: string): string[] {
        const categories: string[] = [];

        // Look for categories in format: Categories: cat1, cat2
        const catMatch = markdown.match(/^Categor(?:y|ies):\s*(.+)$/im);
        if (catMatch) {
            const catList = catMatch[1].split(',').map(c => c.trim());
            categories.push(...catList);
        }

        return categories;
    }
}
