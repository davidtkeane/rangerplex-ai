#!/usr/bin/env python3
"""
RangerCode Network Discovery System
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Building networks safely
Mission: Help Genesis Node discover and connect to new peer nodes
"""

import socket
import threading
import time
import json
import subprocess
from datetime import datetime
import os

class NetworkDiscovery:
    def __init__(self, node_type="genesis"):
        self.node_type = node_type
        self.discovery_port = 9998  # Port for node discovery
        self.blockchain_port = 9999  # Port for blockchain communication
        self.running = False
        self.connected_peers = {}
        self.discovery_socket = None
        
        # Load node identity
        self.load_node_identity()
        
    def load_node_identity(self):
        """Load this node's identity"""
        try:
            with open('node_identity.json', 'r') as f:
                self.identity = json.load(f)
                # Handle different identity file formats
                self.node_id = self.identity.get('node_id') or self.identity.get('nodeID', 'unknown')
                print(f"🆔 Node Identity: {self.node_id}")
        except Exception as e:
            print(f"❌ Error loading node identity: {e}")
            self.identity = None
            self.node_id = "unknown"
    
    def start_discovery_listener(self):
        """Start listening for peer discovery messages"""
        if self.node_type != "genesis":
            return  # Only Genesis node listens for discoveries
            
        try:
            self.discovery_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.discovery_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            
            # Try to bind to the port
            try:
                self.discovery_socket.bind(('', self.discovery_port))
            except OSError as e:
                if e.errno == 48:  # Address already in use
                    print(f"⚠️ Port {self.discovery_port} already in use")
                    print("💡 Another discovery service may be running")
                    print("🔄 Checking for existing connections...")
                    
                    # Still show network status even if port is busy
                    self.show_network_status()
                    return
                else:
                    raise
            
            self.running = True
            
            print(f"🔍 Genesis Node listening for peer discoveries on port {self.discovery_port}")
            
            while self.running:
                try:
                    data, address = self.discovery_socket.recvfrom(1024)
                    message = json.loads(data.decode())
                    
                    if message['type'] == 'peer_discovery':
                        self.handle_peer_discovery(message, address)
                        
                except socket.timeout:
                    continue
                except Exception as e:
                    if self.running:
                        print(f"⚠️ Discovery error: {e}")
                    
        except Exception as e:
            print(f"❌ Failed to start discovery listener: {e}")
    
    def handle_peer_discovery(self, message, address):
        """Handle incoming peer discovery request"""
        peer_ip = address[0]
        peer_id = message['node_id']
        
        print(f"\n🎉 NEW PEER DISCOVERED!")
        print(f"📍 Peer IP: {peer_ip}")
        print(f"🆔 Peer ID: {peer_id}")
        print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
        
        # Send discovery response
        response = {
            'type': 'discovery_response',
            'node_id': self.node_id,
            'node_type': 'genesis',
            'blockchain_port': self.blockchain_port,
            'welcome_message': 'Welcome to RangerCode Network!'
        }
        
        try:
            response_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            response_data = json.dumps(response).encode()
            response_socket.sendto(response_data, (peer_ip, self.discovery_port))
            response_socket.close()
            
            # Add to connected peers
            self.connected_peers[peer_id] = {
                'ip': peer_ip,
                'connected_at': datetime.now().isoformat(),
                'status': 'active'
            }
            
            print(f"✅ Discovery response sent to {peer_ip}")
            print(f"🌐 Total connected peers: {len(self.connected_peers)}")
            
            # Save network status
            self.save_network_status()
            
        except Exception as e:
            print(f"❌ Failed to send discovery response: {e}")
    
    def discover_genesis_node(self, genesis_ip=None):
        """Peer node: Discover and connect to Genesis node"""
        if self.node_type != "peer":
            return
            
        print(f"🔍 Searching for Genesis Node...")
        
        # If no specific IP provided, try common local network IPs
        if not genesis_ip:
            # Try to find Genesis on local network
            import ipaddress
            
            # Get our own IP to determine network range
            try:
                # Connect to a remote address to get our local IP
                with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                    s.connect(("8.8.8.8", 80))
                    local_ip = s.getsockname()[0]
                    
                # Calculate network range (assume /24)
                network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
                target_ips = [str(ip) for ip in network.hosts()]
                
            except:
                # Fallback to common ranges
                target_ips = [f"192.168.1.{i}" for i in range(1, 255)]
        else:
            target_ips = [genesis_ip]
        
        # Send discovery message
        discovery_message = {
            'type': 'peer_discovery',
            'node_id': self.node_id,
            'node_type': 'peer',
            'timestamp': datetime.now().isoformat()
        }
        
        found_genesis = False
        
        for ip in target_ips[:20]:  # Limit search to first 20 IPs
            try:
                discovery_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                discovery_socket.settimeout(0.5)  # Quick timeout
                
                message_data = json.dumps(discovery_message).encode()
                discovery_socket.sendto(message_data, (ip, self.discovery_port))
                
                # Wait for response
                try:
                    response_data, _ = discovery_socket.recvfrom(1024)
                    response = json.loads(response_data.decode())
                    
                    if response['type'] == 'discovery_response':
                        print(f"🎉 GENESIS NODE FOUND!")
                        print(f"📍 Genesis IP: {ip}")
                        print(f"🆔 Genesis ID: {response['node_id']}")
                        print(f"💬 Message: {response['welcome_message']}")
                        
                        found_genesis = True
                        discovery_socket.close()
                        break
                        
                except socket.timeout:
                    pass
                    
                discovery_socket.close()
                
            except Exception as e:
                continue
        
        if not found_genesis:
            print("❌ Genesis Node not found on network")
            print("💡 Make sure Genesis Node is running and discoverable")
        else:
            print("✅ Successfully connected to RangerCode network!")
    
    def save_network_status(self):
        """Save current network status to file"""
        status = {
            'node_type': self.node_type,
            'node_id': self.node_id,
            'connected_peers': self.connected_peers,
            'last_updated': datetime.now().isoformat()
        }
        
        with open('network_status.json', 'w') as f:
            json.dump(status, f, indent=2)
    
    def load_existing_connections(self):
        """Load existing peer connections from file"""
        try:
            with open('network_status.json', 'r') as f:
                status = json.load(f)
                self.connected_peers = status.get('connected_peers', {})
                print(f"📋 Loaded {len(self.connected_peers)} existing peer connection(s)")
        except:
            print("📝 No existing peer connections found")

    def show_network_status(self):
        """Display current network status"""
        print(f"\n🌐 RANGERCODE NETWORK STATUS")
        print("=" * 50)
        print(f"📍 Node Type: {self.node_type.upper()}")
        print(f"🆔 Node ID: {self.node_id}")
        print(f"⏰ Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.node_type == "genesis":
            print(f"👥 Connected Peers: {len(self.connected_peers)}")
            
            if self.connected_peers:
                print("\n📋 Peer Details:")
                for peer_id, details in self.connected_peers.items():
                    print(f"   🔹 {peer_id}")
                    print(f"      IP: {details['ip']}")
                    print(f"      Connected: {details['connected_at'][:19]}")
                    print(f"      Status: {details['status']}")
                    
                print(f"\n✅ BLOCKCHAIN NETWORK: ACTIVE")
                print(f"🌟 Two-node RangerCode network operational!")
            else:
                print("💡 Waiting for peer nodes to connect...")
        
        print("=" * 50)
    
    def stop_discovery(self):
        """Stop the discovery service"""
        self.running = False
        if self.discovery_socket:
            self.discovery_socket.close()
        print("🛑 Network discovery stopped")

def main():
    """Main network discovery interface"""
    
    print("\n🌐 RANGERCODE NETWORK DISCOVERY")
    print("=" * 50)
    print("🏔️ Philosophy: 'One foot in front of the other'")
    print("🎯 Mission: Connect blockchain nodes safely")
    print("=" * 50)
    
    # Determine node type
    if os.path.exists('node_identity.json'):
        try:
            with open('node_identity.json', 'r') as f:
                identity = json.load(f)
                # Handle different identity file formats
                node_type = identity.get('node_type') or identity.get('nodeType', 'genesis')
                if 'Genesis' in node_type or 'genesis' in node_type.lower():
                    node_type = 'genesis'
                else:
                    node_type = 'peer'
        except:
            node_type = 'genesis'
    else:
        print("❌ Node identity not found!")
        return
    
    discovery = NetworkDiscovery(node_type)
    
    if node_type == "genesis":
        print(f"🏛️ Starting Genesis Node discovery service...")
        
        # Load existing connections first
        discovery.load_existing_connections()
        
        # Start discovery listener in background
        listener_thread = threading.Thread(target=discovery.start_discovery_listener)
        listener_thread.daemon = True
        listener_thread.start()
        
        print("✅ Genesis Node ready - waiting for peer connections")
        
        try:
            while True:
                time.sleep(5)
                discovery.show_network_status()
                time.sleep(25)  # Update every 30 seconds
                
        except KeyboardInterrupt:
            print("\n🛑 Shutting down discovery service...")
            discovery.stop_discovery()
            
    else:  # peer node
        print(f"🛰️ Peer node attempting to discover Genesis...")
        discovery.discover_genesis_node()

if __name__ == "__main__":
    main()