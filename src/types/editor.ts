// Editor Type Definitions for RangerPlex Monaco Editor Integration
// Phase 1: Foundation Types

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  lastModified: number;
  isUnsaved?: boolean;
}

export interface EditorFolder {
  id: string;
  name: string;
  path: string;
  children: (EditorFile | EditorFolder)[];
  isExpanded?: boolean;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  tabSize: 2 | 4 | 8;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface EditorState {
  openFiles: EditorFile[];
  activeFileId: string | null;
  settings: EditorSettings;
  fileTree: EditorFolder | null;
}

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'bash'
  | 'shell'
  | 'sql'
  | 'plaintext';

export const languageExtensions: Record<SupportedLanguage, string[]> = {
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  python: ['.py', '.pyw', '.pyi'],
  go: ['.go'],
  rust: ['.rs'],
  java: ['.java'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'],
  c: ['.c', '.h'],
  csharp: ['.cs'],
  php: ['.php', '.phtml'],
  ruby: ['.rb', '.rake'],
  html: ['.html', '.htm'],
  css: ['.css'],
  scss: ['.scss', '.sass'],
  json: ['.json', '.jsonc'],
  yaml: ['.yaml', '.yml'],
  markdown: ['.md', '.markdown'],
  bash: ['.bash', '.sh'],
  shell: ['.sh', '.zsh', '.fish'],
  sql: ['.sql'],
  plaintext: ['.txt', '.text', '.log']
};

/**
 * Detects the programming language from a filename based on its extension
 * @param filename - The filename to analyze
 * @returns The detected language or 'plaintext' as default
 */
export function detectLanguageFromFilename(filename: string): SupportedLanguage {
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  for (const [language, extensions] of Object.entries(languageExtensions)) {
    if (extensions.includes(extension)) {
      return language as SupportedLanguage;
    }
  }

  return 'plaintext';
}

/**
 * Default editor settings
 */
export const defaultEditorSettings: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  autoSaveDelay: 1000
};
