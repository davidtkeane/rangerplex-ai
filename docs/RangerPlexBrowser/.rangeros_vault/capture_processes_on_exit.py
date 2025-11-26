#!/usr/bin/env python3
"""
RangerOS Exit Process Capture Hook
Simple script to capture processes when RangerOS closes
Can be called from closeEvent() in rangeros_browser_v2.py
"""

import sys
import os
sys.path.append('/Users/ranger/.rangeros_vault')

try:
    from process_capture_enhanced import RangerOSProcessCapture
    
    def capture_on_exit(reason="browser_close"):
        """Capture current processes when RangerOS exits"""
        capture_system = RangerOSProcessCapture()
        snapshot = capture_system.capture_current_processes(
            reason=reason, 
            triggered_by="rangeros_browser_v2"
        )
        
        if snapshot:
            print("👻 Process capture successful - phantom state preserved!")
            return True
        else:
            print("❌ Process capture failed")
            return False
    
    if __name__ == "__main__":
        reason = sys.argv[1] if len(sys.argv) > 1 else "browser_close"
        capture_on_exit(reason)

except Exception as e:
    print(f"⚠️ Process capture error: {e}")