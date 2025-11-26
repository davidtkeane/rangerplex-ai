# 🚀 Mission Brief: Monaco Editor Advanced Features
**Agent:** Claude Ranger (Second Session)
**Status:** ⏳ Awaiting All Previous Missions
**Priority:** MEDIUM (Polish & Advanced Features)
**Estimated Time:** 6-10 hours

---

## 🎯 Mission Objective

Add advanced features to Monaco Editor: enhanced language support, custom themes, code snippets library, formatting/linting, and polish. Make RangerPlex's code editor world-class with professional IDE features.

**Prerequisites:**
- Current Claude must complete setup (Monaco Editor working)
- Gemini must complete frontend (UI components ready)
- GPT must complete integration (Terminal, AI, Settings working)

---

## 📋 Task List

### **Task 1: Verify All Prerequisites** ✅ or ⬜
**Estimated Time:** 15 minutes

**Check that all previous missions are complete:**
- [ ] Claude: Monaco Editor working at `/editor`
- [ ] Claude: Types and services created
- [ ] Gemini: All UI components (FileTree, Tabs, Toolbar)
- [ ] Gemini: EditorLayout working
- [ ] GPT: Terminal integration working
- [ ] GPT: AI chat integration working
- [ ] GPT: Settings integration working

**Test Everything:**
- [ ] Can write code
- [ ] Can run code in terminal
- [ ] Can ask AI for help
- [ ] Can change settings
- [ ] UI looks professional

**If anything is broken:** Ask David to have the responsible AI fix it first!

**Deliverable:** Confirmed all foundations are solid

---

### **Task 2: Enhanced Language Support** ⬜
**Estimated Time:** 2 hours

**Goal:** Add better IntelliSense and validation for popular languages

**Install Language Extensions:**
```bash
# TypeScript/JavaScript already built-in
# Add these for better support:
npm install --save-dev \
  @types/node \
  prettier \
  eslint
```

**Configure Language Features:**

**File: `src/services/languageService.ts`**
```typescript
import * as monaco from 'monaco-editor';

class LanguageService {
  // Configure TypeScript/JavaScript
  configureTypeScript() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      allowJs: true
    });

    // Add common type definitions
    this.addTypeDefinitions();
  }

  // Add type definitions for better IntelliSense
  async addTypeDefinitions() {
    // Node.js types
    const nodeTypes = await fetch('https://cdn.jsdelivr.net/npm/@types/node/index.d.ts');
    const nodeTypesContent = await nodeTypes.text();

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      nodeTypesContent,
      'file:///node_modules/@types/node/index.d.ts'
    );

    // React types (if using React)
    const reactTypes = await fetch('https://cdn.jsdelivr.net/npm/@types/react/index.d.ts');
    const reactTypesContent = await reactTypes.text();

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      reactTypesContent,
      'file:///node_modules/@types/react/index.d.ts'
    );
  }

  // Configure Python
  configurePython() {
    // Monaco has basic Python support built-in
    // For advanced features, would need to integrate language server
    // That's beyond scope, but basic syntax highlighting works
  }

  // Add custom keywords/snippets per language
  registerCustomCompletions() {
    // JavaScript/TypeScript custom completions
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'console.log(${1:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Log to console'
          },
          {
            label: 'async function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'async function ${1:name}(${2:params}) {',
              '\t${3}',
              '}'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Async function declaration'
          }
        ];

        return { suggestions };
      }
    });

    // Python custom completions
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          {
            label: 'print',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'print(${1:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Print to console'
          },
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'def ${1:function_name}(${2:params}):',
              '\t${3:pass}'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Function definition'
          }
        ];

        return { suggestions };
      }
    });
  }

  // Initialize all language features
  init() {
    this.configureTypeScript();
    this.configurePython();
    this.registerCustomCompletions();
  }
}

export const languageService = new LanguageService();
```

**Initialize in EditorLayout:**
```typescript
import { languageService } from '../../services/languageService';

useEffect(() => {
  languageService.init();
}, []);
```

**Deliverable:** Enhanced IntelliSense for JS/TS/Python

---

### **Task 3: Custom Themes** ⬜
**Estimated Time:** 90 minutes

**Goal:** Add custom themes beyond default VS Code themes

