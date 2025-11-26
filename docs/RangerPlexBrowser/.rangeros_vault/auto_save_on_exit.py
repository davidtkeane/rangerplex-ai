#!/usr/bin/env python3
"""Auto-save process state when applications exit"""

import json
import psutil
from datetime import datetime
from pathlib import Path

def save_current_state():
    """Save current state when any important app exits"""
    
    vault_path = Path("/Users/ranger/.rangeros_vault")
    
    # Get current processes
    important_processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
        try:
            if any(app in ' '.join(proc.info['cmdline'] or []).lower() 
                   for app in ['rangeros', 'iterm', 'cool-retro-term']):
                important_processes.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "cmdline": proc.info['cmdline'],
                    "cwd": proc.info['cwd']
                })
        except:
            continue
    
    # Save exit state
    exit_state = {
        "exit_time": datetime.now().isoformat(),
        "processes": important_processes,
        "reason": "application_exit_detected"
    }
    
    exit_file = vault_path / f"exit_state_{datetime.now().strftime('%H%M%S')}.json"
    with open(exit_file, 'w') as f:
        json.dump(exit_state, f, indent=2)
    
    print(f"💾 Exit state saved: {len(important_processes)} processes")

if __name__ == "__main__":
    save_current_state()
