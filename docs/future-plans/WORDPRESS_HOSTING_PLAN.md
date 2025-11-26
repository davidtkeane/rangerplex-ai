# 📝 Project Scribe: Local WordPress Hosting & Workflow Integration

**Date:** November 26, 2025
**Classification:** RANGER EYES ONLY
**Status:** PLANNING

## 1. Vision
Empower RangerPlex users to host their own WordPress instances locally via Docker, integrated directly into the RangerPlex workflow. This creates a seamless pipeline from "Learning/Hacking" to "Documenting/Publishing."

**The Loop:**
1.  **Action**: User performs a task (e.g., TryHackMe room) using the RangerPlex Console.
2.  **Documentation**: User takes notes in RangerPlex (Markdown).
3.  **Publishing**: Notes are automatically synced/pushed to the local WordPress instance as draft posts.
4.  **Refinement**: User edits the post in WordPress (via browser or RangerPlex iframe).
5.  **Deployment**: (Future) Push the local WordPress content to a live public server.

## 2. Technical Architecture

### A. The Stack (Docker)
We will use a standard WordPress + MySQL stack, orchestrated by RangerPlex.

```yaml
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: ranger
      WORDPRESS_DB_PASSWORD: password
      WORDPRESS_DB_NAME: ranger_blog
    volumes:
      - ./wp-content:/var/www/html/wp-content
    networks:
      - ranger-net

  db:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: ranger_blog
      MYSQL_USER: ranger
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - ./wp-data:/var/lib/mysql
    networks:
      - ranger-net
```

### B. Integration with RangerPlex Console
Since RangerPlex v2.5.00+ includes a built-in terminal/console:
1.  **Control**: Users can run `docker-compose up -d` directly from the RangerPlex console to start their blog.
2.  **Management**: We can add custom commands (e.g., `/blog start`, `/blog stop`) that wrap these Docker commands.

### C. The "Notes-to-Post" Pipeline
This is the core feature. We need a mechanism to convert RangerPlex Markdown notes into WordPress posts.

**Mechanism:**
*   **WP-CLI**: We can use the `wp-cli` tool inside the WordPress container to programmatically create posts.
*   **Workflow**:
    1.  User saves a note: `tryhackme-room-1.md`.
    2.  RangerPlex backend detects the save (or user runs `/blog publish tryhackme-room-1.md`).
    3.  RangerPlex executes a command in the WP container:
        ```bash
        docker exec rangerplex-wordpress wp post create /path/to/note.md --post_type=post --post_status=draft --post_title="TryHackMe Room 1"
        ```
    4.  (Alternative) Use the WordPress REST API to POST the content from RangerPlex to WordPress.

## 3. User Experience (UX)
1.  **Setup**:
    *   User clicks "Initialize Blog" in RangerPlex.
    *   Docker pulls images and starts containers.
    *   User visits `localhost:8080` to finish WP install (or we automate it).
2.  **Daily Use**:
    *   User is hacking in the Console.
    *   User writes notes in the "Sticky Notes" or "Docs" section.
    *   User clicks "Send to Blog".
    *   Post appears in WordPress.
3.  **Editing**:
    *   RangerPlex could have a "Blog View" tab that simply iframes `localhost:8080/wp-admin`, allowing full WP management without leaving the app.

## 4. Future Expansion: "Live Push"
*   Once the local post is polished, we can implement a sync feature (using plugins like All-in-One WP Migration or simple SQL/Content dumps) to push the local state to a live VPS or hosting provider.

## 5. Action Items
1.  Create `docker-compose.wordpress.yml`.
2.  Test `wp-cli` for creating posts from Markdown files.
3.  Develop the "Send to Blog" backend function in `proxy_server.js`.