**File: `src/services/themeService.ts`**
```typescript
import * as monaco from 'monaco-editor';

interface CustomTheme {
  id: string;
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  colors: { [key: string]: string };
  rules: { token: string; foreground?: string; background?: string; fontStyle?: string }[];
}

// RangerPlex Dark Theme
const rangerplexDark: CustomTheme = {
  id: 'rangerplex-dark',
  name: 'RangerPlex Dark',
  base: 'vs-dark',
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#161b22',
    'editorCursor.foreground': '#58a6ff',
    'editor.selectionBackground': '#1f6feb',
    'editor.inactiveSelectionBackground': '#1f6feb40',
  },
  rules: [
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'function', foreground: 'd2a8ff' },
    { token: 'variable', foreground: 'ffa657' },
  ]
};

// Cyberpunk Theme (for fun!)
const cyberpunk: CustomTheme = {
  id: 'cyberpunk',
  name: 'Cyberpunk 🌃',
  base: 'vs-dark',
  colors: {
    'editor.background': '#120458',
    'editor.foreground': '#00fff9',
    'editor.lineHighlightBackground': '#1a0766',
    'editorCursor.foreground': '#ff00ff',
    'editor.selectionBackground': '#ff00ff40',
  },
  rules: [
    { token: 'comment', foreground: '9945ff', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff006e' },
    { token: 'string', foreground: '00f5ff' },
    { token: 'number', foreground: 'ffbe0b' },
    { token: 'function', foreground: 'fb5607' },
  ]
};

// Dracula Theme
const dracula: CustomTheme = {
  id: 'dracula',
  name: 'Dracula 🧛',
  base: 'vs-dark',
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2',
    'editor.lineHighlightBackground': '#44475a',
    'editorCursor.foreground': '#f8f8f2',
    'editor.selectionBackground': '#44475a',
  },
  rules: [
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'function', foreground: '50fa7b' },
  ]
};

class ThemeService {
  private themes: CustomTheme[] = [rangerplexDark, cyberpunk, dracula];

  // Register all custom themes
  registerThemes() {
    this.themes.forEach(theme => {
      monaco.editor.defineTheme(theme.id, {
        base: theme.base,
        inherit: true,
        colors: theme.colors,
        rules: theme.rules
      });
    });
  }

  // Get list of all themes (built-in + custom)
  getAvailableThemes() {
    return [
      { id: 'vs-dark', name: 'VS Code Dark' },
      { id: 'vs-light', name: 'VS Code Light' },
      { id: 'hc-black', name: 'High Contrast' },
      ...this.themes.map(t => ({ id: t.id, name: t.name }))
    ];
  }

  // Apply theme
  setTheme(themeId: string) {
    monaco.editor.setTheme(themeId);
  }
}

export const themeService = new ThemeService();
```

**Update EditorLayout:**
```typescript
import { themeService } from '../../services/themeService';

useEffect(() => {
  themeService.registerThemes();
  themeService.setTheme(editorSettings.theme); // From settings
}, []);
```

**Update Settings Page:**
Add custom themes to theme selector:
```typescript
<select value={editorSettings.theme} onChange={handleThemeChange}>
  {themeService.getAvailableThemes().map(theme => (
    <option key={theme.id} value={theme.id}>
      {theme.name}
    </option>
  ))}
</select>
```

**Deliverable:** Custom themes (RangerPlex Dark, Cyberpunk, Dracula)

---

### **Task 4: Code Snippets Library** ⬜
**Estimated Time:** 2 hours

**Goal:** Pre-built code templates for common tasks

**File: `src/services/snippetsService.ts`**
```typescript
interface Snippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  category: 'security' | 'web' | 'data' | 'general';
}

const snippets: Snippet[] = [
  // Security Snippets (for David!)
  {
    id: 'port-scanner',
    name: 'Port Scanner (Python)',
    description: 'Basic TCP port scanner for HTB/THM',
    language: 'python',
    category: 'security',
    code: `#!/usr/bin/env python3
import socket
import sys

