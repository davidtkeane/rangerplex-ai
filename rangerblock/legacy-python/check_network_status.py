#!/usr/bin/env python3
"""
RangerCode Network Status Checker
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Check network safely
Mission: Show current blockchain network connections
"""

import json
import os
import time
import sys
from datetime import datetime

def clear_screen():
    """Clear the terminal screen"""
    os.system('clear' if os.name == 'posix' else 'cls')

def check_network_status(live_mode=False):
    """Check and display current network status"""
    print("🌐 RANGERCODE NETWORK STATUS")
    print("=" * 50)
    print("🏔️ Philosophy: 'One foot in front of the other'")
    print("🎯 Mission: Show current network connections")
    print("=" * 50)
    
    # Load node identity
    try:
        with open('../data/node_identity.json', 'r') as f:
            identity = json.load(f)
            node_id = identity.get('node_id') or identity.get('nodeID', 'unknown')
            node_type = identity.get('node_type') or identity.get('nodeType', 'genesis')
            
        print(f"🆔 This Node: {node_id}")
        print(f"📍 Node Type: {node_type}")
    except:
        print("❌ Node identity not found")
        return
    
    # Check network status file
    if os.path.exists('../data/network_status.json'):
        try:
            with open('../data/network_status.json', 'r') as f:
                status = json.load(f)
            
            print(f"⏰ Last Updated: {status['last_updated'][:19]}")
            print(f"👥 Connected Peers: {len(status['connected_peers'])}")
            
            if status['connected_peers']:
                print("\n📋 CONNECTED PEERS:")
                print("-" * 30)
                
                for peer_id, details in status['connected_peers'].items():
                    print(f"🔹 {peer_id}")
                    print(f"   📍 IP: {details['ip']}")
                    print(f"   ⏰ Connected: {details['connected_at'][:19]}")
                    print(f"   🟢 Status: {details['status']}")
                
                print(f"\n✅ BLOCKCHAIN NETWORK STATUS: ACTIVE")
                print(f"🌐 Two-node RangerCode network operational!")
                
            else:
                print("\n💤 No peers currently connected")
                print("💡 Run network discovery to find peers")
                
        except Exception as e:
            print(f"❌ Error reading network status: {e}")
    else:
        print("\n📝 No network status file found")
        print("💡 Network discovery hasn't run yet")
    
    print("=" * 50)
    
    if live_mode:
        print("🔄 Live Mode - Updates every 10 seconds (Ctrl+C to stop)")

def main():
    """Main function with live mode support"""
    
    # Check for live mode argument
    live_mode = len(sys.argv) > 1 and sys.argv[1] == "--live"
    
    if live_mode:
        try:
            while True:
                clear_screen()
                check_network_status(live_mode=True)
                time.sleep(10)
        except KeyboardInterrupt:
            print("\n\n🛑 Live monitoring stopped")
            print("✨ Thank you for monitoring RangerCode network!")
    else:
        check_network_status()

if __name__ == "__main__":
    main()