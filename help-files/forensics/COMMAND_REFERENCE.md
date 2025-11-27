# 🕵️ Forensic Command Reference

This document provides a comprehensive guide to the forensic tools available in RangerPlex. These tools are designed for digital forensics, incident response, and evidence handling.

## 🧬 Hashing & Integrity

### `/hash <file_path> [algorithm] [--copy]`
Calculates the cryptographic hash of a file.
- **Algorithms**: `md5`, `sha1`, `sha256` (default), `sha512`.
- **Flags**: `--copy` (copies the hash to clipboard).
- **Example**: `/hash /bin/ls sha256 --copy`

### `/hash-verify <file_path> <expected_hash>`
Verifies if a file matches a specific hash. Useful for checking file integrity or detecting tampering.
- **Example**: `/hash-verify /bin/ls e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

### `/hash-dir <directory_path>`
Calculates hashes for all files in a directory.
- **Example**: `/hash-dir /var/log`

---

## 📄 Metadata & Analysis

### `/metadata <file_path>`
Displays detailed file system metadata (MAC times, permissions, ownership).
- **Example**: `/metadata /etc/passwd`

### `/exif <image_path>`
Extracts EXIF metadata from image files (JPEG, TIFF).
- **Example**: `/exif /Users/ranger/Photos/evidence.jpg`

### `/timeline <directory_path>`
Generates a chronological timeline of file creation and modification events in a directory.
- **Example**: `/timeline /var/log`

---

## 🔤 String Analysis

### `/strings <file_path> [min_length]`
Extracts printable strings from a binary or data file.
- **Default Min Length**: 4 characters.
- **Example**: `/strings /bin/ls 10`

### `/grep <file_path> <pattern>`
Searches for a specific text pattern within a file.
- **Example**: `/grep /var/log/system.log "error"`

---

## 🔐 Chain of Custody

### `/custody-create <evidence_id> <file_path> <description>`
Initiates a new Chain of Custody log for a piece of evidence.
- **Calculates initial hash automatically.**
- **Example**: `/custody-create CASE-001 /tmp/malware.exe "Suspicious executable found in tmp"`

### `/custody-update <evidence_id> <action> <notes>`
Adds a new event to the Chain of Custody log.
- **Example**: `/custody-update CASE-001 "TRANSFERRED" "Moved to secure USB drive"`

### `/custody-verify <evidence_id> [file_to_check]`
Displays the full Chain of Custody history and optionally verifies the integrity of the current file against the original hash.
- **Example**: `/custody-verify CASE-001 /media/usb/malware.exe`

---

## ⚠️ Legal & Ethical Notice
These tools are powerful and should be used responsibly.
- **Authorization**: Ensure you have permission to analyze files and systems.
- **Privacy**: Respect user privacy and data protection laws.
- **Integrity**: Always maintain a proper Chain of Custody for evidence that may be used in legal proceedings.