def scan_port(target, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((target, port))
        sock.close()
        return result == 0
    except:
        return False

target = input("Enter target IP: ")
print(f"Scanning {target}...")

for port in range(1, 1001):
    if scan_port(target, port):
        print(f"Port {port} is OPEN")

print("Scan complete!")`
  },
  {
    id: 'web-recon',
    name: 'Web Reconnaissance (Bash)',
    description: 'Quick web enumeration script',
    language: 'bash',
    category: 'security',
    code: `#!/bin/bash
# Quick Web Recon Script

TARGET=$1

if [ -z "$TARGET" ]; then
    echo "Usage: ./recon.sh <target>"
    exit 1
fi

echo "[*] Starting reconnaissance on $TARGET"

# Ping check
echo "[*] Checking if host is alive..."
ping -c 1 $TARGET > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "[+] Host is UP!"
else
    echo "[-] Host appears to be down"
    exit 1
fi

# Port scan
echo "[*] Scanning common ports..."
nmap -F $TARGET

# Web headers
echo "[*] Fetching HTTP headers..."
curl -I http://$TARGET

# Subdomain enum (if online)
echo "[*] Checking for subdomains..."
host www.$TARGET
host mail.$TARGET
host ftp.$TARGET

echo "[*] Reconnaissance complete!"`
  },
  {
    id: 'sql-injection-test',
    name: 'SQL Injection Test (Python)',
    description: 'Basic SQL injection tester (educational)',
    language: 'python',
    category: 'security',
    code: `#!/usr/bin/env python3
import requests

url = input("Enter target URL: ")
payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin' --",
    "' OR 1=1 --"
]

print(f"Testing {url} for SQL injection...")
print("⚠️  For authorized testing ONLY!")

for payload in payloads:
    try:
        params = {'username': payload, 'password': 'test'}
        response = requests.post(url, data=params)

        if "welcome" in response.text.lower() or "dashboard" in response.text.lower():
            print(f"[!] Potential vulnerability with payload: {payload}")
        else:
            print(f"[-] Payload failed: {payload}")
    except Exception as e:
        print(f"[!] Error: {e}")

print("Testing complete!")`
  },

  // Web Development Snippets
  {
    id: 'express-server',
    name: 'Express Server (JavaScript)',
    description: 'Basic Express.js server template',
    language: 'javascript',
    category: 'web',
    code: `const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});`
  },
  {
    id: 'react-component',
    name: 'React Component (TypeScript)',
    description: 'Functional React component template',
    language: 'typescript',
    category: 'web',
    code: `import { useState, useEffect } from 'react';

interface Props {
    title: string;
}

export default function MyComponent({ title }: Props) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Component mounted
        console.log('Component mounted');

        return () => {
            // Component unmounting
            console.log('Component unmounting');
        };
    }, []);

    return (
        <div>
            <h1>{title}</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}`
  },

  // Data Processing
  {
    id: 'csv-parser',
    name: 'CSV Parser (Python)',
    description: 'Read and process CSV files',
    language: 'python',
    category: 'data',
    code: `import csv

def read_csv(filename):
    data = []
    with open(filename, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)
    return data

