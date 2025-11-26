import type { SupportedLanguage } from '../types/editor';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

class CodeExecutionService {
  private terminalWs: WebSocket | null = null;

  setTerminalWebSocket(ws: WebSocket | null) {
    this.terminalWs = ws;
  }

  async executeCode(
    code: string,
    language: SupportedLanguage,
    filename: string = 'temp'
  ): Promise<ExecutionResult> {
    if (!this.terminalWs || this.terminalWs.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        output: '',
        error: 'Terminal not connected. Please open terminal first.',
      };
    }

    try {
      const command = this.getExecutionCommand(code, language, filename);
      this.terminalWs.send(command + '\n');

      return {
        success: true,
        output: 'Code sent to terminal. Check terminal output below.',
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getExecutionCommand(code: string, language: SupportedLanguage, filename: string): string {
    const sanitized = code.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    switch (language) {
      case 'javascript':
        return `node -e "${sanitized}"`;
      case 'typescript':
        return `ts-node -e "${sanitized}"`;
      case 'python':
        return `python3 -c "${sanitized}"`;
      case 'bash':
      case 'shell':
        return code;
      default:
        return `echo "Execution not supported for ${language} yet"`;
    }
  }

  async executeFromFile(filepath: string, language: SupportedLanguage): Promise<ExecutionResult> {
    if (!this.terminalWs || this.terminalWs.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        output: '',
        error: 'Terminal not connected.',
      };
    }

    const command = this.getFileExecutionCommand(filepath, language);
    this.terminalWs.send(command + '\n');

    return {
      success: true,
      output: 'Executing file in terminal...',
    };
  }

  private getFileExecutionCommand(filepath: string, language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
        return `node "${filepath}"`;
      case 'python':
        return `python3 "${filepath}"`;
      case 'bash':
      case 'shell':
        return `bash "${filepath}"`;
      case 'typescript':
        return `ts-node "${filepath}"`;
      default:
        return `cat "${filepath}"`;
    }
  }
}

export const codeExecutionService = new CodeExecutionService();
