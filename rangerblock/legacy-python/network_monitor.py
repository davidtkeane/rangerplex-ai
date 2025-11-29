#!/usr/bin/env python3
"""
RangerCode Network Monitor - Real-time Network Status
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Monitoring network safely
Mission: Show real-time status while waiting for M1 Air connection
"""

import time
import json
import os
import socket
from datetime import datetime

def check_port_status(port):
    """Check if a port is active"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result == 0
    except:
        return False

def get_network_status():
    """Get current network and blockchain status"""
    status = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'blockchain_services': {},
        'network_discovery': False,
        'connected_peers': 0,
        'ready_for_m1_air': True
    }
    
    # Check blockchain services
    services = {
        'Database Explorer': 8887,
        'Real-Time Dashboard': 8889,
        'File Browser': 8893,
        'Video API': 8892,
        'Discovery Service': 9998
    }
    
    for service_name, port in services.items():
        status['blockchain_services'][service_name] = {
            'port': port,
            'active': check_port_status(port)
        }
    
    # Check for network status file
    if os.path.exists('network_status.json'):
        try:
            with open('network_status.json', 'r') as f:
                network_data = json.load(f)
                status['connected_peers'] = len(network_data.get('connected_peers', {}))
        except:
            pass
    
    return status

def display_status_dashboard():
    """Display beautiful status dashboard"""
    os.system('clear' if os.name == 'posix' else 'cls')
    
    print("🌐 RANGERCODE NETWORK MONITOR")
    print("=" * 60)
    print("🏔️ Philosophy: 'One foot in front of the other'")
    print("🎯 Mission: Monitoring while waiting for M1 Air connection")
    print("=" * 60)
    
    status = get_network_status()
    
    print(f"⏰ Current Time: {status['timestamp']}")
    print(f"📊 System Status: M3 Pro Genesis Node")
    
    print(f"\n🔧 BLOCKCHAIN SERVICES:")
    print("-" * 40)
    
    all_services_running = True
    for service_name, details in status['blockchain_services'].items():
        port = details['port']
        active = details['active']
        status_icon = "🟢" if active else "🔴"
        
        if not active:
            all_services_running = False
            
        print(f"   {status_icon} {service_name:<20} Port {port}")
    
    print(f"\n🌐 NETWORK STATUS:")
    print("-" * 40)
    
    discovery_active = status['blockchain_services']['Discovery Service']['active']
    
    if discovery_active:
        print("   🟢 Discovery Service        LISTENING")
        print("   📡 Ready for M1 Air         WAITING...")
    else:
        print("   🔴 Discovery Service        NOT RUNNING")
        print("   ⚠️  M1 Air Connection       NOT READY")
    
    print(f"   👥 Connected Peers          {status['connected_peers']}")
    
    print(f"\n📋 WEB INTERFACES:")
    print("-" * 40)
    
    if status['blockchain_services']['Real-Time Dashboard']['active']:
        print("   🔗 Real-Time Dashboard: http://localhost:8889/")
    
    if status['blockchain_services']['Database Explorer']['active']:
        print("   🗄️ Database Explorer:   http://localhost:8887/")
    
    if status['blockchain_services']['File Browser']['active']:
        print("   📁 File Browser:       http://localhost:8893/")
    
    if status['blockchain_services']['Video API']['active']:
        print("   🎥 Video API:          http://localhost:8892/")
    
    print(f"\n💡 STATUS SUMMARY:")
    print("-" * 40)
    
    if all_services_running and discovery_active:
        print("   ✅ M3 Pro is READY for M1 Air connection!")
        print("   🔄 Waiting for M1 Air to run discovery...")
        print("   📱 M1 Air should run: ./start_peer_discovery.sh")
    elif not discovery_active:
        print("   ⚠️  Discovery service not running")
        print("   💡 Run: python3 node_network_discovery.py")
    else:
        print("   ⚠️  Some blockchain services not running")
        print("   💡 Check your running services")
    
    print("=" * 60)
    print("💤 Refreshing in 10 seconds... (Ctrl+C to stop)")

def main():
    """Main monitoring loop"""
    
    try:
        while True:
            display_status_dashboard()
            time.sleep(10)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Network monitoring stopped")
        print("✨ Thank you for monitoring RangerCode network!")

if __name__ == "__main__":
    main()