def write_csv(filename, data, fieldnames):
    with open(filename, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

# Example usage
data = read_csv('input.csv')
print(f"Read {len(data)} rows")

# Process data
processed = []
for row in data:
    # Your processing here
    processed.append(row)

write_csv('output.csv', processed, data[0].keys())
print("Processing complete!")`
  },

  // General
  {
    id: 'argparse',
    name: 'CLI Arguments (Python)',
    description: 'Command-line argument parsing',
    language: 'python',
    category: 'general',
    code: `#!/usr/bin/env python3
import argparse

def main():
    parser = argparse.ArgumentParser(
        description='Script description here'
    )

    parser.add_argument(
        'input',
        help='Input file or value'
    )

    parser.add_argument(
        '-o', '--output',
        default='output.txt',
        help='Output file (default: output.txt)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    if args.verbose:
        print(f"Input: {args.input}")
        print(f"Output: {args.output}")

    # Your code here
    print("Processing...")

if __name__ == '__main__':
    main()`
  }
];

class SnippetsService {
  getSnippets(language?: string, category?: string): Snippet[] {
    let filtered = snippets;

    if (language) {
      filtered = filtered.filter(s => s.language === language);
    }

    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }

    return filtered;
  }

  getCategories(): string[] {
    return Array.from(new Set(snippets.map(s => s.category)));
  }

  insertSnippet(editor: any, snippet: Snippet) {
    const selection = editor.getSelection();
    const id = { major: 1, minor: 1 };
    const op = {
      identifier: id,
      range: selection,
      text: snippet.code,
      forceMoveMarkers: true
    };
    editor.executeEdits('snippet', [op]);
  }
}

export const snippetsService = new SnippetsService();
```

**Create Snippets Panel Component:**

**File: `src/components/CodeEditor/SnippetsPanel.tsx`**
```typescript
import { useState } from 'react';
import { Code, Search, X } from 'lucide-react';
import { snippetsService } from '../../services/snippetsService';
import styles from './SnippetsPanel.module.css';

interface SnippetsPanelProps {
  currentLanguage: string;
  onInsert: (code: string) => void;
}

export default function SnippetsPanel({ currentLanguage, onInsert }: SnippetsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const snippets = snippetsService.getSnippets(
    currentLanguage,
    selectedCategory || undefined
  ).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = snippetsService.getCategories();

  return (
    <>
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen(true)}
        title="Code Snippets"
      >
        <Code size={16} />
        Snippets
      </button>

      {isOpen && (
        <div className={styles.modal}>
          <div className={styles.panel}>
            <div className={styles.header}>
              <h3>Code Snippets</h3>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.search}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search snippets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.categories}>
              <button
                className={!selectedCategory ? styles.active : ''}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={selectedCategory === cat ? styles.active : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.snippets}>
              {snippets.map(snippet => (
                <div
                  key={snippet.id}
                  className={styles.snippet}
                  onClick={() => {
                    onInsert(snippet.code);
                    setIsOpen(false);
                  }}
                >
                  <div className={styles.snippetHeader}>
                    <strong>{snippet.name}</strong>
                    <span className={styles.language}>{snippet.language}</span>
                  </div>
                  <p>{snippet.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Add to EditorToolbar:**
```typescript
<SnippetsPanel
  currentLanguage={currentLanguage}
  onInsert={(code) => {
    // Insert into editor
    setCurrentCode(code);
  }}
/>
```

**Deliverable:** Snippets library with security, web, and general templates

---

### **Task 5: Code Formatting (Prettier Integration)** ⬜
**Estimated Time:** 60 minutes

**Install Prettier:**
```bash
npm install --save-dev prettier
```

**File: `src/services/formatterService.ts`**
```typescript
import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import parserTypeScript from 'prettier/parser-typescript';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserMarkdown from 'prettier/parser-markdown';

class FormatterService {
  async formatCode(code: string, language: string): Promise<string> {
    try {
      const parser = this.getParser(language);

      if (!parser) {
        // No formatter for this language
        return code;
      }

      const formatted = await prettier.format(code, {
        parser,
        plugins: [parserBabel, parserTypeScript, parserHtml, parserCss, parserMarkdown],
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 80
      });

      return formatted;
    } catch (error) {
      console.error('Formatting error:', error);
      // Return original code if formatting fails
      return code;
    }
  }

  private getParser(language: string): string | null {
    const parserMap: { [key: string]: string } = {
      'javascript': 'babel',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'markdown': 'markdown'
    };

    return parserMap[language] || null;
  }
}

export const formatterService = new FormatterService();
```

**Update EditorToolbar Format Button:**
```typescript
const handleFormat = async () => {
  const formatted = await formatterService.formatCode(currentCode, currentLanguage);
  setCurrentCode(formatted);
};
```

**Deliverable:** Working code formatter (Prettier)

---

### **Task 6: Multi-File Search** ⬜
**Estimated Time:** 90 minutes

**Goal:** Find text across all files (like Ctrl+Shift+F in VS Code)

**Create Search Component:**

**File: `src/components/CodeEditor/GlobalSearch.tsx`**
```typescript
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { EditorFile } from '../../types/editor';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  file: EditorFile;
  lineNumber: number;
  lineContent: string;
  matchIndex: number;
}

interface GlobalSearchProps {
  files: EditorFile[];
  onResultClick: (file: EditorFile, lineNumber: number) => void;
}

export default function GlobalSearch({ files, onResultClick }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);

  const searchFiles = (): SearchResult[] => {
    if (!searchTerm) return [];

    const results: SearchResult[] = [];

    files.forEach(file => {
      const lines = file.content.split('\n');
      lines.forEach((line, lineIndex) => {
        let matches = false;

        if (regex) {
          try {
            const re = new RegExp(searchTerm, caseSensitive ? '' : 'i');
            matches = re.test(line);
          } catch {
            // Invalid regex
            return;
          }
        } else {
          matches = caseSensitive
            ? line.includes(searchTerm)
            : line.toLowerCase().includes(searchTerm.toLowerCase());
        }

        if (matches) {
          const matchIndex = caseSensitive
            ? line.indexOf(searchTerm)
            : line.toLowerCase().indexOf(searchTerm.toLowerCase());

          results.push({
            file,
            lineNumber: lineIndex + 1,
            lineContent: line.trim(),
            matchIndex
          });
        }
      });
    });

    return results;
  };

  const results = searchFiles();

  return (
    <>
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Global Search (Ctrl+Shift+F)"
      >
        <Search size={16} />
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>Search in Files</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />

            <div className={styles.options}>
              <label>
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                Case Sensitive
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={regex}
                  onChange={(e) => setRegex(e.target.checked)}
                />
                Regex
              </label>
            </div>
          </div>

          <div className={styles.results}>
            {results.length === 0 && searchTerm && (
              <p>No results found</p>
            )}

            {results.map((result, idx) => (
              <div
                key={idx}
                className={styles.result}
                onClick={() => onResultClick(result.file, result.lineNumber)}
              >
                <div className={styles.resultFile}>
                  {result.file.name}:{result.lineNumber}
                </div>
                <div className={styles.resultLine}>
                  {result.lineContent}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      )}
    </>
  );
}
```

**Add to EditorLayout:**
```typescript
<GlobalSearch
  files={openFiles}
  onResultClick={(file, lineNumber) => {
    // Open file and jump to line
    setActiveFileId(file.id);
    // TODO: Scroll to line in Monaco Editor
  }}
/>
```

**Deliverable:** Global search across files

---

### **Task 7: Testing & Polish** ⬜
**Estimated Time:** 60 minutes

**Test Checklist:**
- [ ] Enhanced IntelliSense works
- [ ] Custom themes apply correctly
- [ ] Snippets library opens and inserts code
- [ ] Code formatting works (Prettier)
- [ ] Global search finds text across files
- [ ] All features work together
- [ ] Performance is good
- [ ] No bugs or crashes

**Polish Items:**
- Smooth animations
- Loading states
- Error handling
- Tooltips and help text
- Keyboard shortcuts documented
- Consistent styling

**Deliverable:** Polished, professional features

---

### **Task 8: Create User Guide** ⬜
**Estimated Time:** 45 minutes

**File: `docs/monaco/USER_GUIDE.md`**
```markdown
# 🖥️ RangerPlex Code Editor - User Guide

## Features

### Writing Code
- Syntax highlighting for 20+ languages
- IntelliSense (autocomplete)
- Real-time error detection
- Multi-cursor editing
- Code folding
- Minimap

### Running Code
1. Write your code
2. Click "Run" or press Ctrl+Enter
3. See output in terminal below

### AI Assistance
1. Select code (optional)
2. Click AI Assistant button
3. Choose quick action or ask question
4. Get help instantly

### Code Snippets
1. Click "Snippets" button
2. Search or browse by category
3. Click snippet to insert

### Formatting
- Click "Format" button
- Or press Shift+Alt+F
- Auto-formats your code

### Search
- Global search: Ctrl+Shift+F
- Find in current file: Ctrl+F
- Replace: Ctrl+H

### Themes
- Go to Settings → Code Editor
- Choose from 6 themes:
  - VS Code Dark
  - VS Code Light
  - High Contrast
  - RangerPlex Dark
  - Cyberpunk
  - Dracula

### Keyboard Shortcuts
- Save: Ctrl+S
- Run: Ctrl+Enter
- Format: Shift+Alt+F
- Close tab: Ctrl+W
- Find: Ctrl+F
- Global search: Ctrl+Shift+F
- Comment: Ctrl+/

## Tips

- Enable auto-save in Settings
- Use snippets for common code patterns
- Ask AI for code review
- Run code directly in terminal
- Customize theme and font size

## Security Scripts (for HTB/THM)

We include pre-built security snippets:
- Port Scanner (Python)
- Web Reconnaissance (Bash)
- SQL Injection Tester (Python)

Access via Snippets → Security category

---

**Rangers lead the way!** 🎖️
```

**Deliverable:** Complete user documentation

---

### **Task 9: Create Completion Report** ⬜
**Estimated Time:** 20 minutes

**File: `docs/monaco/ADVANCED_COMPLETE.md`**
```markdown
# Monaco Editor Advanced Features - COMPLETE ✅

**Date:** [Date you complete this]
**Agent:** Claude Ranger (Second Session)

## What Was Done

### Features Added
1. **Enhanced Language Support** - Better IntelliSense for JS/TS/Python
2. **Custom Themes** - RangerPlex Dark, Cyberpunk, Dracula
3. **Code Snippets** - 8+ pre-built templates (security, web, data)
4. **Code Formatting** - Prettier integration
5. **Global Search** - Find text across all files
6. **User Guide** - Complete documentation

### Services Created
- `languageService.ts` - Enhanced language features
- `themeService.ts` - Custom theme management
- `snippetsService.ts` - Code snippet library
- `formatterService.ts` - Prettier integration

### Components Created
- `SnippetsPanel.tsx` - Snippets browser
- `GlobalSearch.tsx` - Multi-file search

## Features Summary

**Language Support:**
- ✅ Enhanced IntelliSense (JS, TS, Python)
- ✅ Custom completions
- ✅ Type definitions

**Themes:**
- ✅ RangerPlex Dark
- ✅ Cyberpunk
- ✅ Dracula
- ✅ VS Code themes

**Snippets (8 total):**
- ✅ Port Scanner (Python)
- ✅ Web Recon (Bash)
- ✅ SQL Injection Test (Python)
- ✅ Express Server (JavaScript)
- ✅ React Component (TypeScript)
- ✅ CSV Parser (Python)
- ✅ CLI Arguments (Python)
- ✅ And more...

**Tools:**
- ✅ Code formatter (Prettier)
- ✅ Global search
- ✅ Multi-cursor editing

## Final Product

RangerPlex now has a **world-class code editor**:
- Write code with professional IDE features
- Run code in integrated terminal
- Get AI assistance on demand
- Use pre-built security scripts
- Beautiful themes and polished UI

Perfect for:
- Security students (HTB/THM)
- Learning to code
- Quick prototypes
- Script development

## All Missions Complete!

**Foundation (Claude):** ✅ DONE
**Frontend (Gemini):** ✅ DONE
**Integration (GPT):** ✅ DONE
**Advanced (Claude-2):** ✅ DONE

**Status:** ✅ PROJECT COMPLETE
**Result:** Professional code editor in RangerPlex!

Rangers lead the way! 🎖️
```

**Deliverable:** Project completion documentation

---

## 📊 Deliverables Summary

After completing this mission, you will have:

1. ✅ Enhanced language support (IntelliSense)
2. ✅ Custom themes (3 new themes)
3. ✅ Code snippets library (8+ templates)
4. ✅ Code formatting (Prettier)
5. ✅ Global search (find across files)
6. ✅ User guide documentation
7. ✅ All features tested
8. ✅ Completion report

---

## 🎨 Final Polish Items

- Smooth animations everywhere
- Loading states for async operations
- Error messages are helpful
- Tooltips on all buttons
- Consistent color scheme
- No visual glitches
- Professional appearance

---

## 🚧 Critical Notes

**This is the FINAL mission!**
- Make it PERFECT
- Test EVERYTHING
- Polish EVERY detail
- Document THOROUGHLY

**Quality over speed:**
- Take time to get it right
- Test on different browsers
- Make sure it's user-friendly
- Ensure performance is good

---

**Mission Status:** ⏳ **AWAITING ALL PREVIOUS MISSIONS**
**Estimated Completion:** 6-10 hours
**Priority:** MEDIUM (Polish & Advanced Features)

**Rangers lead the way!** 🎖️

*Created by AIRanger Claude (claude-sonnet-4-5-20250929)*
*November 26, 2025*
