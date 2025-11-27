import { codeExecutionService } from '../codeExecutionService';
// @ts-ignore
import { create } from 'exif-parser';

export interface FileMetadata {
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isFile: boolean;
    isDirectory: boolean;
    permissions: string;
    owner: number;
    group: number;
}

export interface ExifData {
    tags: any;
    imageSize: { width: number; height: number };
    thumbnailOffset?: number;
    thumbnailLength?: number;
    thumbnailType?: number;
    app1Offset?: number;
}

export class ForensicMetadataService {
    /**
     * Get file metadata (stat)
     */
    async getMetadata(filePath: string): Promise<FileMetadata | null> {
        if (window.electronAPI) {
            try {
                const stats = await window.electronAPI.fsStat(filePath);
                if (stats.error) throw new Error(stats.error);

                return {
                    size: stats.size,
                    created: new Date(stats.birthtime),
                    modified: new Date(stats.mtime),
                    accessed: new Date(stats.atime),
                    isFile: stats.isFile,
                    isDirectory: stats.isDirectory,
                    permissions: stats.mode.toString(8), // Octal
                    owner: stats.uid,
                    group: stats.gid
                };
            } catch (error) {
                await codeExecutionService.executeCode(`echo "❌ Error getting metadata: ${error instanceof Error ? error.message : String(error)}"`, 'bash');
                return null;
            }
        } else {
            // Terminal fallback (basic)
            // We can't easily return structured data from terminal execution without parsing stdout
            // So we'll just print it to terminal
            await codeExecutionService.executeCode(`ls -la "${filePath}" && stat "${filePath}"`, 'bash');
            return null;
        }
    }

    /**
     * Extract EXIF data from image
     */
    async getExifData(filePath: string): Promise<ExifData | null> {
        if (window.electronAPI) {
            try {
                // Read first 64KB (usually enough for EXIF)
                const buffer = await window.electronAPI.fsReadBuffer(filePath, 65536);

                if ('error' in buffer) {
                    throw new Error((buffer as any).error);
                }

                // Convert Uint8Array to Buffer for exif-parser
                // exif-parser expects a Node Buffer or ArrayBuffer. Uint8Array is compatible with ArrayBuffer.
                const parser = create(buffer.buffer as ArrayBuffer);
                const result = parser.parse();

                return {
                    tags: result.tags,
                    imageSize: result.imageSize,
                    thumbnailOffset: result.thumbnailOffset,
                    thumbnailLength: result.thumbnailLength,
                    thumbnailType: result.thumbnailType,
                    app1Offset: result.app1Offset
                };

            } catch (error) {
                await codeExecutionService.executeCode(`echo "⚠️ EXIF Extraction failed or no EXIF data found: ${error instanceof Error ? error.message : String(error)}"`, 'bash');
                return null;
            }
        } else {
            // Fallback to exiftool if available
            await codeExecutionService.executeCode(`exiftool "${filePath}" || echo "exiftool not installed"`, 'bash');
            return null;
        }
    }

    /**
     * Display metadata in terminal
     */
    async displayMetadata(filePath: string): Promise<void> {
        const meta = await this.getMetadata(filePath);
        if (meta) {
            let output = `
📄 FILE METADATA
================
File: ${filePath}
Size: ${this.formatBytes(meta.size)}
Type: ${meta.isDirectory ? 'Directory' : 'File'}
Created:  ${meta.created.toLocaleString()}
Modified: ${meta.modified.toLocaleString()}
Accessed: ${meta.accessed.toLocaleString()}
Perms:    ${meta.permissions}
UID/GID:  ${meta.owner}/${meta.group}
`;
            await codeExecutionService.executeCode(`echo "${output}"`, 'bash');
        }
    }

    /**
     * Display EXIF in terminal
     */
    async displayExif(filePath: string): Promise<void> {
        const exif = await this.getExifData(filePath);
        if (exif) {
            let output = `
📸 EXIF DATA
============
File: ${filePath}
Size: ${exif.imageSize.width}x${exif.imageSize.height}
`;
            if (exif.tags) {
                for (const [key, value] of Object.entries(exif.tags)) {
                    output += `${key}: ${value}\n`;
                }
            }
            await codeExecutionService.executeCode(`echo "${output}"`, 'bash');
        }
    }

    private formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}

export const forensicMetadataService = new ForensicMetadataService();
