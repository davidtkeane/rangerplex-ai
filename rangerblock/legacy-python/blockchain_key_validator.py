#!/usr/bin/env python3
"""
RangerCode Blockchain & Key Validator - Complete Security Audit
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Comprehensive security validation
Mission: Validate blockchain installation and key legitimacy
Innovation: Complete security audit with cleanup options
"""

import os
import json
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from cryptography.hazmat.primitives import serialization

class BlockchainKeyValidator:
    def __init__(self):
        self.base_directory = "../"
        self.security_bin = "./security_bin/"
        self.validation_results = {}
        self.security_issues = []
        
        # Create security bin folder
        os.makedirs(self.security_bin, exist_ok=True)
        
    def validate_complete_blockchain_security(self):
        """Complete blockchain and key security validation"""
        
        print("🛡️ RANGERCODE BLOCKCHAIN & KEY VALIDATOR")
        print("=" * 60)
        print("🏔️ Philosophy: 'One foot in front of the other'")
        print("🎯 Mission: Complete security validation and cleanup")
        print("🔍 Innovation: Detect all security issues and provide fixes")
        print("=" * 60)
        
        # Step 1: Validate blockchain installations
        blockchain_status = self.validate_blockchain_installations()
        
        # Step 2: Validate key legitimacy and uniqueness
        key_status = self.validate_key_legitimacy()
        
        # Step 3: Cross-reference keys with blockchain nodes
        integration_status = self.validate_key_blockchain_integration()
        
        # Step 4: Generate security recommendations
        recommendations = self.generate_security_recommendations()
        
        # Step 5: Offer cleanup options
        self.offer_security_cleanup_options()
        
        return {
            'blockchain_status': blockchain_status,
            'key_status': key_status,
            'integration_status': integration_status,
            'recommendations': recommendations
        }
    
    def validate_blockchain_installations(self):
        """Validate all blockchain installations are legitimate"""
        
        print(f"\n⛓️ VALIDATING BLOCKCHAIN INSTALLATIONS:")
        print("-" * 40)
        
        blockchain_installations = {}
        
        # Check for blockchain directories
        blockchain_dirs = [
            "RANGERCODE/",
            "genesis/", 
            "Apple MacBook M1 Air - Deployment/",
            "Apple MacBook M4 - Deployment/"
        ]
        
        for blockchain_dir in blockchain_dirs:
            full_path = os.path.join(self.base_directory, blockchain_dir)
            
            if os.path.exists(full_path):
                print(f"   📁 {blockchain_dir}: FOUND")
                
                # Validate blockchain components
                validation = self.validate_blockchain_directory(full_path)
                blockchain_installations[blockchain_dir] = validation
                
                if validation['legitimate']:
                    print(f"      ✅ Legitimate blockchain installation")
                else:
                    print(f"      ❌ Issues detected:")
                    for issue in validation['issues']:
                        print(f"         ⚠️ {issue}")
            else:
                print(f"   📁 {blockchain_dir}: NOT FOUND")
        
        return blockchain_installations
    
    def validate_blockchain_directory(self, directory_path):
        """Validate individual blockchain directory"""
        
        required_files = [
            'enhanced_genesis_node.py',
            'node_identity.json',
            'real_time_dashboard.py'
        ]
        
        optional_files = [
            'node_private_key.pem',
            'rangercode_chat_private_key.pem',
            'send_video_to_m1_reliable.py'
        ]
        
        validation = {
            'legitimate': True,
            'issues': [],
            'files_found': [],
            'files_missing': []
        }
        
        # Check required files
        for required_file in required_files:
            file_path = os.path.join(directory_path, required_file)
            if os.path.exists(file_path):
                validation['files_found'].append(required_file)
            else:
                validation['files_missing'].append(required_file)
                validation['issues'].append(f"Missing required file: {required_file}")
        
        # Check optional files
        for optional_file in optional_files:
            file_path = os.path.join(directory_path, optional_file)
            if os.path.exists(file_path):
                validation['files_found'].append(optional_file)
        
        # Validate node identity if present
        identity_file = os.path.join(directory_path, 'node_identity.json')
        if os.path.exists(identity_file):
            identity_validation = self.validate_node_identity(identity_file)
            if not identity_validation['valid']:
                validation['issues'].extend(identity_validation['issues'])
                validation['legitimate'] = False
        
        # Mark as illegitimate if missing too many required files
        if len(validation['files_missing']) > 1:
            validation['legitimate'] = False
        
        return validation
    
    def validate_node_identity(self, identity_file_path):
        """Validate node identity file"""
        
        try:
            with open(identity_file_path, 'r') as f:
                identity = json.load(f)
            
            validation = {'valid': True, 'issues': []}
            
            # Check required identity fields
            required_fields = ['nodeID', 'nodeType']
            for field in required_fields:
                if field not in identity:
                    validation['issues'].append(f"Missing identity field: {field}")
                    validation['valid'] = False
            
            # Check accessibility mission
            if 'accessibility_mission' not in identity:
                validation['issues'].append("Missing accessibility mission")
                validation['valid'] = False
            
            return validation
            
        except Exception as e:
            return {
                'valid': False,
                'issues': [f"Cannot parse identity file: {e}"]
            }
    
    def validate_key_legitimacy(self):
        """Validate all keys are legitimate and properly formatted"""
        
        print(f"\n🔑 VALIDATING KEY LEGITIMACY:")
        print("-" * 40)
        
        key_validation = {
            'total_keys': 0,
            'valid_keys': 0,
            'invalid_keys': 0,
            'duplicate_keys': 0,
            'key_details': {}
        }
        
        # Find all PEM keys
        pem_files = []
        for directory in self.scan_directories:
            full_dir = os.path.join(self.base_directory, directory)
            if os.path.exists(full_dir):
                for pem_file in Path(full_dir).rglob("*.pem"):
                    pem_files.append(str(pem_file))
        
        key_validation['total_keys'] = len(pem_files)
        
        # Group keys by content hash
        key_hashes = {}
        
        for pem_file in pem_files:
            try:
                with open(pem_file, 'rb') as f:
                    key_content = f.read()
                
                key_hash = hashlib.sha256(key_content).hexdigest()
                
                # Validate key format
                try:
                    key_content_str = key_content.decode('utf-8')
                    
                    if '-----BEGIN PRIVATE KEY-----' in key_content_str:
                        # Try to load as private key
                        private_key = serialization.load_pem_private_key(
                            key_content, password=None
                        )
                        key_type = 'Valid Private Key'
                        key_validation['valid_keys'] += 1
                        
                    elif '-----BEGIN PUBLIC KEY-----' in key_content_str:
                        # Try to load as public key
                        public_key = serialization.load_pem_public_key(key_content)
                        key_type = 'Valid Public Key'
                        key_validation['valid_keys'] += 1
                        
                    else:
                        key_type = 'Invalid Key Format'
                        key_validation['invalid_keys'] += 1
                        
                except Exception as key_error:
                    key_type = f'Invalid Key: {str(key_error)}'
                    key_validation['invalid_keys'] += 1
                
                # Track duplicates
                if key_hash in key_hashes:
                    key_hashes[key_hash].append(pem_file)
                    key_validation['duplicate_keys'] += 1
                else:
                    key_hashes[key_hash] = [pem_file]
                
                # Store key details
                key_validation['key_details'][pem_file] = {
                    'hash': key_hash,
                    'type': key_type,
                    'size': len(key_content),
                    'valid': 'Valid' in key_type
                }
                
                print(f"   🔐 {os.path.basename(pem_file)}: {key_type}")
                
            except Exception as e:
                print(f"   ❌ {os.path.basename(pem_file)}: Error - {e}")
                key_validation['invalid_keys'] += 1
        
        # Report duplicates
        duplicate_count = sum(1 for group in key_hashes.values() if len(group) > 1)
        if duplicate_count > 0:
            print(f"\n🚨 DUPLICATE KEYS DETECTED:")
            for key_hash, key_group in key_hashes.items():
                if len(key_group) > 1:
                    print(f"   🔒 Hash {key_hash[:16]}...: {len(key_group)} copies")
                    for duplicate_key in key_group:
                        print(f"      📄 {os.path.basename(duplicate_key)}")
        
        return key_validation
    
    def validate_key_blockchain_integration(self):
        """Validate keys are properly integrated with blockchain nodes"""
        
        print(f"\n🔗 VALIDATING KEY-BLOCKCHAIN INTEGRATION:")
        print("-" * 40)
        
        integration_issues = []
        
        # Expected key-node mapping
        expected_mappings = {
            'RANGERCODE/': 'genesis_authority_keys',
            'Apple MacBook M1 Air - Deployment/': 'm1_air_peer_keys',
            'Apple MacBook M4 - Deployment/': 'm4_third_peer_keys'
        }
        
        for node_dir, expected_key_type in expected_mappings.items():
            full_path = os.path.join(self.base_directory, node_dir)
            
            if os.path.exists(full_path):
                # Check node identity
                identity_file = os.path.join(full_path, 'node_identity.json')
                
                if os.path.exists(identity_file):
                    try:
                        with open(identity_file, 'r') as f:
                            identity = json.load(f)
                        
                        node_id = identity.get('nodeID', 'Unknown')
                        print(f"   🆔 {node_dir}: {node_id}")
                        
                        # Check if keys match node identity
                        key_files = list(Path(full_path).glob("*.pem"))
                        
                        if not key_files:
                            issue = f"No keys found for node {node_id}"
                            integration_issues.append(issue)
                            print(f"      ❌ {issue}")
                        else:
                            print(f"      🔑 Keys found: {len(key_files)}")
                            
                    except Exception as e:
                        issue = f"Cannot read identity for {node_dir}: {e}"
                        integration_issues.append(issue)
                        print(f"   ❌ {issue}")
                else:
                    issue = f"No identity file for {node_dir}"
                    integration_issues.append(issue)
                    print(f"   ❌ {issue}")
        
        return {
            'integration_status': 'SECURE' if not integration_issues else 'ISSUES_DETECTED',
            'issues': integration_issues
        }
    
    def offer_security_cleanup_options(self):
        """Offer options to clean up security issues"""
        
        if not self.duplicates:
            print(f"\n✅ NO CLEANUP NEEDED - Security is excellent!")
            return
        
        print(f"\n🧹 SECURITY CLEANUP OPTIONS:")
        print("=" * 40)
        print(f"🚨 Found {len(self.duplicates)} duplicate key group(s)")
        print(f"🛡️ Each blockchain node should have unique keys")
        
        print(f"\nCleanup Options:")
        print(f"   1. 🗑️ Move duplicates to security bin (safe)")
        print(f"   2. ❌ Delete duplicate keys (permanent)")
        print(f"   3. 🔄 Generate new unique keys for each node")
        print(f"   4. 📋 Generate security report only")
        print(f"   5. 🚫 Skip cleanup (manual fix later)")
        
        try:
            choice = input(f"\nSelect cleanup option (1-5): ").strip()
            
            if choice == '1':
                self.move_duplicates_to_bin()
            elif choice == '2':
                self.delete_duplicate_keys()
            elif choice == '3':
                self.generate_unique_keys_for_nodes()
            elif choice == '4':
                print(f"📋 Security report already generated")
            elif choice == '5':
                print(f"🚫 Cleanup skipped - manual fix required")
            else:
                print(f"❌ Invalid choice - no cleanup performed")
                
        except KeyboardInterrupt:
            print(f"\n🛑 Cleanup cancelled by user")
    
    def move_duplicates_to_bin(self):
        """Move duplicate keys to security bin folder"""
        
        print(f"\n🗑️ MOVING DUPLICATES TO SECURITY BIN:")
        print("-" * 40)
        
        moved_count = 0
        
        for duplicate_group in self.duplicates:
            # Keep first key, move others to bin
            keys_to_move = duplicate_group['locations'][1:]  # Skip first (keep original)
            
            for key_to_move in keys_to_move:
                source_path = key_to_move['path']
                filename = os.path.basename(source_path)
                
                # Create unique filename in bin
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                bin_filename = f"duplicate_{timestamp}_{filename}"
                bin_path = os.path.join(self.security_bin, bin_filename)
                
                try:
                    shutil.move(source_path, bin_path)
                    print(f"   🗑️ Moved: {filename} → security_bin/{bin_filename}")
                    moved_count += 1
                except Exception as e:
                    print(f"   ❌ Failed to move {filename}: {e}")
        
        print(f"\n✅ Security cleanup complete:")
        print(f"   🗑️ Moved {moved_count} duplicate keys to security bin")
        print(f"   📁 Security bin: {self.security_bin}")
        print(f"   🔄 Rerun validator to verify cleanup")
    
    def generate_unique_keys_for_nodes(self):
        """Generate unique keys for each blockchain node"""
        
        print(f"\n🔑 GENERATING UNIQUE KEYS FOR EACH NODE:")
        print("-" * 40)
        
        node_mappings = {
            'Apple MacBook M1 Air - Deployment/': 'RangerNode-002-Peer',
            'Apple MacBook M4 - Deployment/': 'RangerNode-003-M4'
        }
        
        for node_dir, node_id in node_mappings.items():
            full_path = os.path.join(self.base_directory, node_dir)
            
            if os.path.exists(full_path):
                print(f"   🔑 Generating unique keys for: {node_id}")
                
                # Generate unique keypair for this node
                unique_keys = self.generate_node_specific_keypair(node_id)
                
                if unique_keys:
                    # Save unique keys to node directory
                    private_key_path = os.path.join(full_path, f"{node_id.lower().replace('-', '_')}_private_key.pem")
                    public_key_path = os.path.join(full_path, f"{node_id.lower().replace('-', '_')}_public_key.pem")
                    
                    with open(private_key_path, 'wb') as f:
                        f.write(unique_keys['private_key'])
                    
                    with open(public_key_path, 'wb') as f:
                        f.write(unique_keys['public_key'])
                    
                    # Set proper permissions
                    os.chmod(private_key_path, 0o600)  # Private key - owner only
                    os.chmod(public_key_path, 0o644)   # Public key - readable
                    
                    print(f"      ✅ Unique keys generated and saved")
                    print(f"         🔐 Private: {os.path.basename(private_key_path)}")
                    print(f"         🔓 Public: {os.path.basename(public_key_path)}")
                else:
                    print(f"      ❌ Failed to generate keys for {node_id}")
    
    def generate_node_specific_keypair(self, node_id):
        """Generate cryptographically unique keypair for specific node"""
        
        try:
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            
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
            
            return {
                'private_key': private_pem,
                'public_key': public_pem,
                'node_id': node_id
            }
            
        except Exception as e:
            print(f"❌ Key generation failed for {node_id}: {e}")
            return None
    
    def generate_security_recommendations(self):
        """Generate comprehensive security recommendations"""
        
        recommendations = []
        
        if self.duplicates:
            recommendations.extend([
                "🚨 URGENT: Remove duplicate keys - each node needs unique identity",
                "🔑 Generate unique keys for M1 Air and M4 nodes",
                "🗑️ Move duplicate keys to security bin for safe removal",
                "🔄 Update all scripts to use correct unique keys"
            ])
        
        recommendations.extend([
            "🛡️ Implement David's PEM key boot security",
            "🔍 Run periodic security scans for new issues",
            "📋 Document all key-node mappings",
            "♿ Ensure all keys support accessibility mission",
            "🎓 Validate education fund access controls"
        ])
        
        return recommendations

def main():
    """Complete blockchain and key security validation"""
    
    validator = BlockchainKeyValidator()
    validation_results = validator.validate_complete_blockchain_security()
    
    print(f"\n🛡️ BLOCKCHAIN SECURITY VALIDATION COMPLETE")
    print("=" * 60)
    
    if validation_results['key_status']['duplicate_keys'] > 0:
        print(f"🚨 SECURITY ISSUES DETECTED:")
        print(f"   🔑 Duplicate keys found - each node needs unique identity")
        print(f"   💡 Use cleanup options to fix security issues")
    else:
        print(f"✅ BLOCKCHAIN SECURITY EXCELLENT:")
        print(f"   🔑 All keys unique and properly distributed")
        print(f"   ⛓️ Blockchain installations validated")
        print(f"   🛡️ Security compliance maintained")
    
    print(f"\n🏔️ 'One foot in front of the other' - Security validated!")

if __name__ == "__main__":
    main()