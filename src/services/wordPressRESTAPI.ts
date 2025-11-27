/**
 * WordPress REST API Service
 * Interacts with WordPress REST API for advanced operations
 */

export interface WordPressPost {
    id?: number;
    title: string;
    content: string;
    excerpt?: string;
    status: 'publish' | 'draft' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    author?: number;
}

export interface WordPressCategory {
    id: number;
    name: string;
    slug: string;
}

export interface WordPressTag {
    id: number;
    name: string;
    slug: string;
}

export class WordPressRESTAPI {
    private baseUrl: string;
    private username: string;
    private password: string;

    constructor(baseUrl: string, username: string = 'admin', password: string = 'password') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.username = username;
        this.password = password;
    }

    /**
     * Get authentication headers
     */
    private getAuthHeaders(): HeadersInit {
        const credentials = btoa(`${this.username}:${this.password}`);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
        };
    }

    /**
     * Create a new post
     */
    async createPost(post: WordPressPost): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    title: post.title,
                    content: post.content,
                    excerpt: post.excerpt,
                    status: post.status,
                    categories: post.categories,
                    tags: post.tags,
                    featured_media: post.featured_media,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create post');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Update an existing post
     */
    async updatePost(postId: number, post: Partial<WordPressPost>): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(post),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update post');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Get all posts
     */
    async getPosts(params?: { per_page?: number; page?: number; status?: string }): Promise<any[]> {
        try {
            const queryParams = new URLSearchParams(params as any).toString();
            const url = `${this.baseUrl}/wp-json/wp/v2/posts${queryParams ? '?' + queryParams : ''}`;

            const response = await fetch(url, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Delete a post
     */
    async deletePost(postId: number, force: boolean = false): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts/${postId}?force=${force}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Get all categories
     */
    async getCategories(): Promise<WordPressCategory[]> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories?per_page=100`);

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Create a new category
     */
    async createCategory(name: string, slug?: string): Promise<WordPressCategory> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create category');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Get all tags
     */
    async getTags(): Promise<WordPressTag[]> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/tags?per_page=100`);

            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Create a new tag
     */
    async createTag(name: string, slug?: string): Promise<WordPressTag> {
        try {
            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/tags`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create tag');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }

    /**
     * Upload media
     */
    async uploadMedia(file: File): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload media');
            }

            return await response.json();
        } catch (error: any) {
            console.error('WordPress API Error:', error);
            throw error;
        }
    }
}
