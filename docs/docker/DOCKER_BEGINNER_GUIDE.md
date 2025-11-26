# 🐳 Docker: The Absolute Beginner's Guide
*From Zero to Hero: How to install, run, and manage your RangerPlex container without losing your mind.*

---

## 1. What is Docker? (The "Explain Like I'm 5" Version)
Imagine you baked a cake (your code) in your kitchen (your computer). It tastes great! But when you send the recipe to your friend, their cake tastes awful because their oven is different, or they used the wrong flour.

**Docker** solves this by shipping the **entire kitchen** along with the cake.
It puts your code, the database, the server, and all the settings into a sealed box called a **Container**. This box runs exactly the same way on your Mac, your friend's Windows PC, or a giant server in the cloud.

### The Three Musketeers ⚔️
You will hear these terms a lot. Here is what they mean:

1.  **Docker Engine (The Ship)**: The core software that runs the containers.
2.  **Docker CLI (The Captain)**: The command-line tool. You type commands like `docker run`, and the Captain tells the Ship what to do.
3.  **Docker Compose (The Coordinator)**: A tool that manages *multiple* containers at once. Instead of starting the Database, then the Backend, then the Frontend manually... you just say "Compose Up", and it orchestrates everything perfectly.

---

## 2. Installation Guide (Multi-Platform)

### 🍎 For Mac (Apple Silicon M1/M2/M3 & Intel)
The easiest way is **Docker Desktop**. It includes everything (Engine, CLI, Compose) in one install.

1.  Go to the [Docker Desktop Download Page](https://www.docker.com/products/docker-desktop/).
2.  Click **"Download for Mac - Apple Chip"** (if you have M1/M2/M3) or **"Intel Chip"**.
3.  Open the `.dmg` file and drag the Docker whale icon to your Applications folder.
4.  Open **Docker** from your Applications.
5.  **Important:** You will see a whale icon in your top menu bar. As long as that whale is there, Docker is running!

### 🪟 For Windows
1.  Go to the [Docker Desktop Download Page](https://www.docker.com/products/docker-desktop/).
2.  Download **"Docker Desktop for Windows"**.
3.  Run the installer. Ensure "Use WSL 2 instead of Hyper-V" is checked (it's faster).
4.  Restart your computer if asked.

### 🐧 For Linux (Ubuntu/Debian)
Linux users usually install via terminal.
```bash
# Get the convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
# Run it
sudo sh get-docker.sh
# Add your user to the docker group (so you don't need sudo every time)
sudo usermod -aG docker $USER
```

---

## 3. Getting Started: Your First Launch 🚀

Now that Docker is installed, let's get RangerPlex running.

1.  **Open your Terminal** (or VS Code Terminal).
2.  **Navigate to the project folder**:
    ```bash
    cd /path/to/rangerplex-ai
    ```
3.  **The Magic Command**:
    Run this command to build and start everything:
    ```bash
    docker-compose up -d --build
    ```
    *   `up`: Create and start containers.
    *   `-d`: **Detached mode**. This runs it in the background so it doesn't lock up your terminal.
    *   `--build`: Forces it to rebuild the app (good for the first time).

4.  **Check if it's working**:
    Go to **[http://localhost:5173](http://localhost:5173)** in your browser. You should see RangerPlex!

---

## 4. 🛑 STOP! Read This Before You Run It Again!
**The #1 Mistake Beginners Make:** Creating Duplicate Containers.

If you close your terminal or restart your computer, your container might still be there, just stopped. If you run `docker run` again blindly, you might create a *second* copy, which causes errors like "Port 3010 is already in use".

### How to Resume Work (The Right Way)

**Step 1: Check the Status**
Run this command to see what's happening:
```bash
docker ps -a
```
*   `ps`: Process Status.
*   `-a`: All (show me running AND stopped containers).

**Scenario A: It's already running**
If you see `Up` under the STATUS column, you don't need to do anything! It's already running.

**Scenario B: It exists, but it's "Exited" (Stopped)**
If you see `Exited` under STATUS, don't create a new one. Just wake up the old one:
```bash
docker start rangerplex-ai
```

**Scenario C: I changed some code and need to update**
If you edited `package.json` or changed the `Dockerfile`, you need to rebuild:
```bash
docker-compose up -d --build
```
*Docker Compose is smart. It will replace the old container with the new one automatically.*

---

## 5. The "Panic Button" Manual 🚨

### "I messed up and I want to start fresh."
If things are acting weird, ports are blocked, or you just want a clean slate:

1.  **Stop and Remove Everything**:
    ```bash
    docker-compose down
    ```
    *This stops the containers and removes them. It does NOT delete your database (because we saved that in a volume).*

2.  **Start Fresh**:
    ```bash
    docker-compose up -d
    ```

### "I can't connect to the server!"
Check the logs to see what's happening inside the box:
```bash
docker logs -f rangerplex-ai
```
*   `-f`: Follow (keep streaming the logs live).
*   Press `Ctrl + C` to exit the logs (this won't stop the container).

### "My computer is slow, how do I stop it?"
When you are done for the day:
```bash
docker stop rangerplex-ai
```
Or if you used Compose:
```bash
docker-compose stop
```

---

## 6. Cheat Sheet 📝

| Goal | Command |
| :--- | :--- |
| **Start everything** (First time / Update) | `docker-compose up -d --build` |
| **Stop everything** (End of day) | `docker-compose stop` |
| **Resume everything** (Next morning) | `docker-compose start` |
| **Delete everything** (Clean slate) | `docker-compose down` |
| **Show running containers** | `docker ps` |
| **Show ALL containers** | `docker ps -a` |
| **View logs** | `docker logs -f rangerplex-ai` |

---
*Welcome to the world of containers, Ranger!* 🐳
