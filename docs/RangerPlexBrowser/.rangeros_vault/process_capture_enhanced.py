#!/usr/bin/env python3
"""
RangerOS Enhanced Process Capture System
Captures current running processes during shutdown for accurate phantom restoration
Author: David Keane with Claude Code - September 2025
"""

import os
import json
import time
import subprocess
import psutil
from datetime import datetime

class RangerOSProcessCapture:
    """Captures and saves current RangerOS processes for persistence restoration"""
    
    def __init__(self):
        self.vault_dir = "/Users/ranger/.rangeros_vault"
        self.snapshots_dir = os.path.join(self.vault_dir, "process_snapshots")
        self.current_snapshot_file = os.path.join(self.vault_dir, "current_phantom_processes.json")
        self.process_history_file = os.path.join(self.vault_dir, "process_restoration_history.json")
        
        # Ensure directories exist
        os.makedirs(self.snapshots_dir, exist_ok=True)
        os.makedirs(self.vault_dir, exist_ok=True)
    
    def capture_current_processes(self, reason="shutdown", triggered_by="rangeros_browser"):
        """Capture all current RangerOS-related processes with full details"""
        
        print("👻 RangerOS Process Capture System")
        print("===================================")
        print(f"📸 Reason: {reason}")
        print(f"🎯 Triggered by: {triggered_by}")
        print("")
        
        timestamp = datetime.now().isoformat()
        snapshot_id = f"snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Define RangerOS process patterns
        rangeros_patterns = [
            "rangeros_browser_v2.py",
            "restaurant_manager_living.py.*--daemon",
            "dj_manager_living.py.*--daemon", 
            "terminal_supervisor_living.py.*--daemon",
            "rangerbot_ollama_direct.py",
            "universal_ai_proxy.py",
            "browserpad_database.py",
            "vlc_database_api.py",
            "cors_web_server.py",
            "vlc_media_server.py",
            "mcp_server_api.py",
            "display_traffic_controller.py",
            "mcp_sleep_controller.py",
            "container_terminal_api.py",
            "code-server.*127.0.0.1:808",
            r"Google Chrome.*shared_profile|work_profile",
            "QtWebEngineProcess",
            "php.*wordpress",
            "node.*server.js.*Sticky_Notes"
        ]
        
        captured_processes = []
        total_memory_kb = 0
        
        print("🔍 Scanning for RangerOS processes...")
        
        # Get all running processes
        try:
            all_processes = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            process_lines = all_processes.stdout.strip().split('\n')[1:]  # Skip header
            
            for line in process_lines:
                parts = line.split()
                if len(parts) >= 11:
                    user = parts[0]
                    pid = int(parts[1])
                    cpu_percent = parts[2]
                    memory_kb = int(parts[5])
                    full_command = ' '.join(parts[10:])
                    
                    # Check if this matches any RangerOS pattern
                    is_rangeros_process = False
                    matched_pattern = None
                    
                    for pattern in rangeros_patterns:
                        if self._matches_pattern(full_command, pattern):
                            is_rangeros_process = True
                            matched_pattern = pattern
                            break
                    
                    if is_rangeros_process:
                        try:
                            # Get additional process details using psutil
                            proc = psutil.Process(pid)
                            
                            process_info = {
                                "pid": pid,
                                "user": user,
                                "cpu_percent": cpu_percent,
                                "memory_kb": memory_kb,
                                "memory_mb": round(memory_kb / 1024, 1),
                                "command": full_command,
                                "matched_pattern": matched_pattern,
                                "process_name": proc.name(),
                                "status": proc.status(),
                                "create_time": proc.create_time(),
                                "cwd": proc.cwd() if proc.cwd() else "unknown",
                                "cmdline": proc.cmdline(),
                                "connections": self._get_network_connections(proc),
                                "threads": proc.num_threads(),
                                "memory_percent": proc.memory_percent(),
                                "capture_time": timestamp,
                                "survival_priority": self._get_survival_priority(full_command),
                                "daemon_status": "--daemon" in full_command,
                                "phantom_candidate": memory_kb > 50000 or "--daemon" in full_command
                            }
                            
                            captured_processes.append(process_info)
                            total_memory_kb += memory_kb
                            
                            # Display captured process
                            phantom_indicator = "👻" if process_info["phantom_candidate"] else "🔧"
                            daemon_indicator = "🛡️" if process_info["daemon_status"] else ""
                            
                            print(f"   {phantom_indicator}{daemon_indicator} PID {pid}: {proc.name()} ({memory_kb}KB)")
                            print(f"       📂 Pattern: {matched_pattern}")
                            print(f"       ⚡ Priority: {process_info['survival_priority']}")
                            
                        except (psutil.NoSuchProcess, psutil.AccessDenied, PermissionError) as e:
                            # Process may have died or we lack permissions
                            print(f"   ⚠️ Could not access PID {pid}: {e}")
        
        except Exception as e:
            print(f"❌ Error during process capture: {e}")
            return None
        
        # Create snapshot record
        snapshot_data = {
            "snapshot_id": snapshot_id,
            "capture_time": timestamp,
            "reason": reason,
            "triggered_by": triggered_by,
            "total_processes": len(captured_processes),
            "total_memory_kb": total_memory_kb,
            "total_memory_mb": round(total_memory_kb / 1024, 1),
            "phantom_processes": len([p for p in captured_processes if p["phantom_candidate"]]),
            "daemon_processes": len([p for p in captured_processes if p["daemon_status"]]),
            "screenshot_reference": "Screenshot 2025-09-07 at 07.50.36 (623.9MB phantom persistence)",
            "irish_management_team": {
                "seamus_present": any("restaurant_manager_living.py" in p["command"] for p in captured_processes),
                "declan_present": any("dj_manager_living.py" in p["command"] for p in captured_processes),
                "terry_present": any("terminal_supervisor_living.py" in p["command"] for p in captured_processes)
            },
            "processes": captured_processes,
            "restoration_script": "/Users/ranger/.rangeros_vault/restore_phantom_processes_enhanced.sh",
            "zshrc_commands": "Available via ~/.zshrc rangeros-restore functions"
        }
        
        # Save to timestamped snapshot file
        snapshot_file = os.path.join(self.snapshots_dir, f"{snapshot_id}.json")
        with open(snapshot_file, 'w') as f:
            json.dump(snapshot_data, f, indent=2)
        
        # Update current snapshot (used by restoration script)
        with open(self.current_snapshot_file, 'w') as f:
            json.dump(snapshot_data, f, indent=2)
        
        # Add to history
        self._add_to_history(snapshot_data)
        
        print("")
        print("✅ Process Capture Complete!")
        print(f"📊 Captured {len(captured_processes)} RangerOS processes")
        print(f"💾 Total Memory: {total_memory_kb}KB ({round(total_memory_kb/1024, 1)}MB)")
        print(f"👻 Phantom Candidates: {len([p for p in captured_processes if p['phantom_candidate']])}")
        print(f"🛡️ Daemon Processes: {len([p for p in captured_processes if p['daemon_status']])}")
        print("")
        print("☘️ Irish Management Team Status:")
        print(f"   🏠 Seamus (Ground Floor): {'✅ Present' if snapshot_data['irish_management_team']['seamus_present'] else '❌ Missing'}")
        print(f"   🎵 Declan (1st Floor): {'✅ Present' if snapshot_data['irish_management_team']['declan_present'] else '❌ Missing'}")
        print(f"   🖥️ Terry (2nd Floor): {'✅ Present' if snapshot_data['irish_management_team']['terry_present'] else '❌ Missing'}")
        print("")
        print(f"💾 Snapshot saved: {snapshot_file}")
        print(f"🔄 Current state: {self.current_snapshot_file}")
        print("")
        print("🎯 Next Steps:")
        print("   1. After macOS restart, run: restore-rangeros")
        print("   2. Or use: rangeros-restore smart")
        print("   3. Check status: rangeros-phantom-status")
        
        return snapshot_data
    
    def _matches_pattern(self, command, pattern):
        """Check if command matches the given pattern"""
        import re
        try:
            return bool(re.search(pattern, command))
        except:
            return pattern in command
    
    def _get_network_connections(self, proc):
        """Get network connections for a process"""
        try:
            connections = []
            for conn in proc.connections():
                if conn.status == 'LISTEN':
                    connections.append({
                        'local_port': conn.laddr.port,
                        'status': conn.status
                    })
            return connections
        except:
            return []
    
    def _get_survival_priority(self, command):
        """Determine process survival priority for phantom restoration"""
        if any(daemon in command for daemon in ["restaurant_manager_living.py", "dj_manager_living.py", "terminal_supervisor_living.py"]):
            return "CRITICAL-IRISH-MANAGEMENT"
        elif "rangeros_browser_v2.py" in command:
            return "CRITICAL-CORE"
        elif any(ai in command for ai in ["rangerbot_ollama", "universal_ai_proxy"]):
            return "HIGH-AI-SERVICES"
        elif "daemon" in command:
            return "HIGH-DAEMON"
        elif any(web in command for web in ["cors_web_server", "vlc_media_server"]):
            return "MEDIUM-WEB-SERVICES"
        elif "Google Chrome" in command and ("shared_profile" in command or "work_profile" in command):
            return "MEDIUM-CHROME-PROFILES"
        else:
            return "LOW-SUPPORTING"
    
    def _add_to_history(self, snapshot_data):
        """Add snapshot to restoration history"""
        try:
            history = []
            if os.path.exists(self.process_history_file):
                with open(self.process_history_file, 'r') as f:
                    history = json.load(f)
            
            # Add new snapshot to history (keep last 50)
            history.append({
                "snapshot_id": snapshot_data["snapshot_id"],
                "capture_time": snapshot_data["capture_time"],
                "reason": snapshot_data["reason"],
                "total_processes": snapshot_data["total_processes"],
                "total_memory_mb": snapshot_data["total_memory_mb"],
                "phantom_processes": snapshot_data["phantom_processes"]
            })
            
            # Keep only last 50 entries
            if len(history) > 50:
                history = history[-50:]
            
            with open(self.process_history_file, 'w') as f:
                json.dump(history, f, indent=2)
        
        except Exception as e:
            print(f"⚠️ Could not update history: {e}")
    
    def get_latest_snapshot(self):
        """Get the latest process snapshot for restoration"""
        if os.path.exists(self.current_snapshot_file):
            with open(self.current_snapshot_file, 'r') as f:
                return json.load(f)
        return None
    
    def show_capture_history(self, limit=10):
        """Show recent capture history"""
        if not os.path.exists(self.process_history_file):
            print("📭 No capture history found")
            return
        
        with open(self.process_history_file, 'r') as f:
            history = json.load(f)
        
        print("📚 RangerOS Process Capture History")
        print("===================================")
        
        recent_history = history[-limit:] if len(history) > limit else history
        
        for entry in reversed(recent_history):
            print(f"📸 {entry['capture_time'][:19]}: {entry['reason']}")
            print(f"   Processes: {entry['total_processes']} | Memory: {entry['total_memory_mb']}MB | Phantoms: {entry['phantom_processes']}")
        
        print(f"\n📊 Total captures: {len(history)}")

def main():
    """Command line interface for process capture"""
    import sys
    
    capture_system = RangerOSProcessCapture()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "capture":
            reason = sys.argv[2] if len(sys.argv) > 2 else "manual"
            capture_system.capture_current_processes(reason=reason, triggered_by="command_line")
        
        elif command == "history":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            capture_system.show_capture_history(limit)
        
        elif command == "latest":
            snapshot = capture_system.get_latest_snapshot()
            if snapshot:
                print("📸 Latest Process Snapshot:")
                print(f"   Time: {snapshot['capture_time']}")
                print(f"   Processes: {snapshot['total_processes']}")
                print(f"   Memory: {snapshot['total_memory_mb']}MB")
                print(f"   Phantoms: {snapshot['phantom_processes']}")
            else:
                print("📭 No snapshots found")
        
        else:
            print("Usage: python3 process_capture_enhanced.py [capture|history|latest]")
    
    else:
        # Interactive mode
        capture_system.capture_current_processes(reason="interactive", triggered_by="user")

if __name__ == "__main__":
    main()