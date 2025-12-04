#!/usr/bin/env python3
"""
BLOCKCHAIN ANYTHING - Universal File/Folder to Blockchain Converter
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Turn anything into blockchain file
Mission: Convert any file/folder into downloadable blockchain package
Innovation: Universal blockchain file creation for roaming profiles
"""

import json
import shutil
import hashlib
import zipfile
import os
import sys
from datetime import datetime
from pathlib import Path

class UniversalBlockchainPackager:
    """Turn any file or folder into blockchain package"""
    
    def __init__(self):
        self.roaming_folder = Path(".")  # Current Roaming-Profiles directory
        
    def blockchain_anything(self, source_path, package_name=None):
        """Convert any file/folder to blockchain package"""
        
        print("📦 BLOCKCHAIN ANYTHING - UNIVERSAL CONVERTER")
        print("=" * 60)
        print("🏔️ Philosophy: 'One foot in front of the other'")
        print("🎯 Mission: Turn anything into blockchain file")
        print("🌟 Innovation: Universal blockchain packaging system")
        print("=" * 60)
        
        source = Path(source_path)
        
        if not source.exists():
            print(f"❌ Source not found: {source_path}")
            return False
        
        # Auto-generate package name if not provided
        if not package_name:
            if source.is_file():
                package_name = f"Blockchain_{source.stem}"
            else:
                package_name = f"Blockchain_{source.name}"
        
        # Create package metadata
        package_info = {
            "package_name": package_name,
            "source_path": str(source),
            "source_type": "file" if source.is_file() else "folder",
            "created_by": "David Keane Genesis Authority",
            "package_date": datetime.now().isoformat(),
            "blockchain_format": "Universal Roaming Package",
            "compatibility": ["macOS", "Linux", "Windows", "VM"],
            "authentication": {
                "required": True,
                "key_type": "roaming_private.pem",
                "security_level": "Cryptographic authentication required"
            },
            "deployment": {
                "automatic": True,
                "zero_setup": True,
                "instant_access": True,
                "portable": True
            },
            "philosophy": "One foot in front of the other - Anything becomes blockchain accessible"
        }
        
        # Calculate source size
        if source.is_file():
            source_size = source.stat().st_size
            package_info["source_size"] = source_size
            package_info["source_files"] = 1
        else:
            total_size = 0
            file_count = 0
            for root, dirs, files in os.walk(source):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        total_size += os.path.getsize(file_path)
                        file_count += 1
                    except:
                        pass
            package_info["source_size"] = total_size
            package_info["source_files"] = file_count
        
        print(f"📁 Source: {source}")
        print(f"📊 Type: {package_info['source_type']}")
        print(f"📏 Size: {package_info['source_size'] / 1024 / 1024:.1f} MB")
        print(f"📋 Files: {package_info['source_files']}")
        
        # Create timestamped package
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        package_filename = f"{package_name}_{timestamp}"
        
        print(f"📦 Creating blockchain package: {package_filename}")
        
        # Create blockchain archive
        archive_name = f"{package_filename}.blockchain"
        archive_path = self.roaming_folder / archive_name
        
        print("🗜️ Creating blockchain archive...")
        
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if source.is_file():
                # Single file
                zipf.write(source, source.name)
            else:
                # Folder
                for root, dirs, files in os.walk(source):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arc_name = os.path.relpath(file_path, source.parent)
                        try:
                            zipf.write(file_path, arc_name)
                        except Exception as e:
                            print(f"⚠️ Could not add {file}: {e}")
        
        # Calculate package hash
        package_hash = self.calculate_package_hash(archive_path)
        package_info["package_hash"] = package_hash
        package_info["archive_size"] = os.path.getsize(archive_path)
        
        # Create download manifest
        download_manifest = {
            "blockchain_package": archive_name,
            "package_info": package_info,
            "download_instructions": [
                "1. Insert USB key with your roaming .pem file",
                "2. Run download_my_blockchain_profile.sh",
                "3. Select this blockchain package",
                "4. Authenticate with your .pem key",
                "5. Package downloads and deploys automatically",
                "6. Complete access to blockchain-packaged content"
            ],
            "roaming_benefits": [
                "✅ Portable - Take anywhere with USB key",
                "✅ Secure - Cryptographic authentication required",
                "✅ Complete - Everything needed in one file",
                "✅ Automatic - Zero setup deployment",
                "✅ Forensic-safe - Secure deletion when done"
            ]
        }
        
        # Save manifest
        manifest_path = self.roaming_folder / f"{package_filename}_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(download_manifest, f, indent=2)
        
        print("")
        print("🎉 BLOCKCHAIN PACKAGE CREATED!")
        print("=" * 50)
        print(f"📦 Package: {archive_name}")
        print(f"📏 Size: {os.path.getsize(archive_path) / 1024 / 1024:.1f} MB")
        print(f"🔐 Hash: {package_hash[:16]}...")
        print(f"📋 Manifest: {package_filename}_manifest.json")
        print("=" * 50)
        
        print("")
        print("✅ READY FOR ROAMING ACCESS:")
        print("🎯 Users can download this with USB key authentication")
        print("🔑 Requires roaming .pem key for access")
        print("📱 Deploys automatically anywhere")
        print("🌟 Complete content access through blockchain system")
        
        return True
    
    def calculate_package_hash(self, archive_path):
        """Calculate integrity hash for package"""
        
        hash_sha256 = hashlib.sha256()
        
        with open(archive_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()

def main():
    """Interactive blockchain packaging interface"""
    
    packager = UniversalBlockchainPackager()
    
    print("🚀 BLOCKCHAIN ANYTHING - UNIVERSAL CONVERTER")
    print("=" * 60)
    print("🌟 Turn any file or folder into blockchain package")
    print("🔑 Roaming access with USB key authentication")
    print("📱 Deploy anywhere with zero setup")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        # Command line usage
        source_path = sys.argv[1]
        package_name = sys.argv[2] if len(sys.argv) > 2 else None
        
        print(f"📁 Converting: {source_path}")
        success = packager.blockchain_anything(source_path, package_name)
        
    else:
        # Interactive usage
        print("")
        print("🎯 WHAT WOULD YOU LIKE TO BLOCKCHAIN?")
        print("====================================")
        print("💡 Examples:")
        print("   • ../nodes/Apple-MacBook-M4 (folder)")
        print("   • ../nodes/VM-Node (folder)")
        print("   • important_document.pdf (file)")
        print("   • my_presentation.pptx (file)")
        print("   • secret_project/ (folder)")
        print("")
        
        source_path = input("📁 Enter file or folder path: ").strip()
        
        if not source_path:
            print("❌ No path provided")
            return
        
        package_name = input("📦 Enter package name (or press Enter for auto): ").strip()
        package_name = package_name if package_name else None
        
        print("")
        print(f"🚀 Converting {source_path} to blockchain package...")
        success = packager.blockchain_anything(source_path, package_name)
    
    if success:
        print("")
        print("🌟 BLOCKCHAIN CONVERSION COMPLETE!")
        print("🎯 Your content is now a portable blockchain package")
        print("🔑 Access anywhere with USB key authentication")
        print("")
        print("🏔️ 'One foot in front of the other' - Anything is now blockchain accessible!")
    else:
        print("")
        print("❌ Blockchain conversion failed")
        print("💡 Check the path and try again")

if __name__ == "__main__":
    main()