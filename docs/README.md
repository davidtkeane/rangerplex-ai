# 📚 RangerPlex Documentation Hub
## Complete Guide to RangerPlex AI Platform

**Welcome to the RangerPlex Documentation Center!**

This is your central hub for all RangerPlex documentation, organized by category for easy navigation.

---

## 🎖️ QUICK START

**New to RangerPlex?**
1. Read the [Main README](../README.md) in the project root
2. Check [Installation Guides](#installation--setup)
3. Explore [Security Teams](#security-teams-red-blue-purple) (if interested in cybersecurity)

---

## 📂 DOCUMENTATION CATEGORIES

### 🛡️ [Security Teams (Red/Blue/Purple)](./security-teams/)
**Complete security knowledge base for all three teams**

- **[Blue Team](./security-teams/blue-team/)** - Defensive security, SOC, incident response
- **[Red Team](./security-teams/red-team/)** - Offensive security, pentesting, HTB/THM
- **[Purple Team](./security-teams/purple-team/)** - Detection engineering, threat hunting
- **[Overview](./security-teams/README.md)** - Master guide with career paths

**Perfect for:** Security students, SOC analysts, pentesters, career planning

---

### 📖 [Guides](./guides/)
**Step-by-step instructions and how-tos**

**Installation & Setup:**
- [Installation Guide](./guides/installation/) - Setup scripts and troubleshooting
- [Configuration Guide](./guides/configuration/) - PM2, environment variables

**Troubleshooting:**
- [Git Emergency Guide](./guides/troubleshooting/GIT_EMERGENCY_GUIDE.md)
- [Apple Silicon Compatibility](./guides/troubleshooting/APPLE_SILICON_COMPATIBILITY_UPDATE.md)
- [Bug Fixes Log](./guides/troubleshooting/BUGFIXES-2025-11-25.md)

**Planning:**
- [Manual Planning](./guides/rangerplex_manual_plan.md)

---

### 🔌 [Integrations](./integrations/)
**Connect RangerPlex with external services**

- **[LM Studio](./integrations/lm-studio/)** - Local LLM integration
  - Setup guide
  - Integration summary
  - M4 Max specific fixes

- **[Ollama](./integrations/ollama/)** - Local model management

- **[Docker](./integrations/docker/)** - Containerization setup

---

### ⚙️ [Technical Documentation](./technical/)
**Deep dives into RangerPlex architecture and features**

**Core Features:**
- [Canvas System](./technical/canvas/) - Visual workspace & document import
- [RangerBlock](./technical/rangerblock/) - Decentralized architecture, MVP, Node.js guide
- [API Documentation](./technical/api/) - API endpoints and usage

**Analysis & Research:**
- [OSINT Tools Plan](./technical/OSINT_TOOLS_PLAN.md)
- [Video Compression Analysis](./technical/IDCP_VIDEO_COMPRESSION_ANALYSIS.md)
- [Browser Audit](./technical/BROWSER_AUDIT_README.md)

---

### 🧠 [Memory Systems](./memory/)
**RangerPlex memory and context management**

- Conversation history
- Context persistence
- Memory architecture

---

### 🎮 [Feature Modules](./feature-modules/)
**Individual RangerPlex features**

- **[Win95 Mode](./Win95/)** - Windows 95 easter egg
- **[Tamagotchi](./TAMAGOTCHI/)** - Virtual pet system
- **[Radio](./radio/)** - In-app radio feature
- **[Study Clock](./Study-Clock/)** - Focus timer

---

### 🧪 [Testing](./testing-files/)
**Test files and validation**

- Test scenarios
- Validation scripts
- QA documentation

---

### 🤖 [New Models](./new-models/)
**Adding AI models to RangerPlex**

- **[How to Add New Models](./new-models/HOW_TO_ADD_NEW_MODELS.md)** - Complete guide for adding Claude, Gemini, GPT, or other models
- Step-by-step process
- File locations and checklist
- Real example: Claude Opus 4.5
- Troubleshooting tips

**Perfect for:** Developers, AI assistants, anyone adding new models to RangerPlex

---

## 🗺️ NAVIGATION GUIDE

### **By User Type:**

**Security Student (like David!):**
```
1. Security Teams Overview → docs/security-teams/README.md
2. Blue Team Toolkit → docs/security-teams/blue-team/
3. Red Team (for NCI course) → docs/security-teams/red-team/
4. Purple Team (future career) → docs/security-teams/purple-team/
```

**Developer:**
```
1. Main README → ../README.md
2. API Documentation → docs/technical/api/
3. Canvas System → docs/technical/canvas/
4. Integration Guides → docs/integrations/
```

**System Administrator:**
```
1. Installation Guide → docs/guides/installation/
2. Configuration Guide → docs/guides/configuration/
3. Docker Setup → docs/integrations/docker/
4. Troubleshooting → docs/guides/troubleshooting/
```

**RangerPlex User:**
```
1. Main README → ../README.md
2. Manual/User Guide → docs/guides/rangerplex_manual_plan.md
3. Feature Documentation → docs/feature-modules/
```

---

## 📊 DOCUMENTATION STRUCTURE

```
docs/
├── README.md (You are here!)
│
├── security-teams/              🛡️ Red/Blue/Purple team knowledge
│   ├── README.md               (Master security guide)
│   ├── blue-team/              (Defensive security)
│   ├── red-team/               (Offensive security)
│   ├── purple-team/            (Detection engineering)
│   └── SECURITY_SYSTEM_PROMPT.md
│
├── guides/                      📖 How-to guides
│   ├── installation/           (Setup & install)
│   ├── configuration/          (Config & settings)
│   ├── troubleshooting/        (Fix common issues)
│   └── rangerplex_manual_plan.md
│
├── integrations/                🔌 External services
│   ├── lm-studio/              (Local LLMs)
│   ├── ollama/                 (Model management)
│   └── docker/                 (Containers)
│
├── technical/                   ⚙️ Architecture & deep dives
│   ├── canvas/                 (Canvas system)
│   ├── rangerblock/            (Blockchain)
│   ├── api/                    (API docs)
│   ├── OSINT_TOOLS_PLAN.md
│   └── ... (other technical docs)
│
├── new-models/                  🤖 Adding AI models
│   └── HOW_TO_ADD_NEW_MODELS.md (Complete guide)
│
├── memory/                      🧠 Memory systems
├── Win95/                       🎮 Win95 mode
├── TAMAGOTCHI/                  🐾 Virtual pet
├── radio/                       📻 Radio feature
├── Study-Clock/                 ⏰ Focus timer
├── venv/                        🐍 Python environment
└── testing-files/               🧪 Test files
```

---

## 🔍 FINDING WHAT YOU NEED

### **Search by Topic:**

| Looking for... | Go to... |
|----------------|----------|
| Security training | [security-teams/](./security-teams/) |
| Blue team defense | [security-teams/blue-team/](./security-teams/blue-team/) |
| HTB/THM scripts | [security-teams/red-team/](./security-teams/red-team/) |
| Career planning | [security-teams/README.md](./security-teams/README.md) |
| Installation help | [guides/installation/](./guides/installation/) |
| Configuration | [guides/configuration/](./guides/configuration/) |
| Fixing errors | [guides/troubleshooting/](./guides/troubleshooting/) |
| LM Studio setup | [integrations/lm-studio/](./integrations/lm-studio/) |
| Docker setup | [integrations/docker/](./integrations/docker/) |
| Canvas features | [technical/canvas/](./technical/canvas/) |
| RangerBlock info | [technical/rangerblock/](./technical/rangerblock/) |
| API reference | [technical/api/](./technical/api/) |
| Adding new AI models | [new-models/HOW_TO_ADD_NEW_MODELS.md](./new-models/HOW_TO_ADD_NEW_MODELS.md) |

---

## 🎯 RECOMMENDED READING PATHS

### **Path 1: New RangerPlex User**
1. Main [README.md](../README.md)
2. [Installation Guide](./guides/installation/)
3. [Manual/User Guide](./guides/rangerplex_manual_plan.md)
4. Explore [Feature Modules](#feature-modules)

### **Path 2: Security Student (David's Path!)**
1. [Security Teams Overview](./security-teams/README.md)
2. [Blue Team Toolkit](./security-teams/blue-team/BLUE_TEAM_TOOLKIT.md)
3. [Red Team Toolkit](./security-teams/red-team/RED_TEAM_TOOLKIT.md) (as needed)
4. [Purple Team Toolkit](./security-teams/purple-team/PURPLE_TEAM_TOOLKIT.md) (future)

### **Path 3: Developer Contributor**
1. Main [README.md](../README.md)
2. [Technical Documentation](./technical/)
3. [API Documentation](./technical/api/)
4. [Canvas System](./technical/canvas/)

### **Path 4: System Administrator**
1. [Installation Guide](./guides/installation/)
2. [Configuration Guide](./guides/configuration/)
3. [Docker Integration](./integrations/docker/)
4. [Troubleshooting Guide](./guides/troubleshooting/)

---

## 📝 DOCUMENTATION STANDARDS

### **Naming Conventions:**
- `UPPERCASE_WITH_UNDERSCORES.md` - Major documentation files
- `lowercase-with-hyphens/` - Directory names
- `README.md` - Index/overview files in each directory

### **File Organization:**
- Keep related docs together in subdirectories
- Use README.md files for navigation
- Link between related documents
- Update this main README when adding new sections

---

## 🤝 CONTRIBUTING TO DOCS

**Improving Documentation:**
1. Check if documentation exists (search this README)
2. Place new docs in appropriate category
3. Update relevant README files
4. Link related documents
5. Follow naming conventions

**Categories Missing?**
- Create new category directory
- Add README.md in new directory
- Update this main README
- Link from relevant places

---

## 📞 GETTING HELP

**Can't find what you need?**
1. Search this README (Ctrl+F)
2. Check [Troubleshooting](./guides/troubleshooting/)
3. Look in [Technical Docs](./technical/)
4. Check main project [README](../README.md)

**Found an issue?**
- Document it in [Troubleshooting](./guides/troubleshooting/)
- Update relevant READMEs
- Help the next person!

---

## 🎖️ SPECIAL SECTIONS

### **For David (IrishRanger IR240474):**
Your documentation is in [security-teams/](./security-teams/)!
- Blue Team (your strength!)
- Red Team (for NCI)
- Purple Team (your future!)

**Your path:**
1. Master [Blue Team](./security-teams/blue-team/BLUE_TEAM_TOOLKIT.md)
2. Pass NCI with [Red Team](./security-teams/red-team/RED_TEAM_TOOLKIT.md)
3. Excel at [Purple Team](./security-teams/purple-team/PURPLE_TEAM_TOOLKIT.md)

**"I love defending myself from attacks!"** 🛡️ - David Keane

---

## 📅 CHANGELOG

**2025-11-26:**
- ✅ Created organized documentation structure
- ✅ Moved security teams documentation to dedicated folder
- ✅ Organized guides by category (installation, configuration, troubleshooting)
- ✅ Separated integrations (LM Studio, Ollama, Docker)
- ✅ Created technical documentation section
- ✅ Added this main navigation README

**Previous:**
- Various documentation files scattered in docs/
- Security teams in Teams-Red-Blue-Purple/

---

## 🚀 WHAT'S NEXT?

**Planned Documentation:**
- [ ] Complete API reference
- [ ] User manual (comprehensive)
- [ ] Video tutorials index
- [ ] FAQ section
- [ ] Community contributions guide

---

**Rangers lead the way! 🎖️**

_Documentation organized by Ranger & David Keane (IrishRanger IR240474)_
_"One foot in front of the other" - Keep learning, keep building!_
