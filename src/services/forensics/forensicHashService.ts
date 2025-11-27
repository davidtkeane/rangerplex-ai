import { codeExecutionService } from '../codeExecutionService';

export class ForensicHashService {
    /**
     * Calculate hash of a file
     */
    async calculateHash(filePath: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'): Promise<string> {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.calculateHash(filePath, algorithm);
                if (typeof result === 'object' && result.error) {
                    throw new Error(result.error);
                }
                return result as string;
            } catch (error) {
                // If Electron API fails (e.g. file not found), throw or return error
                throw error;
            }
        } else {
            // Fallback to terminal command if Electron API is not available
            let command = '';
            switch (algorithm) {
                case 'md5': command = `md5 "${filePath}"`; break;
                case 'sha1': command = `shasum -a 1 "${filePath}"`; break;
                case 'sha256': command = `shasum -a 256 "${filePath}"`; break;
                case 'sha512': command = `shasum -a 512 "${filePath}"`; break;
            }
            await codeExecutionService.executeCode(`echo "🔍 Calculating ${algorithm.toUpperCase()} for: ${filePath}"; ${command}`, 'bash');
            return 'Command sent to terminal';
        }
    }

    /**
     * Verify hash of a file
     */
    async verifyHash(filePath: string, expectedHash: string): Promise<boolean> {
        let algo: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256';
        if (expectedHash.length === 32) algo = 'md5';
        else if (expectedHash.length === 40) algo = 'sha1';
        else if (expectedHash.length === 64) algo = 'sha256';
        else if (expectedHash.length === 128) algo = 'sha512';

        if (window.electronAPI) {
            try {
                const calculated = await this.calculateHash(filePath, algo);
                const match = calculated === expectedHash;
                // Output result to terminal for visibility
                const icon = match ? '✅' : '❌';
                const msg = match ? `Hash MATCH: ${filePath}` : `Hash MISMATCH! Expected: ${expectedHash}, Actual: ${calculated}`;
                await codeExecutionService.executeCode(`echo "${icon} ${msg}"`, 'bash');
                return match;
            } catch (e) {
                await codeExecutionService.executeCode(`echo "❌ Error verifying hash: ${e instanceof Error ? e.message : String(e)}"`, 'bash');
                return false;
            }
        } else {
            // Terminal fallback
            const command = `
        CURRENT_HASH=$(${algo === 'md5' ? 'md5 -q' : `shasum -a ${algo === 'sha1' ? 1 : (algo === 'sha256' ? 256 : 512)}`} "${filePath}" | awk '{print $1}')
        if [ "$CURRENT_HASH" = "${expectedHash}" ]; then
          echo "✅ Hash MATCH: ${filePath}"
        else
          echo "❌ Hash MISMATCH!"
          echo "Expected: ${expectedHash}"
          echo "Actual:   $CURRENT_HASH"
        fi
      `;
            await codeExecutionService.executeCode(command, 'bash');
            return true;
        }
    }

    /**
     * Hash all files in a directory
     */
    async hashDirectory(dirPath: string): Promise<void> {
        if (window.electronAPI) {
            try {
                const files = await window.electronAPI.fsReadDir(dirPath);
                if (Array.isArray(files)) {
                    await codeExecutionService.executeCode(`echo "📂 Hashing directory: ${dirPath}"`, 'bash');

                    for (const file of files) {
                        if (!file.isDirectory) {
                            try {
                                const hash = await this.calculateHash(file.path, 'sha256');
                                await codeExecutionService.executeCode(`echo "  📄 ${file.name}: ${hash}"`, 'bash');
                            } catch (e) {
                                await codeExecutionService.executeCode(`echo "  ⚠️ Error hashing ${file.name}"`, 'bash');
                            }
                        }
                    }
                    await codeExecutionService.executeCode(`echo "✅ Directory hash complete."`, 'bash');
                } else {
                    await codeExecutionService.executeCode(`echo "❌ Failed to read directory: ${dirPath}"`, 'bash');
                }
            } catch (e) {
                await codeExecutionService.executeCode(`echo "❌ Error: ${e instanceof Error ? e.message : String(e)}"`, 'bash');
            }
        } else {
            const command = `find "${dirPath}" -type f -exec shasum -a 256 {} \\;`;
            await codeExecutionService.executeCode(`echo "📂 Hashing directory: ${dirPath}"; ${command}`, 'bash');
        }
    }
}

export const forensicHashService = new ForensicHashService();
