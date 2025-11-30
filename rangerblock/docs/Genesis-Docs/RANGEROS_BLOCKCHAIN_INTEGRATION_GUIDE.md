#!/usr/bin/env python3
"""
RangerOS Blockchain Integration Methods
Created by: David Keane with Claude Code
Purpose: Methods to add to rangeros_browser_v2.py for automatic blockchain startup
Philosophy: "One foot in front of the other" - Seamless blockchain integration

USAGE: Copy these methods into the RangerOSBrowser class in rangeros_browser_v2.py
"""

import subprocess
import socket
import json
from pathlib import Path

# ADD THESE METHODS TO RangerOSBrowser class in rangeros_browser_v2.py:

def init_blockchain_services(self):
    """Initialize blockchain services when RangerOS starts"""
    
    print("🔗 Checking for RangerCode Blockchain services...")
    
    blockchain_path = Path("/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS/13-RangerOS-BlockChain/RANGERCODE")
    
    if not blockchain_path.exists():
        print("💡 RangerCode blockchain not found - install to enable")
        return
    
    identity_file = blockchain_path / "node_identity.json"
    
    if identity_file.exists():
        try:
            with open(identity_file, 'r') as f:
                node_identity = json.load(f)
            
            node_type = node_identity.get('nodeType', 'Unknown')
            node_id = node_identity.get('nodeID', 'Unknown')
            
            print(f"🆔 Blockchain node found: {node_id}")
            print(f"🎯 Node type: {node_type}")
            
            # Start appropriate services based on node type
            if node_type == 'GenesisValidator':
                self.start_genesis_blockchain_services()
            elif node_type == 'PeerValidator':  
                self.start_peer_blockchain_services()
            else:
                print(f"⚠️ Unknown node type: {node_type}")
                
        except Exception as e:
            print(f"⚠️ Blockchain identity error: {e}")
    else:
        print("💡 No blockchain identity found")
        print("🚀 Run: ./initiate_node.sh --genesis (or --peer) to join network")

def start_genesis_blockchain_services(self):
    """Start Genesis Node services (M3 Pro)"""
    
    print("🚀 Starting Genesis Node (M3 Pro) blockchain services...")
    
    blockchain_dir = "/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS/13-RangerOS-BlockChain/RANGERCODE"
    
    # Blockchain web services to auto-start
    blockchain_services = [
        {
            'name': 'Real-Time Dashboard',
            'script': 'real_time_dashboard.py',
            'port': 8889,
            'description': 'Live blockchain monitoring'
        },
        {
            'name': 'Database Explorer', 
            'script': 'fixed_database_viewer.py',
            'port': 8887,
            'description': 'Transaction history browser'
        },
        {
            'name': 'Advanced File Browser',
            'script': 'advanced_blockchain_file_browser.py', 
            'port': 8893,
            'description': 'Multi-format file management'
        }
    ]
    
    active_services = 0
    
    for service in blockchain_services:
        if self.start_blockchain_service(service, blockchain_dir):
            active_services += 1
    
    print(f"✅ Genesis Node: {active_services}/{len(blockchain_services)} services active")
    
    # Update menu to show Genesis status
    self.update_blockchain_menu_status(f"🟢 Genesis ({active_services} services)")

def start_peer_blockchain_services(self):
    """Start Peer Node services (M1 Air)"""
    
    print("🛰️ Starting Peer Node (M1 Air) blockchain services...")
    
    blockchain_dir = "/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS/13-RangerOS-BlockChain/RANGERCODE"
    
    # For peer node, start with connection to Genesis
    try:
        print("🔍 Attempting connection to Genesis Node...")
        
        # Start network connection process
        subprocess.Popen([
            './launch_secure_network.sh', '--auto-connect-genesis'
        ], cwd=blockchain_dir)
        
        print("✅ Peer Node connection initiated")
        
        # Start local interfaces
        local_services = [
            {
                'name': 'Local Dashboard',
                'script': 'real_time_dashboard.py',
                'port': 8889,
                'description': 'Peer node monitoring'
            }
        ]
        
        for service in local_services:
            self.start_blockchain_service(service, blockchain_dir)
        
        self.update_blockchain_menu_status("🔵 Peer (Connecting...)")
        
    except Exception as e:
        print(f"⚠️ Peer node startup error: {e}")
        self.update_blockchain_menu_status("⚠️ Peer (Error)")

def start_blockchain_service(self, service_info, blockchain_dir):
    """Start individual blockchain service"""
    
    script = service_info['script']
    port = service_info['port'] 
    name = service_info['name']
    
    # Check if service already running
    if self.check_port_available(port):
        try:
            # Start the service
            subprocess.Popen([
                'python3', script
            ], cwd=blockchain_dir, 
               stdout=subprocess.DEVNULL,  # Silent startup
               stderr=subprocess.DEVNULL)
            
            # Give service time to start
            time.sleep(1)
            
            # Verify it started
            if not self.check_port_available(port):
                print(f"   ✅ {name} started successfully")
                return True
            else:
                print(f"   ❌ {name} failed to bind to port {port}")
                return False
                
        except Exception as e:
            print(f"   ❌ {name} startup error: {e}")
            return False
    else:
        print(f"   💡 {name} already running on port {port}")
        return True

def check_port_available(self, port):
    """Check if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True  # Port available
    except socket.error:
        return False  # Port in use

def update_blockchain_menu_status(self, status):
    """Update blockchain menu items with current status"""
    
    # This would update the existing blockchain menu items
    # The menu items already exist in your rangeros_browser_v2.py
    # This would just update their text to show status
    
    print(f"🔗 Blockchain status: {status}")
    
    # In a full implementation, this would update the actual menu item text
    # to show: "🔗 RangerChain Blockchain (🟢 Genesis - 3 services)"
    # or: "🔗 RangerChain Blockchain (🔵 Peer - Connected)"

# INTEGRATION INSTRUCTIONS:
# 1. Copy these methods into rangeros_browser_v2.py RangerOSBrowser class
# 2. Add self.init_blockchain_services() to __init__ method around line 1500
# 3. Add required imports at top: import socket, import time
# 4. The blockchain menu items already exist - this adds auto-startup