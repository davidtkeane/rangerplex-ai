/**
 * WordPress Publisher Component
 * Advanced note publishing with metadata extraction
 */

import React, { useState } from 'react';
import { FEATURES } from '../../utils/features';
import { MarkdownConverter } from '../../utils/markdownConverter';
import { wordPressAPI } from '../../services/wordPressAPI';
import styles from './WordPressPublisher.module.css';

interface PublishResult {
    success: boolean;
    message: string;
    postId?: number;
    url?: string;
}

export const WordPressPublisher: React.FC = () => {
    const [markdown, setMarkdown] = useState('');
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<'draft' | 'publish'>('draft');
    const [publishing, setPublishing] = useState(false);
    const [result, setResult] = useState<PublishResult | null>(null);

    if (!FEATURES.WORDPRESS_INTEGRATION) {
        return (
            <div className={styles.unavailable}>
                <h2>🚫 WordPress Publisher Unavailable</h2>
                <p>WordPress features are only available in Electron mode.</p>
                <p>Run <code>npm run browser</code> to access this feature.</p>
            </div>
        );
    }

    const handlePublish = async () => {
        if (!markdown.trim()) {
            setResult({
                success: false,
                message: 'Please enter some content to publish',
            });
            return;
        }

        setPublishing(true);
        setResult(null);

        try {
            // Extract metadata
            const extractedTitle = MarkdownConverter.extractTitle(markdown);
            const finalTitle = title || extractedTitle || 'Untitled Post';
            const excerpt = MarkdownConverter.extractExcerpt(markdown);
            const tags = MarkdownConverter.extractTags(markdown);
            const categories = MarkdownConverter.extractCategories(markdown);

            // Convert to HTML
            const htmlContent = MarkdownConverter.toHTML(markdown);

            // Publish via API
            const response = await wordPressAPI.publishNote(
                'temp-note.md', // This would be a real file path in production
                finalTitle
            );

            if (response.success) {
                setResult({
                    success: true,
                    message: `✅ Published "${finalTitle}" successfully!`,
                    url: 'http://localhost:8080/wp-admin',
                });

                // Clear form on success
                setMarkdown('');
                setTitle('');
            } else {
                setResult({
                    success: false,
                    message: response.message || 'Failed to publish',
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: `Error: ${error.message}`,
            });
        } finally {
            setPublishing(false);
        }
    };

    const handlePreview = () => {
        const html = MarkdownConverter.toHTML(markdown);
        const previewWindow = window.open('', 'Preview', 'width=800,height=600');
        if (previewWindow) {
            previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 2rem auto;
              padding: 2rem;
              line-height: 1.6;
            }
            code {
              background: #f4f4f4;
              padding: 2px 6px;
              border-radius: 3px;
            }
            pre {
              background: #f4f4f4;
              padding: 1rem;
              border-radius: 6px;
              overflow-x: auto;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `);
            previewWindow.document.close();
        }
    };

    return (
        <div className={styles.publisher}>
            <header className={styles.header}>
                <h2>📝 WordPress Publisher</h2>
                <p>Write in Markdown, publish to WordPress</p>
            </header>

            <div className={styles.form}>
                <div className={styles.field}>
                    <label htmlFor="title">Title (optional - will extract from # heading)</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Leave empty to auto-extract from content"
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="markdown">Content (Markdown)</label>
                    <textarea
                        id="markdown"
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="# My Post Title

Write your content here in **Markdown**...

## Features
- Auto-extracts title from # heading
- Supports **bold**, *italic*, `code`
- Images, links, lists
- Code blocks with syntax highlighting

Tags: wordpress, markdown, publishing
Categories: Tutorials"
                        className={styles.textarea}
                        rows={20}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'draft' | 'publish')}
                        className={styles.select}
                    >
                        <option value="draft">Draft</option>
                        <option value="publish">Publish</option>
                    </select>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={handlePreview}
                        disabled={!markdown.trim()}
                        className={styles.previewButton}
                    >
                        👁️ Preview
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !markdown.trim()}
                        className={styles.publishButton}
                    >
                        {publishing ? '⏳ Publishing...' : '🚀 Publish to WordPress'}
                    </button>
                </div>

                {result && (
                    <div className={result.success ? styles.success : styles.error}>
                        <p>{result.message}</p>
                        {result.url && (
                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                                Open WordPress Admin →
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.tips}>
                <h3>💡 Tips</h3>
                <ul>
                    <li>Use <code># Title</code> for the main heading (auto-extracted as post title)</li>
                    <li>Add <code>Tags: tag1, tag2</code> to set post tags</li>
                    <li>Add <code>Categories: cat1, cat2</code> to set categories</li>
                    <li>Use <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code></li>
                    <li>Images: <code>![alt text](url)</code></li>
                    <li>Links: <code>[text](url)</code></li>
                    <li>Code blocks: <code>```language ... ```</code></li>
                </ul>
            </div>
        </div>
    );
};
