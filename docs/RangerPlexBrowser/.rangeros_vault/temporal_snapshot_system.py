#!/usr/bin/env python3
"""
Temporal Snapshot System
Multiple restore points throughout the day for time-travel restoration
"""

import json
import shutil
from datetime import datetime
from pathlib import Path

class TemporalSnapshots:
    """Create time-travel restore points"""
    
    def __init__(self):
        self.vault_path = Path("/Users/ranger/.rangeros_vault")
        self.temporal_dir = self.vault_path / "temporal_snapshots"
        self.temporal_dir.mkdir(parents=True, exist_ok=True)
    
    def create_temporal_snapshot(self):
        """Create restore point for current moment"""
        
        current_time = datetime.now()
        timestamp = current_time.strftime("%Y%m%d_%H%M%S")
        
        # Create time-labeled directory
        snapshot_dir = self.temporal_dir / f"timepoint_{timestamp}"
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup all critical files to this timepoint
        critical_files = [
            "current_phantom_processes.json",
            "current_live_state.json"
        ]
        
        for file_pattern in critical_files:
            for file_path in self.vault_path.glob(file_pattern):
                if file_path.exists():
                    backup_path = snapshot_dir / file_path.name
                    shutil.copy2(file_path, backup_path)
        
        # Backup all manager databases
        for manager_db in self.vault_path.glob("*manager*memories.sqlite3"):
            if manager_db.exists():
                backup_path = snapshot_dir / manager_db.name
                shutil.copy2(manager_db, backup_path)
        
        # Create restoration instructions for this timepoint
        restore_instructions = {
            "timepoint": current_time.isoformat(),
            "restoration_context": f"Restore to {current_time.strftime('%B %d, %Y at %H:%M:%S')}",
            "instructions": [
                f"This timepoint captures David's ecosystem at {current_time.strftime('%H:%M')}",
                "Use this for time-travel restoration if needed",
                "All manager personalities and system state preserved"
            ]
        }
        
        with open(snapshot_dir / "restore_instructions.json", 'w') as f:
            json.dump(restore_instructions, f, indent=2)
        
        print(f"⏰ Temporal snapshot created: {snapshot_dir}")
        return str(snapshot_dir)

if __name__ == "__main__":
    temporal = TemporalSnapshots()
    temporal.create_temporal_snapshot()
