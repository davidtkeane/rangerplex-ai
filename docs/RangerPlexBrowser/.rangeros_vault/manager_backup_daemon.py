#!/usr/bin/env python3
"""
Automatic Manager Backup Daemon
Runs in background and backs up manager databases every 10 minutes
"""

import shutil
import sqlite3
import time
from datetime import datetime
from pathlib import Path

def backup_managers():
    """Backup all manager databases"""
    
    vault_path = Path("/Users/ranger/.rangeros_vault")
    backup_dir = vault_path / "manager_backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    managers = {
        "Dave": "basement_it_manager_memories.sqlite3",
        "Maire": "cloakroom_manager_memories.sqlite3", 
        "Seamus": "restaurant_memory_chef.sqlite3",
        "Declan": "dj_cosmic_memories.sqlite3",
        "Terry": "terminal_manager_memories.sqlite3",
        "Paddy": "gaming_browser_manager_memories.sqlite3",
        "Roisin": "ai_communications_manager_memories.sqlite3",
        "RangerBot": "rangerbot_manager_memories.sqlite3",
        "IR": "ir_security_guard_memories.sqlite3",
        "Professor_Bridget": "professor_bridget_memories.sqlite3"
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for manager_name, db_file in managers.items():
        source_db = vault_path / db_file
        
        if source_db.exists():
            try:
                # Timestamped backup
                backup_file = backup_dir / f"{manager_name}_{db_file}_{timestamp}"
                shutil.copy2(source_db, backup_file)
                
                # Latest backup
                latest_file = backup_dir / f"{manager_name}_latest_{db_file}"
                shutil.copy2(source_db, latest_file)
                
                print(f"✅ {manager_name}: Backed up ({source_db.stat().st_size / 1024:.1f}KB)")
                
            except Exception as e:
                print(f"❌ {manager_name}: Backup failed - {e}")

def main():
    """Run continuous backup daemon"""
    
    print("🏢 Manager Backup Daemon Starting...")
    print("🔄 Backing up manager personalities every 10 minutes")
    
    while True:
        try:
            backup_managers()
            time.sleep(600)  # 10 minutes
        except KeyboardInterrupt:
            print("\n🛑 Manager backup daemon stopping...")
            break

if __name__ == "__main__":
    main()
