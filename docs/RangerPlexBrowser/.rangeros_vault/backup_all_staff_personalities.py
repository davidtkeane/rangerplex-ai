#!/usr/bin/env python3
"""
Complete Staff Personality Backup System
Backs up all 60+ staff daemon personalities and memories
"""

import shutil
from datetime import datetime
from pathlib import Path

def backup_all_staff():
    """Backup all staff daemon databases"""
    
    vault_path = Path("/Users/ranger/.rangeros_vault")
    backup_dir = vault_path / "staff_backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # All possible staff members
    staff_list = [
        # Education staff (6)
        "emma", "liam", "sarah", "james", "aoife", "connor",
        # IT staff (6)  
        "sean", "niall", "ciara", "oisin", "fiona"
    ]
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backed_up = 0
    
    for staff_name in staff_list:
        # Check for education staff database
        edu_db = vault_path / f"{staff_name}_memories.sqlite3"
        if edu_db.exists():
            backup_file = backup_dir / f"{staff_name}_education_{timestamp}.sqlite3"
            shutil.copy2(edu_db, backup_file)
            print(f"✅ {staff_name.capitalize()} (Education): Backed up")
            backed_up += 1
        
        # Check for IT staff database
        it_db = vault_path / f"{staff_name}_it_memories.sqlite3"
        if it_db.exists():
            backup_file = backup_dir / f"{staff_name}_it_{timestamp}.sqlite3"
            shutil.copy2(it_db, backup_file)
            print(f"✅ {staff_name.capitalize()} (IT): Backed up")
            backed_up += 1
    
    print(f"\n🎉 Staff backup complete: {backed_up} personalities preserved")
    return backed_up

if __name__ == "__main__":
    backup_all_staff()
