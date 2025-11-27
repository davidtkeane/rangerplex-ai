import { codeExecutionService } from '../codeExecutionService';
import { forensicHashService } from './forensicHashService';

export interface ChainEvent {
    timestamp: string;
    action: string;
    actor: string;
    location: string;
    notes?: string;
    hash?: string;
}

export interface CustodyLog {
    evidenceId: string;
    description: string;
    originalHash: string;
    created: string;
    chain: ChainEvent[];
}

export class ChainOfCustodyService {

    private getLogPath(evidenceId: string): string {
        // For now, store in a local 'custody_logs' folder in the workspace root or user home?
        // Let's assume a 'custody_logs' directory in the current workspace for simplicity of the demo.
        // In a real app, this might be a database or a secure vault.
        return `custody_logs/${evidenceId}_custody.json`;
    }

    /**
     * Create a new Chain of Custody log
     */
    async createChain(evidenceId: string, filePath: string, description: string, examiner: string): Promise<void> {
        try {
            // 1. Calculate initial hash
            let hash = '';
            if (window.electronAPI) {
                const result = await window.electronAPI.calculateHash(filePath, 'sha256');
                if (typeof result === 'string') hash = result;
            }

            if (!hash) {
                // Fallback or error
                await codeExecutionService.executeCode(`echo "❌ Could not calculate hash for chain creation."`, 'bash');
                return;
            }

            const log: CustodyLog = {
                evidenceId,
                description,
                originalHash: hash,
                created: new Date().toISOString(),
                chain: [
                    {
                        timestamp: new Date().toISOString(),
                        action: 'COLLECTED',
                        actor: examiner,
                        location: 'Local System',
                        notes: 'Initial collection',
                        hash: hash
                    }
                ]
            };

            // 2. Ensure directory exists
            await codeExecutionService.executeCode(`mkdir -p custody_logs`, 'bash');

            // 3. Save log
            const logPath = this.getLogPath(evidenceId);
            if (window.electronAPI) {
                await window.electronAPI.fsWriteFile(logPath, JSON.stringify(log, null, 2));
                await codeExecutionService.executeCode(`echo "✅ Chain of Custody CREATED for ${evidenceId}"`, 'bash');
                await codeExecutionService.executeCode(`echo "📄 Log saved to: ${logPath}"`, 'bash');
            }

        } catch (error) {
            await codeExecutionService.executeCode(`echo "❌ Error creating chain: ${error instanceof Error ? error.message : String(error)}"`, 'bash');
        }
    }

    /**
     * Update Chain of Custody
     */
    async updateChain(evidenceId: string, action: string, actor: string, notes: string): Promise<void> {
        try {
            const logPath = this.getLogPath(evidenceId);

            if (window.electronAPI) {
                // Read existing
                const content = await window.electronAPI.fsReadFile(logPath);
                if (typeof content === 'object' && content.error) {
                    throw new Error("Log not found");
                }

                const log: CustodyLog = JSON.parse(content as string);

                // Add event
                log.chain.push({
                    timestamp: new Date().toISOString(),
                    action,
                    actor,
                    location: 'Local System',
                    notes
                });

                // Save
                await window.electronAPI.fsWriteFile(logPath, JSON.stringify(log, null, 2));
                await codeExecutionService.executeCode(`echo "✅ Chain of Custody UPDATED for ${evidenceId}"`, 'bash');
            }

        } catch (error) {
            await codeExecutionService.executeCode(`echo "❌ Error updating chain: ${error instanceof Error ? error.message : String(error)}"`, 'bash');
        }
    }

    /**
     * Verify Chain of Custody (Integrity Check)
     */
    async verifyChain(evidenceId: string, currentFilePath?: string): Promise<void> {
        try {
            const logPath = this.getLogPath(evidenceId);

            if (window.electronAPI) {
                const content = await window.electronAPI.fsReadFile(logPath);
                if (typeof content === 'object' && content.error) {
                    throw new Error("Log not found");
                }

                const log: CustodyLog = JSON.parse(content as string);

                let output = `
🔐 CHAIN OF CUSTODY VERIFICATION
================================
Evidence ID: ${log.evidenceId}
Description: ${log.description}
Created:     ${log.created}
Original Hash: ${log.originalHash.substring(0, 16)}...

📜 EVENT LOG:
`;
                for (const event of log.chain) {
                    output += `[${event.timestamp}] ${event.action} by ${event.actor} (${event.notes || ''})\n`;
                }

                // Verify against current file if provided
                if (currentFilePath) {
                    const currentHash = await window.electronAPI.calculateHash(currentFilePath, 'sha256');
                    if (typeof currentHash === 'string') {
                        if (currentHash === log.originalHash) {
                            output += `\n✅ INTEGRITY CONFIRMED: File hash matches original record.`;
                        } else {
                            output += `\n❌ INTEGRITY FAILED: File hash DOES NOT match record!`;
                            output += `\n   Record: ${log.originalHash}`;
                            output += `\n   Actual: ${currentHash}`;
                        }
                    }
                }

                await codeExecutionService.executeCode(`echo "${output}"`, 'bash');
            }
        } catch (error) {
            await codeExecutionService.executeCode(`echo "❌ Error verifying chain: ${error instanceof Error ? error.message : String(error)}"`, 'bash');
        }
    }
}

export const chainOfCustodyService = new ChainOfCustodyService();
