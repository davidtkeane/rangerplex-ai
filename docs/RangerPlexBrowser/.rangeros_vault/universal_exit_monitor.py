#!/usr/bin/env python3
"""
Universal Exit Monitor
Monitors for any important app closing and auto-saves everything
"""

import json
import psutil
import subprocess
import time
from datetime import datetime
from pathlib import Path

class UniversalExitMonitor:
    """Monitor for any important app closing"""
    
    def __init__(self):
        self.vault_path = Path("/Users/ranger/.rangeros_vault")
        self.rangeros_dir = Path("/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS")
        self.important_apps = ["rangeros", "iterm", "code", "chrome", "cool-retro-term"]
        self.last_app_count = {}
        
    def monitor_app_exits(self):
        """Continuously monitor for app exits"""
        
        while True:
            current_apps = {}
            
            # Count current important apps
            for proc in psutil.process_iter(['name', 'cmdline']):
                try:
                    proc_name = proc.info['name'].lower()
                    proc_cmd = ' '.join(proc.info['cmdline'] or []).lower()
                    
                    for app in self.important_apps:
                        if app in proc_name or app in proc_cmd:
                            current_apps[app] = current_apps.get(app, 0) + 1
                except:
                    continue
            
            # Check for app exits (count decreased)
            for app, count in self.last_app_count.items():
                current_count = current_apps.get(app, 0)
                if current_count < count:
                    print(f"🚨 {app.upper()} EXIT DETECTED - Triggering auto-save")
                    self.trigger_complete_save(app)
            
            self.last_app_count = current_apps
            time.sleep(10)  # Check every 10 seconds
    
    def trigger_complete_save(self, exited_app):
        """Trigger complete save when important app exits"""
        
        save_script = self.rangeros_dir / "complete_save_on_exit_system.py"
        if save_script.exists():
            subprocess.run(["python3", str(save_script)], cwd=str(self.rangeros_dir))
            
            # Log the auto-save
            auto_save_log = self.vault_path / "auto_save_log.json"
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "trigger_app": exited_app,
                "save_reason": "automatic_app_exit_detection",
                "auto_save_completed": True
            }
            
            # Append to log
            if auto_save_log.exists():
                with open(auto_save_log, 'r') as f:
                    log_data = json.load(f)
            else:
                log_data = {"auto_saves": []}
            
            log_data["auto_saves"].append(log_entry)
            
            with open(auto_save_log, 'w') as f:
                json.dump(log_data, f, indent=2)

if __name__ == "__main__":
    monitor = UniversalExitMonitor()
    monitor.monitor_app_exits()
