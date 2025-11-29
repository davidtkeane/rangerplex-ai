#!/usr/bin/env python3
"""
Create New RangerCode Node - Complete Setup Script
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Complete node creation
Mission: Create complete new RangerCode blockchain node with all components
Innovation: One script creates everything needed for new node
"""

import os
import json
import socket
import uuid
import hashlib
from datetime import datetime
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

class NewNodeCreator:
    def __init__(self):
        self.node_number = None
        self.node_id = None
        self.output_files = []
        
    def create_complete_new_node(self):
        """Create complete new RangerCode node"""
        
        print("🆕 RANGERCODE NEW NODE CREATOR")
        print("=" * 50)
        print("🏔️ Philosophy: 'One foot in front of the other'")
        print("🎯 Mission: Create complete new blockchain node")
        print("🌟 Innovation: Everything needed in one script")
        print("=" * 50)
        
        # Step 1: Get node information
        node_info = self.get_node_information()
        
        # Step 2: Create node identity
        identity = self.create_node_identity(node_info)
        
        # Step 3: Generate cryptographic keys
        keys = self.generate_node_keys(node_info)
        
        # Step 4: Create node configuration
        config = self.create_node_configuration(node_info, identity, keys)
        
        # Step 5: Generate all scripts
        scripts = self.generate_node_scripts(node_info)
        
        # Step 6: Create startup script
        startup = self.create_startup_script(node_info)
        
        # Step 7: Generate summary report
        self.generate_node_summary(node_info, identity, keys, config, scripts)
        
        return {
            'node_created': True,
            'node_id': self.node_id,
            'files_created': len(self.output_files)
        }
    
    def get_node_information(self):
        """Get information for new node"""
        
        print(f"\n🔍 NEW NODE SETUP:")
        print("-" * 30)
        
        # Get node number
        while True:
            try:
                node_num = input("Enter node number (e.g., 4, 5, 6): ").strip()
                self.node_number = int(node_num)
                break
            except ValueError:
                print("❌ Please enter a valid number")
        
        # Get node name
        node_name = input(f"Enter node name (e.g., 'Desktop', 'Laptop', 'Pi5'): ").strip()
        if not node_name:
            node_name = f"Node{self.node_number}"
        
        # Get location
        location = input(f"Enter location (e.g., 'Home Office', 'University'): ").strip()
        if not location:
            location = "Unknown Location"
        
        self.node_id = f"RangerNode-{self.node_number:03d}-{node_name}"
        
        node_info = {
            'node_number': self.node_number,
            'node_name': node_name,
            'node_id': self.node_id,
            'location': location,
            'created': datetime.now().isoformat(),
            'creator': 'David Keane (Accessibility Advocate)'
        }
        
        print(f"✅ Node Info:")
        print(f"   🆔 Node ID: {self.node_id}")
        print(f"   📍 Location: {location}")
        
        return node_info
    
    def create_node_identity(self, node_info):
        """Create complete node identity file"""
        
        print(f"\n🆔 Creating node identity...")
        
        # Get local IP
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
        except:
            local_ip = "auto-detect"
        
        identity = {
            "nodeID": node_info['node_id'],
            "nodeType": f"Peer{node_info['node_number']}",
            "nodeNumber": node_info['node_number'],
            "genesisTimestamp": node_info['created'],
            "location": node_info['location'],
            "localIP": local_ip,
            "platform": {
                "system": "Darwin",  # Adjust for actual platform
                "machine": "arm64",
                "node_name": f"{node_info['node_name']}-{node_info['node_number']}"
            },
            "accessibility_mission": {
                "primary_mission": "Transform disabilities into superpowers through blockchain technology",
                "education_support": "10% of all transactions fund disability schools",
                "community_values": "Accessibility-first blockchain owned by disability community",
                "founder_philosophy": "One foot in front of the other - David Keane",
                "network_purpose": "Empower accessibility advocates through decentralized technology",
                "network_role": f"peer_node_{node_info['node_number']}"
            },
            "network_role": {
                "primary": f"accessibility_blockchain_peer_{node_info['node_number']}",
                "secondary": "disability_education_supporter",
                "commitment": "community_owned_network_advocate"
            },
            "education_tithe": {
                "enabled": True,
                "percentage": 10,
                "destination": "disability_schools_fund",
                "transparency": "public_ledger_tracking"
            },
            "security_profile": {
                "ethics": "standard",
                "research_permitted": "educational_security_only",
                "malicious_activities": "prohibited",
                "community_protection": "highest_priority"
            },
            "version": {
                "rangercode_version": "1.0.0-accessibility-beta",
                "node_protocol": "accessibility-blockchain-v1",
                "created_by": "David Keane - Applied Psychologist & Accessibility Advocate"
            }
        }
        
        # Save identity file
        identity_file = "node_identity.json"
        with open(identity_file, 'w') as f:
            json.dump(identity, f, indent=4)
        
        self.output_files.append(identity_file)
        print(f"✅ Node identity created: {identity_file}")
        
        return identity
    
    def generate_node_keys(self, node_info):
        """Generate cryptographic keys for new node"""
        
        print(f"\n🔐 Generating cryptographic keys...")
        
        try:
            # Generate unique RSA keypair
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            
            public_key = private_key.public_key()
            
            # Serialize keys
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            # Save keys
            private_key_file = f"{node_info['node_id'].lower().replace('-', '_')}_private_key.pem"
            public_key_file = f"{node_info['node_id'].lower().replace('-', '_')}_public_key.pem"
            
            with open(private_key_file, 'wb') as f:
                f.write(private_pem)
            
            with open(public_key_file, 'wb') as f:
                f.write(public_pem)
            
            # Set proper permissions
            os.chmod(private_key_file, 0o600)
            os.chmod(public_key_file, 0o644)
            
            self.output_files.extend([private_key_file, public_key_file])
            
            print(f"✅ Keys generated:")
            print(f"   🔐 Private: {private_key_file}")
            print(f"   🔓 Public: {public_key_file}")
            
            return {
                'private_key_file': private_key_file,
                'public_key_file': public_key_file,
                'private_key': private_key,
                'public_key': public_key
            }
            
        except Exception as e:
            print(f"❌ Key generation failed: {e}")
            return None
    
    def create_node_configuration(self, node_info, identity, keys):
        """Create node configuration file"""
        
        print(f"\n⚙️ Creating node configuration...")
        
        config = {
            'node_configuration': {
                'node_id': node_info['node_id'],
                'node_type': f"Peer{node_info['node_number']}",
                'services': {
                    'file_transfer': True,
                    'voice_chat': True,
                    'video_streaming': True,
                    'text_messaging': True,
                    'blockchain_participation': True
                },
                'network_settings': {
                    'discovery_port': 9998,
                    'transfer_port': 9999,
                    'voice_port': 9995,
                    'video_port': 9994
                },
                'accessibility_settings': {
                    'screen_reader_support': True,
                    'keyboard_navigation': True,
                    'high_contrast': True,
                    'cognitive_accessibility': True
                }
            },
            'security_settings': {
                'private_key_file': keys['private_key_file'],
                'public_key_file': keys['public_key_file'],
                'community_authorization': True,
                'education_fund_participation': True
            }
        }
        
        config_file = "node_config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=4)
        
        self.output_files.append(config_file)
        print(f"✅ Configuration created: {config_file}")
        
        return config
    
    def generate_node_scripts(self, node_info):
        """Generate all necessary scripts for new node"""
        
        print(f"\n📜 Generating node scripts...")
        
        scripts_created = []
        
        # Network discovery script
        discovery_script = self.create_network_discovery_script(node_info)
        scripts_created.append(discovery_script)
        
        # File receiver script
        receiver_script = self.create_file_receiver_script(node_info)
        scripts_created.append(receiver_script)
        
        # Voice chat script
        voice_script = self.create_voice_chat_script(node_info)
        scripts_created.append(voice_script)
        
        # Status checker script
        status_script = self.create_status_checker_script(node_info)
        scripts_created.append(status_script)
        
        self.output_files.extend(scripts_created)
        
        print(f"✅ Scripts created: {len(scripts_created)}")
        for script in scripts_created:
            print(f"   📜 {script}")
        
        return scripts_created
    
    def create_network_discovery_script(self, node_info):
        """Create network discovery script"""
        
        script_content = f'''#!/usr/bin/env python3
"""
Network Discovery for {node_info['node_id']}
Find other RangerCode nodes on network
"""

import socket
import json
from datetime import datetime

def discover_rangercode_network():
    """Discover other RangerCode nodes"""
    
    print("🔍 NETWORK DISCOVERY - {node_info['node_id']}")
    print("=" * 50)
    
    # Get local network
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            my_ip = s.getsockname()[0]
        
        network_base = ".".join(my_ip.split(".")[:-1])
        
        print(f"📍 My IP: {{my_ip}}")
        print(f"🌐 Scanning: {{network_base}}.1-254")
        
        # Scan for other nodes
        found_nodes = []
        
        for i in range(1, 255):
            test_ip = f"{{network_base}}.{{i}}"
            
            if test_ip == my_ip:
                continue
            
            # Test for RangerCode services
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(0.5)
                    result = s.connect_ex((test_ip, 9999))
                    
                    if result == 0:
                        found_nodes.append(test_ip)
                        print(f"🎉 Found RangerCode node: {{test_ip}}")
            except:
                pass
        
        # Save discovery results
        discovery_results = {{
            'discovery_timestamp': datetime.now().isoformat(),
            'discovering_node': '{node_info['node_id']}',
            'my_ip': my_ip,
            'found_nodes': found_nodes,
            'total_nodes_found': len(found_nodes)
        }}
        
        with open('network_discovery_results.txt', 'w') as f:
            f.write(f"# Network Discovery Results\\n")
            f.write(f"# Node: {node_info['node_id']}\\n")
            f.write(f"# Time: {{datetime.now().isoformat()}}\\n\\n")
            f.write(f"My IP: {{my_ip}}\\n")
            f.write(f"Nodes Found: {{len(found_nodes)}}\\n\\n")
            
            for node_ip in found_nodes:
                f.write(f"RangerCode Node: {{node_ip}}\\n")
        
        print(f"📋 Discovery saved: network_discovery_results.txt")
        return discovery_results
        
    except Exception as e:
        print(f"❌ Discovery failed: {{e}}")
        return None

if __name__ == "__main__":
    discover_rangercode_network()
'''
        
        script_file = f"discover_network_{node_info['node_number']}.py"
        with open(script_file, 'w') as f:
            f.write(script_content)
        
        os.chmod(script_file, 0o755)
        return script_file
    
    def create_file_receiver_script(self, node_info):
        """Create file receiver script"""
        
        script_content = f'''#!/usr/bin/env python3
"""
File Receiver for {node_info['node_id']}
Receive files from other RangerCode nodes
"""

import socket
import json
import struct
import os
from datetime import datetime

def start_file_receiver():
    """Start file receiver for {node_info['node_id']}"""
    
    print("📁 FILE RECEIVER - {node_info['node_id']}")
    print("=" * 40)
    print("📡 Listening for files from other nodes...")
    
    os.makedirs("received_files", exist_ok=True)
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server.bind(('', 9999))
            server.listen(5)
            
            while True:
                client, address = server.accept()
                
                print(f"📥 Incoming file from {{address[0]}}")
                
                # Receive file info
                info_size = struct.unpack('!I', client.recv(4))[0]
                info_data = client.recv(info_size).decode('utf-8')
                file_info = json.loads(info_data)
                
                filename = file_info['filename']
                file_size = file_info['size']
                
                print(f"📁 File: {{filename}} ({{file_size:,}} bytes)")
                
                client.send(b'READY!!!')
                
                # Receive file data
                received_data = b""
                
                while len(received_data) < file_size:
                    chunk_size = struct.unpack('!I', client.recv(4))[0]
                    chunk = client.recv(chunk_size)
                    received_data += chunk
                    
                    progress = len(received_data) / file_size * 100
                    print(f"\\r📊 Progress: {{progress:.1f}}%", end="", flush=True)
                
                # Save file
                file_path = os.path.join("received_files", filename)
                with open(file_path, 'wb') as f:
                    f.write(received_data)
                
                print(f"\\n✅ File saved: {{file_path}}")
                client.send(b'SUCCESS')
                client.close()
                
    except KeyboardInterrupt:
        print("\\n🛑 File receiver stopped")

if __name__ == "__main__":
    start_file_receiver()
'''
        
        script_file = f"receive_files_{node_info['node_number']}.py"
        with open(script_file, 'w') as f:
            f.write(script_content)
        
        os.chmod(script_file, 0o755)
        return script_file
    
    def create_startup_script(self, node_info):
        """Create startup script for new node"""
        
        startup_content = f'''#!/bin/bash
# {node_info['node_id']} Startup Script
# Complete node startup and services

echo "🚀 {node_info['node_id'].upper()} STARTUP"
echo "{'=' * 50}"
echo "🏔️ Philosophy: 'One foot in front of the other'"
echo "🎯 Mission: Start complete RangerCode node"
echo "🆔 Node: {node_info['node_id']}"
echo "📍 Location: {node_info['location']}"
echo "{'=' * 50}"

# Check node files
echo "🔍 Checking node files..."

if [ ! -f "node_identity.json" ]; then
    echo "❌ Node identity missing!"
    exit 1
fi

echo "✅ Node identity found"

# Start services
echo ""
echo "🚀 Starting node services..."

# Network discovery
echo "🔍 Starting network discovery..."
python3 discover_network_{node_info['node_number']}.py &
DISCOVERY_PID=$!

# File receiver
echo "📁 Starting file receiver..."
python3 receive_files_{node_info['node_number']}.py &
RECEIVER_PID=$!

# Status monitoring
echo "📊 Starting status monitoring..."
python3 check_status_{node_info['node_number']}.py &
STATUS_PID=$!

echo ""
echo "✅ {node_info['node_id']} READY!"
echo "{'=' * 30}"
echo "🆔 Node ID: {node_info['node_id']}"
echo "📡 Services: Network discovery, file receiver, status monitor"
echo "🔗 Ready to join RangerCode network"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping {node_info['node_id']}..."; kill $DISCOVERY_PID $RECEIVER_PID $STATUS_PID 2>/dev/null; echo "✨ Node stopped!"; exit 0' INT

wait
'''
        
        startup_file = f"start_{node_info['node_id'].lower().replace('-', '_')}.sh"
        with open(startup_file, 'w') as f:
            f.write(startup_content)
        
        os.chmod(startup_file, 0o755)
        self.output_files.append(startup_file)
        
        print(f"✅ Startup script: {startup_file}")
        return startup_file
    
    def generate_node_summary(self, node_info, identity, keys, config, scripts):
        """Generate complete node summary"""
        
        print(f"\n📋 Generating node summary...")
        
        summary_file = f"{node_info['node_id']}_COMPLETE_SETUP.txt"
        
        with open(summary_file, 'w') as f:
            f.write(f"# {node_info['node_id']} Complete Setup Summary\n")
            f.write(f"# Created: {datetime.now().isoformat()}\n")
            f.write(f"# Creator: David Keane (Accessibility Advocate)\n\n")
            
            f.write(f"## Node Information:\n")
            f.write(f"Node ID: {node_info['node_id']}\n")
            f.write(f"Node Number: {node_info['node_number']}\n")
            f.write(f"Location: {node_info['location']}\n")
            f.write(f"Created: {node_info['created']}\n\n")
            
            f.write(f"## Files Created:\n")
            for output_file in self.output_files:
                f.write(f"- {output_file}\n")
            f.write(f"\n")
            
            f.write(f"## Quick Start:\n")
            f.write(f"1. Run: ./start_{node_info['node_id'].lower().replace('-', '_')}.sh\n")
            f.write(f"2. Node will auto-discover other RangerCode nodes\n")
            f.write(f"3. Ready to receive files and participate in network\n\n")
            
            f.write(f"## Network Capabilities:\n")
            f.write(f"- File transfer (port 9999)\n")
            f.write(f"- Network discovery (port 9998)\n")
            f.write(f"- Voice chat ready\n")
            f.write(f"- Accessibility optimized\n")
            f.write(f"- Education fund participation\n\n")
            
            f.write(f"# 'One foot in front of the other' - {node_info['node_id']} ready!\n")
        
        self.output_files.append(summary_file)
        print(f"✅ Summary created: {summary_file}")
        
        return summary_file

def main():
    """Create new RangerCode node"""
    
    creator = NewNodeCreator()
    
    try:
        result = creator.create_complete_new_node()
        
        if result['node_created']:
            print(f"\n🎉 NEW NODE CREATION COMPLETE!")
            print("=" * 50)
            print(f"🆔 Node: {result['node_id']}")
            print(f"📁 Files: {result['files_created']} files created")
            print(f"🚀 Ready: Run startup script to begin!")
            print(f"♿ Mission: Accessibility blockchain participation")
        else:
            print(f"❌ Node creation failed")
            
    except KeyboardInterrupt:
        print(f"\n🛑 Node creation cancelled")
    
    print(f"\n🏔️ 'One foot in front of the other' - Node creation complete!")

if __name__ == "__main__":
    main()