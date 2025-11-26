#!/usr/bin/env python3
"""
Symbiotic Ecosystem Backup
Everything saves everything else - ultimate redundancy
"""

import json
import shutil
import time
from datetime import datetime
from pathlib import Path

class SymbioticBackup:
    """Every component backs up every other component"""
    
    def __init__(self):
        self.vault_path = Path("/Users/ranger/.rangeros_vault")
        self.symbiotic_dir = self.vault_path / "symbiotic_backups"
        self.symbiotic_dir.mkdir(parents=True, exist_ok=True)
    
    def cross_component_backup(self):
        """Each component saves all others"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # List of all important files to cross-backup
        critical_files = [
            "current_phantom_processes.json",
            "current_live_state.json", 
            "session.json",
            "*manager*memories.sqlite3",
            "*staff*memories.sqlite3"
        ]
        
        # Create cross-backup matrix
        for source_file in self.vault_path.glob("*.json"):
            if source_file.exists():
                # Each file backs up all others
                source_backup_dir = self.symbiotic_dir / source_file.stem
                source_backup_dir.mkdir(parents=True, exist_ok=True)
                
                # Backup all other critical files
                for pattern in critical_files:
                    for target_file in self.vault_path.glob(pattern):
                        if target_file != source_file and target_file.exists():
                            backup_name = f"{target_file.name}_{timestamp}"
                            backup_path = source_backup_dir / backup_name
                            
                            try:
                                shutil.copy2(target_file, backup_path)
                            except:
                                pass

if __name__ == "__main__":
    symbiotic = SymbioticBackup()
    symbiotic.cross_component_backup()
