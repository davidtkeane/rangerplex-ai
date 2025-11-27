import { forensicHashService } from '../services/forensics/forensicHashService';
import { forensicMetadataService } from '../services/forensics/forensicMetadataService';
import { forensicTimelineService } from '../services/forensics/forensicTimelineService';
import { forensicStringsService } from '../services/forensics/forensicStringsService';
import { chainOfCustodyService } from '../services/forensics/chainOfCustodyService';
import { codeExecutionService } from '../services/codeExecutionService';

export class ForensicCommandHandler {
    async handleCommand(command: string): Promise<boolean> {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);
        const flags = args.filter(a => a.startsWith('--'));
        const cleanArgs = args.filter(a => !a.startsWith('--'));

        switch (cmd) {
            case '/hash':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /hash <file_path> [algorithm] [--copy]"', 'bash');
                    return true;
                }
                const algo = cleanArgs[1] as 'md5' | 'sha1' | 'sha256' | 'sha512' || 'sha256';
                const result = await forensicHashService.calculateHash(cleanArgs[0], algo);

                if (result !== 'Command sent to terminal') {
                    await codeExecutionService.executeCode(`echo "🔍 ${algo.toUpperCase()}: ${result}  (${cleanArgs[0]})"`, 'bash');

                    if (flags.includes('--copy')) {
                        try {
                            await navigator.clipboard.writeText(result);
                            await codeExecutionService.executeCode('echo "📋 Hash copied to clipboard!"', 'bash');
                        } catch (e) {
                            await codeExecutionService.executeCode('echo "⚠️ Failed to copy to clipboard"', 'bash');
                        }
                    }
                }
                return true;

            case '/hash-verify':
                if (cleanArgs.length < 2) {
                    await codeExecutionService.executeCode('echo "Usage: /hash-verify <file_path> <expected_hash>"', 'bash');
                    return true;
                }
                await forensicHashService.verifyHash(cleanArgs[0], cleanArgs[1]);
                return true;

            case '/hash-dir':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /hash-dir <directory_path>"', 'bash');
                    return true;
                }
                await forensicHashService.hashDirectory(cleanArgs[0]);
                return true;

            case '/metadata':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /metadata <file_path>"', 'bash');
                    return true;
                }
                await forensicMetadataService.displayMetadata(cleanArgs[0]);
                return true;

            case '/exif':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /exif <image_path>"', 'bash');
                    return true;
                }
                await forensicMetadataService.displayExif(cleanArgs[0]);
                return true;

            case '/timeline':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /timeline <directory_path>"', 'bash');
                    return true;
                }
                await forensicTimelineService.generateTimeline(cleanArgs[0]);
                return true;

            case '/strings':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /strings <file_path> [min_length]"', 'bash');
                    return true;
                }
                const minLen = cleanArgs[1] ? parseInt(cleanArgs[1]) : 4;
                await forensicStringsService.extractStrings(cleanArgs[0], minLen);
                return true;

            case '/grep':
            case '/grep-file':
                if (cleanArgs.length < 2) {
                    await codeExecutionService.executeCode('echo "Usage: /grep <file_path> <pattern>"', 'bash');
                    return true;
                }
                await forensicStringsService.grepFile(cleanArgs[0], cleanArgs[1]);
                return true;

            case '/custody-create':
                if (cleanArgs.length < 3) {
                    await codeExecutionService.executeCode('echo "Usage: /custody-create <evidence_id> <file_path> <description>"', 'bash');
                    return true;
                }
                // Join remaining args for description
                const desc = cleanArgs.slice(2).join(' ');
                await chainOfCustodyService.createChain(cleanArgs[0], cleanArgs[1], desc, 'Ranger (User)');
                return true;

            case '/custody-update':
                if (cleanArgs.length < 3) {
                    await codeExecutionService.executeCode('echo "Usage: /custody-update <evidence_id> <action> <notes>"', 'bash');
                    return true;
                }
                const notes = cleanArgs.slice(2).join(' ');
                await chainOfCustodyService.updateChain(cleanArgs[0], cleanArgs[1], 'Ranger (User)', notes);
                return true;

            case '/custody-verify':
                if (cleanArgs.length < 1) {
                    await codeExecutionService.executeCode('echo "Usage: /custody-verify <evidence_id> [file_to_check]"', 'bash');
                    return true;
                }
                await chainOfCustodyService.verifyChain(cleanArgs[0], cleanArgs[1]);
                return true;

            default:
                return false;
        }
    }
}

export const forensicCommandHandler = new ForensicCommandHandler();
