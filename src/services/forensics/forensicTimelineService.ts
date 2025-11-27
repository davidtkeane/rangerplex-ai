import { forensicMetadataService } from './forensicMetadataService';
import { codeExecutionService } from '../codeExecutionService';

export interface TimelineEvent {
    timestamp: Date;
    type: 'CREATED' | 'MODIFIED' | 'ACCESSED';
    file: string;
    details?: string;
}

export class ForensicTimelineService {
    /**
     * Generate a timeline for a directory
     */
    async generateTimeline(dirPath: string): Promise<void> {
        if (window.electronAPI) {
            try {
                const files = await window.electronAPI.fsReadDir(dirPath);
                if (Array.isArray(files)) {
                    await codeExecutionService.executeCode(`echo "⏳ Generating timeline for: ${dirPath}..."`, 'bash');

                    const events: TimelineEvent[] = [];

                    for (const file of files) {
                        // Skip .DS_Store and hidden files for cleaner output
                        if (file.name.startsWith('.')) continue;

                        const meta = await forensicMetadataService.getMetadata(file.path);
                        if (meta) {
                            events.push({ timestamp: meta.created, type: 'CREATED', file: file.name });
                            events.push({ timestamp: meta.modified, type: 'MODIFIED', file: file.name });
                            // Accessed is often noisy, maybe optional? Included for completeness.
                            // events.push({ timestamp: meta.accessed, type: 'ACCESSED', file: file.name });
                        }
                    }

                    // Sort by timestamp
                    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                    // Format output
                    let output = `
📅 FORENSIC TIMELINE
====================
Range: ${events[0]?.timestamp.toLocaleString() || 'N/A'} - ${events[events.length - 1]?.timestamp.toLocaleString() || 'N/A'}
Total Events: ${events.length}

`;

                    // Group by day? Or just list? Let's list for now.
                    for (const event of events) {
                        const dateStr = event.timestamp.toISOString().replace('T', ' ').substring(0, 19);
                        const icon = event.type === 'CREATED' ? '✨' : (event.type === 'MODIFIED' ? '📝' : '👀');
                        output += `${dateStr} | ${icon} ${event.type.padEnd(8)} | ${event.file}\n`;
                    }

                    await codeExecutionService.executeCode(`echo "${output}"`, 'bash');

                } else {
                    await codeExecutionService.executeCode(`echo "❌ Failed to read directory: ${dirPath}"`, 'bash');
                }
            } catch (e) {
                await codeExecutionService.executeCode(`echo "❌ Error generating timeline: ${e instanceof Error ? e.message : String(e)}"`, 'bash');
            }
        } else {
            // Terminal fallback using find and sort
            // This is a bit complex to do purely in bash for a nice format, but we can try a simple one
            const command = `
        echo "📅 FORENSIC TIMELINE (Terminal Mode)"
        find "${dirPath}" -maxdepth 1 -not -path '*/.*' -exec stat -f "%Sm | 📝 MODIFIED | %N" -t "%Y-%m-%d %H:%M:%S" {} \\; | sort
        find "${dirPath}" -maxdepth 1 -not -path '*/.*' -exec stat -f "%SB | ✨ CREATED  | %N" -t "%Y-%m-%d %H:%M:%S" {} \\; | sort
      `;
            await codeExecutionService.executeCode(command, 'bash');
        }
    }
}

export const forensicTimelineService = new ForensicTimelineService();
