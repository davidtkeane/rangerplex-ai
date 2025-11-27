import { codeExecutionService } from '../codeExecutionService';

export class ForensicStringsService {
    /**
     * Extract printable strings from a file
     */
    async extractStrings(filePath: string, minLength: number = 4, filter?: string): Promise<void> {
        // Basic strings command
        // -n : min length
        let command = `strings -n ${minLength} "${filePath}"`;

        if (filter) {
            command += ` | grep -i "${filter}"`;
        }

        // Pipe to less if it's likely to be huge? Or just let the terminal handle it.
        // The terminal has a buffer, but dumping 1GB of strings is bad.
        // Let's head it by default or warn?
        // For now, let's just run it. The user can Ctrl+C if it's too much.
        // Actually, maybe limit to top 1000 lines by default to be safe?
        // command += ` | head -n 1000`; 

        await codeExecutionService.executeCode(`echo "🔤 Extracting strings from: ${filePath} (Min: ${minLength})"`, 'bash');
        await codeExecutionService.executeCode(command, 'bash');
    }

    /**
     * Search for pattern in file (Grep wrapper)
     */
    async grepFile(filePath: string, pattern: string, contextLines: number = 0): Promise<void> {
        // -n: line numbers
        // -I: ignore binary files (though we might want to search them? grep usually handles binary poorly)
        // -a: process binary as text (risky for terminal)
        // Let's use -n and maybe -C for context

        let command = `grep -n`;
        if (contextLines > 0) {
            command += ` -C ${contextLines}`;
        }

        // Escape pattern slightly?
        const safePattern = pattern.replace(/"/g, '\\"');

        command += ` "${safePattern}" "${filePath}"`;

        await codeExecutionService.executeCode(`echo "🔍 Searching for '${safePattern}' in: ${filePath}"`, 'bash');
        await codeExecutionService.executeCode(command, 'bash');
    }
}

export const forensicStringsService = new ForensicStringsService();
