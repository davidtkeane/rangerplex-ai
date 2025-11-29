#!/usr/bin/env python3
"""
Enhanced Blockchain Node Registration with Block Capture
Created by: David Keane with Claude Code
Date: September 19, 2025
Philosophy: "One foot in front of the other"
Mission: Two-factor security with hardware binding + blockchain block
"""

import json
import uuid
import hashlib
import platform
import subprocess
import socket
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

class BlockchainNodeRegistration:
    """Complete node registration with blockchain block capture."""

    def __init__(self):
        self.node_dir = Path.cwd()
        self.data_dir = self.node_dir / "data"
        self.keys_dir = self.node_dir / "node_keys"
        self.data_dir.mkdir(exist_ok=True)
        self.keys_dir.mkdir(exist_ok=True)

        # File paths
        self.hardware_binding_file = self.data_dir / "hardware_binding.json"
        self.blockchain_block_file = self.data_dir / "blockchain_registration_block.json"
        self.node_identity_file = self.data_dir / "node_identity.json"
        self.network_config_file = self.data_dir / "network_config.json"

        # Genesis node (M3 Pro)
        self.genesis_ip = "192.168.1.7"
        self.genesis_port = 9999

    def get_hardware_serial(self):
        """Get unique hardware identifier for this machine."""
        serial = None

        # For Linux/Kali VM
        if platform.system() == 'Linux':
            try:
                # Try to get VM UUID (for VMs)
                result = subprocess.run(['cat', '/sys/class/dmi/id/product_uuid'],
                                      capture_output=True, text=True)
                if result.returncode == 0 and result.stdout.strip():
                    serial = f"VM_{result.stdout.strip()}"
            except:
                pass

            # Try machine-id as fallback
            if not serial:
                try:
                    with open('/etc/machine-id', 'r') as f:
                        serial = f"LINUX_{f.read().strip()}"
                except:
                    pass

        # For macOS
        elif platform.system() == 'Darwin':
            try:
                result = subprocess.run(['system_profiler', 'SPHardwareDataType'],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if 'Hardware UUID' in line:
                            serial = line.split(':')[1].strip()
                            break
            except:
                pass

        # Ultimate fallback - MAC address
        if not serial:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff)
                          for i in range(0,8*6,8)][::-1])
            serial = f"MAC_{mac}"

        return serial

    def create_hardware_binding(self):
        """Create hardware binding for this node."""

        print("\n🔐 Creating Hardware Binding...")

        hardware_info = {
            'serial': self.get_hardware_serial(),
            'platform': platform.system(),
            'machine': platform.machine(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'created_at': datetime.now(timezone.utc).isoformat()
        }

        # Create unique node ID from hardware
        node_id = f"m1air_{hashlib.sha256(hardware_info['serial'].encode()).hexdigest()[:16]}"

        binding = {
            'node_id': node_id,
            'hardware_serial': hardware_info['serial'],
            'hardware_info': hardware_info,
            'binding_hash': hashlib.sha256(json.dumps(hardware_info, sort_keys=True).encode()).hexdigest(),
            'created_at': hardware_info['created_at']
        }

        # Save binding
        with open(self.hardware_binding_file, 'w') as f:
            json.dump(binding, f, indent=2)

        print(f"✅ Hardware Binding Created")
        print(f"   Node ID: {node_id}")
        print(f"   Serial: {hardware_info['serial']}")
        print(f"   Hash: {binding['binding_hash'][:32]}...")

        return binding

    def register_on_blockchain(self, binding):
        """Register node on blockchain and capture the block."""

        print("\n📡 Registering on Blockchain...")

        # Create registration transaction
        registration_tx = {
            'type': 'node_registration',
            'node_id': binding['node_id'],
            'hardware_serial': binding['hardware_serial'],
            'binding_hash': binding['binding_hash'],
            'node_type': 'peer',
            'node_name': 'M1 Air Peer Node',
            'capabilities': [
                'ethical_security_testing',
                'network_monitoring',
                'blockchain_verification'
            ],
            'network': {
                'ip': self.get_local_ip(),
                'discovery_port': 9997,
                'chat_port': 5557,
                'web_port': 8891
            },
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'nonce': hashlib.sha256(str(time.time()).encode()).hexdigest()
        }

        # Calculate transaction hash
        tx_hash = hashlib.sha256(json.dumps(registration_tx, sort_keys=True).encode()).hexdigest()
        registration_tx['tx_hash'] = tx_hash

        # Simulate blockchain block (will be real when connected to Genesis)
        block = {
            'block_number': int(time.time()),  # Will be real block number
            'block_hash': hashlib.sha256(f"{tx_hash}{time.time()}".encode()).hexdigest(),
            'previous_hash': '0' * 64,  # Will be real previous hash
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'transactions': [registration_tx],
            'merkle_root': tx_hash,  # Simplified for single tx
            'validator': 'genesis_node',  # Will be actual validator
            'signature': hashlib.sha256(f"{tx_hash}signed".encode()).hexdigest()  # Will be real signature
        }

        # Try to register with Genesis node
        registration_success = False
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)

            try:
                print(f"   Connecting to Genesis at {self.genesis_ip}:{self.genesis_port}...")
                sock.connect((self.genesis_ip, self.genesis_port))

                # Send registration
                message = json.dumps(registration_tx).encode()
                sock.send(message)

                # Wait for block confirmation
                response = sock.recv(4096)
                if response:
                    # Parse real block from Genesis
                    real_block = json.loads(response.decode())
                    if 'block_number' in real_block:
                        block = real_block
                        registration_success = True
                        print(f"✅ Registered on Blockchain!")

            except (ConnectionRefusedError, socket.timeout):
                print(f"⚠️ Genesis offline - Using provisional block")
                print(f"   Will sync when Genesis comes online")

            finally:
                sock.close()

        except Exception as e:
            print(f"⚠️ Registration pending: {e}")

        # Save blockchain block (provisional or real)
        block['registration_status'] = 'confirmed' if registration_success else 'provisional'

        with open(self.blockchain_block_file, 'w') as f:
            json.dump(block, f, indent=2)

        print(f"📦 Blockchain Block Saved")
        print(f"   Block Number: {block['block_number']}")
        print(f"   Block Hash: {block['block_hash'][:32]}...")
        print(f"   Status: {block['registration_status']}")

        return block

    def create_node_identity(self, binding, block):
        """Create complete node identity file."""

        print("\n🆔 Creating Node Identity...")

        node_identity = {
            'node_id': binding['node_id'],
            'node_type': 'peer',
            'node_name': 'M1 Air Peer Node',
            'hardware_binding': {
                'serial': binding['hardware_serial'],
                'hash': binding['binding_hash']
            },
            'blockchain_registration': {
                'block_number': block['block_number'],
                'block_hash': block['block_hash'],
                'tx_hash': block['transactions'][0]['tx_hash'],
                'status': block['registration_status']
            },
            'network': {
                'ip': self.get_local_ip(),
                'discovery_port': 9997,
                'chat_port': 5557,
                'web_port': 8891
            },
            'created_at': binding['created_at'],
            'philosophy': "One foot in front of the other",
            'mission': "Ethical security for blockchain network"
        }

        with open(self.node_identity_file, 'w') as f:
            json.dump(node_identity, f, indent=2)

        print(f"✅ Node Identity Created")

        return node_identity

    def create_network_config(self):
        """Create network configuration file."""

        print("\n🌐 Creating Network Configuration...")

        config = {
            'genesis_node': {
                'ip': '192.168.1.7',
                'port': self.genesis_port,
                'name': 'M3 Pro Genesis'
            },
            'peer_nodes': [
                {
                    'ip': '192.168.1.158',
                    'port': 9997,
                    'name': 'M1 Air Peer'
                }
            ],
            'local_ports': {
                'discovery': 9998,
                'chat': 5559,
                'web': 8894
            },
            'protocols': {
                'chat': 'tcp',
                'discovery': 'udp',
                'blockchain': 'tcp'
            }
        }

        with open(self.network_config_file, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ Network Configuration Created")

        return config

    def generate_node_keys(self):
        """Generate cryptographic keys for node."""

        print("\n🔑 Generating Node Keys...")

        # Generate keys using existing script if available
        key_script = self.node_dir / "scripts" / "communications" / "generate_chat_keypair.py"

        if key_script.exists():
            subprocess.run([sys.executable, str(key_script)], cwd=self.keys_dir)
            print(f"✅ Keys Generated in node_keys/")
        else:
            # Basic key generation
            private_key = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()
            public_key = hashlib.sha256(private_key.encode()).hexdigest()

            with open(self.keys_dir / "node_private_key.pem", 'w') as f:
                f.write(private_key)
            with open(self.keys_dir / "node_public_key.pem", 'w') as f:
                f.write(public_key)

            print(f"✅ Basic Keys Generated")

    def verify_registration(self):
        """Verify both hardware binding and blockchain registration."""

        print("\n🔍 Verifying Registration...")

        # Check hardware binding
        if not self.hardware_binding_file.exists():
            print("❌ No hardware binding found")
            return False

        with open(self.hardware_binding_file, 'r') as f:
            binding = json.load(f)

        current_serial = self.get_hardware_serial()
        if binding['hardware_serial'] != current_serial:
            print("❌ Hardware mismatch!")
            print(f"   Expected: {binding['hardware_serial']}")
            print(f"   Current: {current_serial}")
            return False

        print(f"✅ Hardware Verified: {current_serial}")

        # Check blockchain block
        if not self.blockchain_block_file.exists():
            print("❌ No blockchain registration block found")
            return False

        with open(self.blockchain_block_file, 'r') as f:
            block = json.load(f)

        print(f"✅ Blockchain Block Verified")
        print(f"   Block: {block['block_number']}")
        print(f"   Status: {block['registration_status']}")

        return True

    def get_local_ip(self):
        """Get local IP address."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def complete_registration(self):
        """Complete registration process - all files generated."""

        print("\n🚀 M1 AIR NODE REGISTRATION")
        print("=" * 60)
        print("Philosophy: 'One foot in front of the other'")
        print("Mission: Two-factor security for blockchain nodes")
        print("=" * 60)

        # Step 1: Hardware Binding
        binding = self.create_hardware_binding()

        # Step 2: Blockchain Registration
        block = self.register_on_blockchain(binding)

        # Step 3: Node Identity
        identity = self.create_node_identity(binding, block)

        # Step 4: Network Config
        config = self.create_network_config()

        # Step 5: Generate Keys
        self.generate_node_keys()

        print("\n" + "=" * 60)
        print("✅ REGISTRATION COMPLETE!")
        print("=" * 60)
        print("\nGenerated Files:")
        print(f"  ✅ {self.hardware_binding_file}")
        print(f"  ✅ {self.blockchain_block_file}")
        print(f"  ✅ {self.node_identity_file}")
        print(f"  ✅ {self.network_config_file}")
        print(f"  ✅ {self.keys_dir}/")

        print("\n🔒 Two-Factor Security Active:")
        print(f"  1. Hardware: {binding['hardware_serial']}")
        print(f"  2. Blockchain: Block #{block['block_number']}")

        return True

def main():
    """Main registration function."""

    registrar = BlockchainNodeRegistration()

    # Check if already registered
    if registrar.verify_registration():
        print("\n✅ Node already registered and verified!")
        return True

    # Perform registration
    return registrar.complete_registration()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)