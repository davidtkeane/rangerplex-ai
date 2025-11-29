#!/usr/bin/env python3
"""
M3 Pro → M4 Reliable Blockchain File Transfer (Any File Type)
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Universal file sharing to M4
Mission: Send any file type from M3 Pro Genesis to M4 third peer node
"""

import os
import json
import socket
import hashlib
import time
import struct
from datetime import datetime
from pathlib import Path

class M4BlockchainFileSender:
    def __init__(self):
        self.m4_target_ip = None  # Will be discovered
        self.transfer_port = 9999  # Blockchain transfer port
        self.file_folder = "./"  # Current directory
        self.chunk_size = 32768  # 32KB chunks for reliable transfer
        
    def find_available_files(self):
        """Find available files to send to M4"""
        file_extensions = ['.md', '.txt', '.pdf', '.png', '.jpg', '.json', '.zip', '.mp4', '.mov', '.doc', '.xlsx']
        files = []
        
        # Scan current directory for files
        for ext in file_extensions:
            files.extend(Path(self.file_folder).glob(f"*{ext}"))
        
        return [str(f) for f in files if os.path.isfile(f)]
    
    def discover_m4_node(self):
        """Auto-discover M4 node on network"""
        print("🔍 DISCOVERING M4 NODE FOR FILE TRANSFER")
        print("-" * 50)
        
        # Get our network range
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                my_ip = s.getsockname()[0]
            
            print(f"📍 M3 Pro Genesis IP: {my_ip}")
            
            # Calculate network range  
            ip_parts = my_ip.split('.')
            network_base = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}"
            
            # Look for new nodes (skip known devices)
            known_devices = [my_ip, "192.168.1.23"]  # M3 Pro and M1 Air
            
            print(f"🌐 Scanning for M4 node...")
            print(f"💡 Excluding known devices: M3 Pro, M1 Air (.23)")
            
            # Test common IP ranges
            test_ips = [f"{network_base}.{i}" for i in [24, 25, 26, 27, 28, 29, 30, 4, 5, 6, 7, 8, 9, 10]]
            
            for ip in test_ips:
                if ip not in known_devices:
                    try:
                        # Test for blockchain receiver service
                        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                            s.settimeout(0.5)
                            result = s.connect_ex((ip, 9999))
                            if result == 0:
                                print(f"🎉 POTENTIAL M4 NODE FOUND!")
                                print(f"📍 M4 IP: {ip}")
                                print(f"🔗 Blockchain Port: RESPONSIVE")
                                self.m4_target_ip = ip
                                return ip
                    except:
                        pass
                    
                    print(f"📡 Scanned {ip} - No response")
            
            print("❌ No M4 node found on network")
            return None
            
        except Exception as e:
            print(f"❌ M4 discovery failed: {e}")
            return None
    
    def get_file_info(self, file_path):
        """Get file information for blockchain record"""
        try:
            file_stat = os.stat(file_path)
            file_size = file_stat.st_size
            
            # Calculate file hash for integrity
            with open(file_path, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            
            return {
                'filename': os.path.basename(file_path),
                'size': file_size,
                'hash': file_hash,
                'timestamp': datetime.now().isoformat(),
                'file_type': os.path.splitext(file_path)[1][1:].lower()
            }
        except Exception as e:
            print(f"❌ Error getting file info: {e}")
            return None
    
    def send_file_to_m4(self, file_path):
        """Send any file to M4 via reliable blockchain protocol"""
        print(f"📄 RELIABLE BLOCKCHAIN FILE TRANSFER: M3 → M4")
        print("=" * 70)
        print(f"📁 File: {os.path.basename(file_path)}")
        print(f"🎯 Target: M4 Node ({self.m4_target_ip})")
        print(f"🌐 Protocol: RangerCode Universal File Transfer")
        print(f"🔒 Method: Chunk-by-chunk with acknowledgments")
        print(f"🏛️ From: RangerNode-001-Genesis (M3 Pro)")
        print(f"🛰️ To: RangerNode-003-M4 (Third Peer)")
        
        # Get file information
        file_info = self.get_file_info(file_path)
        if not file_info:
            return False
        
        print(f"📊 File Size: {file_info['size']:,} bytes")
        if file_info['size'] > 1024:
            print(f"📏 File Size: {file_info['size'] / 1024:.1f} KB")
        if file_info['size'] > 1024*1024:
            print(f"📏 File Size: {file_info['size'] / (1024*1024):.1f} MB")
        
        print(f"📋 File Type: .{file_info['file_type']}")
        print(f"🔒 Blockchain Hash: {file_info['hash'][:16]}...")
        
        # Read file data
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return False
        
        # Calculate chunks (adaptive chunk size based on file size)
        if file_info['size'] < 1024*1024:  # < 1MB
            chunk_size = 8192   # 8KB for small files
        else:
            chunk_size = self.chunk_size  # 32KB for larger files
        
        total_chunks = (len(file_data) + chunk_size - 1) // chunk_size
        print(f"📦 Chunk Size: {chunk_size:,} bytes")
        print(f"📈 Total Chunks: {total_chunks}")
        
        # Connect to M4 and transfer
        try:
            print(f"\n🔌 Establishing reliable file transfer connection to M4...")
            
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(60)
                s.connect((self.m4_target_ip, self.transfer_port))
                print(f"✅ Connected to M4 Node!")
                
                # Send file info first
                file_info_json = json.dumps(file_info).encode('utf-8')
                info_size = len(file_info_json)
                
                print(f"📋 Sending file information...")
                s.send(struct.pack('!I', info_size))
                s.send(file_info_json)
                
                # Wait for info acknowledgment
                ack = s.recv(4)
                if ack != b'INFO':
                    print(f"❌ File info not acknowledged by M4")
                    return False
                
                print(f"✅ File info acknowledged by M4")
                
                # Send total chunks count
                s.send(struct.pack('!I', total_chunks))
                
                # Send chunks with acknowledgment
                print(f"\n📦 SENDING FILE CHUNKS TO M4:")
                print("-" * 50)
                
                start_time = time.time()
                
                for chunk_num in range(total_chunks):
                    # Get chunk data
                    start_pos = chunk_num * chunk_size
                    end_pos = min(start_pos + chunk_size, len(file_data))
                    chunk_data = file_data[start_pos:end_pos]
                    
                    # Send chunk number and size
                    s.send(struct.pack('!II', chunk_num, len(chunk_data)))
                    
                    # Send chunk data
                    s.send(chunk_data)
                    
                    # Wait for chunk acknowledgment from M4
                    try:
                        ack = s.recv(8)
                        if len(ack) == 8:
                            ack_chunk_num, ack_status = struct.unpack('!II', ack)
                            
                            if ack_chunk_num == chunk_num and ack_status == 1:
                                # Calculate progress
                                progress = ((chunk_num + 1) / total_chunks) * 100
                                elapsed = time.time() - start_time
                                if elapsed > 0:
                                    speed_mbps = ((chunk_num + 1) * chunk_size / elapsed) / (1024 * 1024)
                                else:
                                    speed_mbps = 0
                                
                                print(f"\r📊 Progress: {progress:.1f}% | Chunk {chunk_num+1}/{total_chunks} | Speed: {speed_mbps:.1f} MB/s", end="", flush=True)
                            else:
                                print(f"\n❌ Chunk {chunk_num} not acknowledged by M4")
                                return False
                        else:
                            print(f"\n❌ Invalid acknowledgment from M4")
                            return False
                            
                    except socket.timeout:
                        print(f"\n❌ Timeout waiting for M4 acknowledgment")
                        return False
                
                print(f"\n✅ All chunks sent to M4 successfully!")
                
                # Wait for final confirmation
                print(f"⏳ Waiting for M4 final confirmation...")
                
                try:
                    final_ack = s.recv(8)
                    if final_ack == b'COMPLETE':
                        total_time = time.time() - start_time
                        avg_speed = (file_info['size'] / total_time) / (1024 * 1024) if total_time > 0 else 0
                        
                        print(f"\n🎉 M3 → M4 FILE TRANSFER COMPLETE!")
                        print("=" * 50)
                        print(f"📊 TRANSFER STATISTICS:")
                        print(f"   📁 File: {file_info['filename']}")
                        print(f"   📋 Type: .{file_info['file_type']}")
                        print(f"   📊 Size: {file_info['size']:,} bytes")
                        print(f"   📦 Chunks: {total_chunks}")
                        print(f"   ⏱️ Time: {total_time:.2f} seconds")
                        print(f"   🚀 Speed: {avg_speed:.2f} MB/s")
                        print(f"   ✅ Reliability: 100% (M4 confirmed)")
                        print(f"   🌐 Network: Genesis → Third Peer")
                        print(f"\n🌟 THREE-NODE RANGERCODE NETWORK ACTIVE!")
                        return True
                    else:
                        print(f"❌ M4 final confirmation failed")
                        return False
                        
                except socket.timeout:
                    print(f"❌ Timeout waiting for M4 confirmation")
                    return False
                    
        except Exception as e:
            print(f"❌ M4 connection error: {e}")
            return False

def main():
    """Main M3 to M4 file transfer interface"""
    
    print("📄 RANGERCODE M3 → M4 UNIVERSAL FILE SENDER")
    print("=" * 70)
    print("🏔️ Philosophy: 'One foot in front of the other'")
    print("🎯 Mission: Send any file type to M4 third peer")
    print("🔒 Method: Reliable blockchain protocol")
    print("=" * 70)
    
    sender = M4BlockchainFileSender()
    
    # Discover M4 node
    m4_ip = sender.discover_m4_node()
    if not m4_ip:
        print("\n❌ M4 DISCOVERY FAILED")
        print("💡 Ensure M4 is connected and running receiver script")
        print("💡 M4 should run: python3 receive_file_from_m3.py")
        return
    
    # Find available files
    files = sender.find_available_files()
    
    if not files:
        print("❌ No files found!")
        print(f"💡 Place files in: {sender.file_folder}")
        return
    
    print(f"\n📁 Found {len(files)} file(s) available for M4 transfer:")
    print("-" * 40)
    
    for i, file_path in enumerate(files):
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_ext = os.path.splitext(file_path)[1]
        print(f"   {i+1}. {filename} ({file_size:,} bytes) {file_ext}")
    
    # Select file to send
    try:
        print(f"\n🎯 Which file to send to M4?")
        choice = int(input(f"Enter number (1-{len(files)}): ")) - 1
        
        if 0 <= choice < len(files):
            selected_file = files[choice]
            
            print(f"\n🚀 Starting M3 → M4 file transfer...")
            success = sender.send_file_to_m4(selected_file)
            
            if success:
                print(f"\n🌟 M3 → M4 FILE TRANSFER SUCCESS!")
                print("💡 M4 received file via RangerCode blockchain!")
                print("📁 File available in M4's blockchain_files/ directory")
                print("🌐 Three-node network file sharing operational!")
            else:
                print(f"\n❌ M3 → M4 file transfer failed!")
                
        else:
            print("❌ Invalid selection")
            
    except ValueError:
        print("❌ Invalid input")
    except KeyboardInterrupt:
        print("\n🛑 File transfer cancelled")

if __name__ == "__main__":
    main()