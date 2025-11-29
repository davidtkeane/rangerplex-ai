#!/usr/bin/env python3
"""
Universal Cross-Node Chat Bridge - Professional Edition
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Intuitive blockchain chat
Mission: Outstanding chat experience between all blockchain nodes
Version: 2.0 - Complete UX overhaul
"""

import socket
import json
import time
import threading
from datetime import datetime
from pathlib import Path
import os
import sys
import select

# Add theme engine path
theme_path = Path(__file__).parent / "New-Nodes" / "M3Pro-Genesis" / "chat-themes"
if theme_path.exists():
    sys.path.insert(0, str(theme_path))
    try:
        from theme_engine import get_theme_engine
        THEME_ENGINE = get_theme_engine()
    except ImportError:
        THEME_ENGINE = None
else:
    THEME_ENGINE = None

# File transfer system
FILE_TRANSFER = None
try:
    # Try to import from M3Pro location
    sys.path.insert(0, str(Path(__file__).parent / "New-Nodes" / "M3Pro-Genesis" / "scripts" / "main"))
    from unified_file_transfer import UnifiedFileTransfer
    print("📁 File transfer system found!")
except ImportError:
    FILE_TRANSFER = None
    print("📁 File transfer system not available")

class UniversalChatBridge:
    def __init__(self):
        self.node_name = None
        self.current_node = None
        self.target_node = None
        self.target_ip = None
        self.bridge_port = 8899
        self.running = True
        self.in_chat = False
        self.listener_thread = None
        self.message_history = []
        self.max_history = 50

        # Define all nodes with their info
        self.node_network = {
            "M3": {
                "name": "M3 Pro Genesis",
                "ip": "192.168.1.7",
                "type": "genesis",
                "emoji": "🏛️"
            },
            "M1": {
                "name": "M1 Air Peer",
                "ip": "192.168.1.3",
                "type": "peer",
                "emoji": "🍎"
            },
            "M4": {
                "name": "M4 Max Compute",
                "ip": "192.168.1.4",  # Update if needed
                "type": "compute",
                "emoji": "⚡"
            },
            "Kali": {
                "name": "Kali VM Security",
                "ip": "192.168.66.2",
                "type": "security",
                "emoji": "🔒"
            },
            "Windows": {
                "name": "Windows VM",
                "ip": "192.168.66.3",  # Update if needed
                "type": "peer",
                "emoji": "🪟"
            }
        }

        # Chat modes
        self.chat_modes = {
            "direct": "Direct chat with single node",
            "broadcast": "Send to all online nodes",
            "group": "Group chat with selected nodes"
        }

        self.current_mode = "direct"
        self.group_nodes = []

        # Colors for terminal (optional - can be disabled)
        self.colors = {
            'header': '\033[95m',
            'info': '\033[94m',
            'success': '\033[92m',
            'warning': '\033[93m',
            'error': '\033[91m',
            'reset': '\033[0m',
            'bold': '\033[1m'
        }

    def clear_screen(self):
        """Clear terminal screen"""
        os.system('clear' if os.name != 'nt' else 'cls')

    def print_header(self, subtitle=""):
        """Print a nice header"""
        self.clear_screen()
        print("="*70)
        print(f"{self.colors['header']}🌐 RANGERCODE UNIVERSAL CHAT SYSTEM{self.colors['reset']}")
        if subtitle:
            print(f"   {subtitle}")
        print("="*70)

        if self.current_node:
            emoji = self.node_network[self.current_node]['emoji']
            name = self.node_network[self.current_node]['name']
            print(f"📍 You are: {emoji} {name}")

        if self.target_node and self.in_chat:
            target_emoji = self.node_network[self.target_node]['emoji']
            target_name = self.node_network[self.target_node]['name']
            status = self.check_node_online(self.target_node)
            status_icon = "🟢" if status else "🔴"
            print(f"💬 Chatting with: {target_emoji} {target_name} {status_icon}")

        print("="*70)

    def show_main_menu(self):
        """Show simplified main menu"""
        while self.running:
            self.print_header("MAIN MENU")

            # First, identify who you are
            if not self.current_node:
                print("\n🔐 IDENTIFY YOURSELF:")
                print("\n  Select your device:\n")
                nodes = list(self.node_network.keys())
                for i, key in enumerate(nodes, 1):
                    node = self.node_network[key]
                    print(f"  {i}. {node['emoji']} {node['name']} ({node['ip']})")

                print(f"\n  0. Exit")

                try:
                    choice = input("\n🎯 Your device (1-5): ").strip()
                    if choice == '0':
                        return

                    idx = int(choice) - 1
                    if 0 <= idx < len(nodes):
                        self.current_node = nodes[idx]
                        self.node_name = self.node_network[self.current_node]['name']

                        # Initialize file transfer system with node name
                        global FILE_TRANSFER
                        if FILE_TRANSFER is None:
                            try:
                                FILE_TRANSFER = UnifiedFileTransfer(node_name=self.current_node, theme_engine=THEME_ENGINE)
                                FILE_TRANSFER.start_receive_mode()
                                print(f"{self.colors['success']}📁 File transfer ready!{self.colors['reset']}")
                            except:
                                pass

                        continue
                except:
                    print(f"{self.colors['error']}❌ Invalid choice{self.colors['reset']}")
                    time.sleep(1)
                    continue

            # Now show chat options
            print("\n📡 QUICK ACTIONS:")
            print("\n  1. 💬 Start Chat         - Chat with another node")
            print("  2. 📊 Network Status     - Check who's online")
            print("  3. 📝 Message History    - View recent messages")
            print("  4. ⚙️  Settings          - Configure chat options")
            print("  5. 🔄 Switch Identity    - Change current node")
            print("\n  0. 🚪 Exit")

            choice = input("\n⚡ Action (1-5): ").strip()

            if choice == '0':
                break
            elif choice == '1':
                self.start_chat_menu()
            elif choice == '2':
                self.show_network_status()
            elif choice == '3':
                self.show_message_history()
            elif choice == '4':
                self.show_settings()
            elif choice == '5':
                self.current_node = None
                self.node_name = None
            else:
                print(f"{self.colors['error']}❌ Invalid choice{self.colors['reset']}")
                time.sleep(1)

    def start_chat_menu(self):
        """Simplified chat target selection"""
        while True:
            self.print_header("SELECT CHAT TARGET")

            print("\n🎯 WHO TO CHAT WITH:\n")

            # List available targets
            available = [(k, v) for k, v in self.node_network.items() if k != self.current_node]
            online_count = 0

            for i, (key, node) in enumerate(available, 1):
                status = self.check_node_online(key)
                if status:
                    online_count += 1
                status_icon = "🟢" if status else "🔴"
                print(f"  {i}. {status_icon} {node['emoji']} {node['name']} ({node['ip']})")

            print(f"\n  B. 📢 Broadcast to all ({online_count} online)")
            print(f"  G. 👥 Group chat setup")
            print(f"  M. 🔙 Back to menu")

            choice = input("\n💬 Choose target: ").strip().upper()

            if choice == 'M':
                return
            elif choice == 'B':
                self.start_broadcast_chat()
                return
            elif choice == 'G':
                self.setup_group_chat()
                return

            try:
                idx = int(choice) - 1
                if 0 <= idx < len(available):
                    self.target_node = available[idx][0]
                    self.target_ip = self.node_network[self.target_node]['ip']
                    self.start_direct_chat()
                    return
            except:
                print(f"{self.colors['error']}❌ Invalid choice{self.colors['reset']}")
                time.sleep(1)

    def start_direct_chat(self):
        """Enhanced direct chat session"""
        self.in_chat = True
        self.current_mode = "direct"

        # Start listener if needed
        if not self.listener_thread or not self.listener_thread.is_alive():
            self.listener_thread = threading.Thread(target=self.listen_for_messages, daemon=True)
            self.listener_thread.start()

        self.print_header(f"CHAT: {self.node_network[self.target_node]['name']}")
        self.show_chat_help()

        while self.in_chat:
            try:
                # Show prompt with connection status
                status = "🟢" if self.check_node_online(self.target_node) else "🔴"

                # Use theme prompt if available
                if THEME_ENGINE:
                    prompt = THEME_ENGINE.get_input_prompt(self.node_network[self.current_node]['name'])
                else:
                    prompt = f"\n{status} [{self.node_network[self.current_node]['emoji']}] > "

                message = input(prompt).strip()

                # Handle commands
                if message.startswith('/'):
                    self.handle_chat_command(message)
                elif message:
                    # Send regular message
                    if self.send_message(message, self.target_ip):
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        self.add_to_history('sent', self.target_node, message, timestamp)

                        # Use theme if available
                        if THEME_ENGINE:
                            print(THEME_ENGINE.format_sent_message(message, timestamp, target=self.target_node))
                        else:
                            print(f"✅ Sent at {timestamp}")
                    else:
                        print(f"{self.colors['error']}❌ Failed to send - node may be offline{self.colors['reset']}")

            except KeyboardInterrupt:
                print("\n💡 Use /quit to exit or /help for commands")
                continue

    def handle_chat_command(self, command):
        """Handle chat commands"""
        cmd = command.lower().split()[0]

        if cmd == '/quit' or cmd == '/q':
            self.in_chat = False
        elif cmd == '/help' or cmd == '/h':
            self.show_chat_help()
        elif cmd == '/clear' or cmd == '/c':
            self.print_header(f"CHAT: {self.node_network[self.target_node]['name']}")
            self.show_chat_help()
        elif cmd == '/status' or cmd == '/s':
            self.show_connection_status()
        elif cmd == '/history':
            self.show_recent_history(10)
        elif cmd == '/who':
            self.show_network_status(compact=True)
        elif cmd == '/switch':
            self.in_chat = False
            self.start_chat_menu()
        elif cmd == '/theme' or cmd == '/t':
            # Show theme menu while in chat
            if THEME_ENGINE:
                print("\n" + "─"*70)
                THEME_ENGINE.show_theme_menu()
                print("─"*70)
                # Redraw chat header after theme change
                self.print_header(f"CHAT: {self.node_network[self.target_node]['name']}")
                print(f"{self.colors['success']}💬 Back to chat - theme updated!{self.colors['reset']}")
            else:
                print("❌ Theme system not available")
        elif cmd == '/enhancements' or cmd == '/e':
            # Show enhancements menu
            if THEME_ENGINE:
                print("\n" + "─"*70)
                THEME_ENGINE.show_enhancements_menu()
                print("─"*70)
                print(f"{self.colors['success']}💬 Back to chat - enhancements updated!{self.colors['reset']}")
            else:
                print("❌ Enhancement system not available")
        elif cmd == '/send':
            # Send file command
            if FILE_TRANSFER:
                # Parse target if provided
                parts = command.split(maxsplit=1)
                if len(parts) > 1:
                    # Target specified
                    FILE_TRANSFER.send_file(target_node=parts[1])
                else:
                    # Will send to current chat target
                    FILE_TRANSFER.send_file(target_node=self.target_node)
            else:
                print("❌ File transfer not available")
        elif cmd == '/receive':
            # Toggle receive mode
            if FILE_TRANSFER:
                if FILE_TRANSFER.receiving:
                    FILE_TRANSFER.stop_receive_mode()
                else:
                    FILE_TRANSFER.start_receive_mode()
            else:
                print("❌ File transfer not available")
        elif cmd == '/transfers':
            # Show transfer history
            if FILE_TRANSFER:
                FILE_TRANSFER.show_transfer_history()
            else:
                print("❌ File transfer not available")
        else:
            print(f"❌ Unknown command: {command}")
            print("💡 Type /help for available commands")

    def show_chat_help(self):
        """Show chat commands"""
        print(f"\n{self.colors['info']}💡 CHAT COMMANDS:{self.colors['reset']}")
        print("  /help         (/h)  - Show this help")
        print("  /quit         (/q)  - Return to menu")
        print("  /clear        (/c)  - Clear screen")
        print("  /status       (/s)  - Connection status")
        print("  /theme        (/t)  - Change chat theme 🎨")
        print("  /enhancements (/e)  - Configure sounds & animations 🎬")
        print("  /send               - Send file to another node 📤")
        print("  /receive            - Toggle receive mode 📥")
        print("  /transfers          - Show transfer history 📊")
        print("  /history            - Show recent messages")
        print("  /who                - Who's online")
        print("  /switch             - Switch to another chat")
        print("\n" + "─"*70)

    def send_message(self, message, target_ip):
        """Send message to target"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5)
                s.connect((target_ip, self.bridge_port))

                msg_data = {
                    'type': 'chat',
                    'from': self.current_node,
                    'from_name': self.node_network[self.current_node]['name'],
                    'content': message,
                    'timestamp': datetime.now().isoformat(),
                    'mode': self.current_mode
                }

                s.send(json.dumps(msg_data).encode('utf-8'))
                response = s.recv(1024).decode('utf-8')
                return response == 'ACK'
        except Exception as e:
            return False

    def listen_for_messages(self):
        """Background listener for incoming messages"""
        server_socket = None
        try:
            server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server_socket.bind(('', self.bridge_port))
            server_socket.listen(5)
            server_socket.settimeout(1)

            while self.running:
                try:
                    client, addr = server_socket.accept()
                    threading.Thread(target=self.handle_incoming_message, args=(client, addr), daemon=True).start()
                except socket.timeout:
                    continue
                except:
                    if self.running:
                        break
        except Exception as e:
            print(f"⚠️ Listener error: {e}")
        finally:
            if server_socket:
                server_socket.close()

    def handle_incoming_message(self, client, addr):
        """Handle incoming message with better formatting"""
        try:
            data = client.recv(4096).decode('utf-8')
            msg = json.loads(data)

            if msg['type'] == 'chat':
                timestamp = datetime.now().strftime("%H:%M:%S")
                from_key = msg.get('from', 'Unknown')
                from_name = msg.get('from_name', 'Unknown')

                # Get emoji for sender
                sender_emoji = self.node_network.get(from_key, {}).get('emoji', '❓')

                # Format and display message
                if THEME_ENGINE:
                    print(THEME_ENGINE.format_received_message(from_name, msg['content'], timestamp))
                else:
                    print(f"\n📥 [{timestamp}] {sender_emoji} {from_name}:")
                    print(f"   💬 {msg['content']}")

                # Add to history
                self.add_to_history('received', from_key, msg['content'], timestamp)

                # Beep for notification (optional)
                print('\a', end='', flush=True)  # Terminal bell

                # Reshow prompt if in chat
                if self.in_chat:
                    status = "🟢" if self.check_node_online(self.target_node) else "🔴"
                    print(f"\n{status} [{self.node_network[self.current_node]['emoji']}] > ", end='', flush=True)

                client.send(b'ACK')
        except Exception as e:
            client.send(b'ERROR')
        finally:
            client.close()

    def check_node_online(self, node_key):
        """Quick check if node is online"""
        if node_key not in self.node_network:
            return False

        ip = self.node_network[node_key]['ip']
        if ip in ['TBD', None, '']:
            return False

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                s.connect((ip, self.bridge_port))
                s.close()
                return True
        except:
            return False

    def show_network_status(self, compact=False):
        """Show network status"""
        if not compact:
            self.print_header("NETWORK STATUS")

        print("\n📊 NODE STATUS:\n")

        for key, node in self.node_network.items():
            if node['ip'] not in ['TBD', None, '']:
                status = self.check_node_online(key)
                status_icon = "🟢 ONLINE " if status else "🔴 OFFLINE"
                is_you = " (YOU)" if key == self.current_node else ""
                print(f"  {status_icon} {node['emoji']} {node['name']}{is_you}")
                print(f"            IP: {node['ip']}")

        if not compact:
            input("\n🔙 Press Enter to continue...")

    def add_to_history(self, direction, node, message, timestamp):
        """Add message to history"""
        entry = {
            'direction': direction,
            'node': node,
            'message': message,
            'timestamp': timestamp
        }
        self.message_history.append(entry)

        # Keep only last N messages
        if len(self.message_history) > self.max_history:
            self.message_history = self.message_history[-self.max_history:]

    def show_message_history(self):
        """Show message history"""
        self.print_header("MESSAGE HISTORY")

        if not self.message_history:
            print("\n📭 No messages yet")
        else:
            print(f"\n📜 Last {min(20, len(self.message_history))} messages:\n")

            for entry in self.message_history[-20:]:
                node_info = self.node_network.get(entry['node'], {})
                emoji = node_info.get('emoji', '❓')
                name = node_info.get('name', 'Unknown')

                if entry['direction'] == 'sent':
                    print(f"📤 [{entry['timestamp']}] To {emoji} {name}:")
                else:
                    print(f"📥 [{entry['timestamp']}] From {emoji} {name}:")
                print(f"   {entry['message']}")
                print()

        input("\n🔙 Press Enter to continue...")

    def show_recent_history(self, count=10):
        """Show recent chat history in current chat"""
        if not self.message_history:
            print("📭 No recent messages")
            return

        recent = [h for h in self.message_history[-count:] if h['node'] == self.target_node]

        if not recent:
            print("📭 No recent messages with this node")
            return

        print("\n" + "─"*70)
        print("📜 RECENT HISTORY:")
        for entry in recent:
            if entry['direction'] == 'sent':
                print(f"  📤 [{entry['timestamp']}] You: {entry['message']}")
            else:
                print(f"  📥 [{entry['timestamp']}] Them: {entry['message']}")
        print("─"*70)

    def show_connection_status(self):
        """Show detailed connection status"""
        target_name = self.node_network[self.target_node]['name']
        target_ip = self.node_network[self.target_node]['ip']

        print("\n" + "─"*70)
        print("📡 CONNECTION STATUS:")
        print(f"  Target: {target_name}")
        print(f"  IP: {target_ip}")

        if self.check_node_online(self.target_node):
            print(f"  Status: 🟢 ONLINE")

            # Test latency
            start = time.time()
            self.check_node_online(self.target_node)
            latency = (time.time() - start) * 1000
            print(f"  Latency: {latency:.1f}ms")
        else:
            print(f"  Status: 🔴 OFFLINE")

        # Show message stats
        sent = len([h for h in self.message_history if h['direction'] == 'sent' and h['node'] == self.target_node])
        received = len([h for h in self.message_history if h['direction'] == 'received' and h['node'] == self.target_node])
        print(f"  Messages: {sent} sent, {received} received")
        print("─"*70)

    def show_settings(self):
        """Show settings menu"""
        self.print_header("SETTINGS")

        # Get current theme name
        current_theme = "Default"
        if THEME_ENGINE:
            current_theme = THEME_ENGINE.get_current_theme_name()

        print("\n⚙️ CHAT SETTINGS:\n")
        print(f"  1. Message History Size: {self.max_history}")
        print(f"  2. Notification Sound: {'ON' if True else 'OFF'}")
        print(f"  3. Show Timestamps: {'ON' if True else 'OFF'}")
        print(f"  4. Color Mode: {'ON' if self.colors['reset'] else 'OFF'}")
        print(f"  5. 🎨 Chat Theme: {current_theme}")
        print(f"\n  M. 🔙 Back to menu")

        choice = input("\n⚙️ Setting to change (1-5): ").strip()

        if choice == '1':
            try:
                new_size = int(input(f"New history size (current: {self.max_history}): "))
                self.max_history = new_size
                print("✅ Updated")
            except:
                print("❌ Invalid number")
        elif choice == '5':
            # Show theme selection menu
            if THEME_ENGINE:
                THEME_ENGINE.show_theme_menu()
            else:
                print("❌ Theme system not available")

        input("\n🔙 Press Enter to continue...")

    def start_broadcast_chat(self):
        """Start broadcast mode"""
        self.current_mode = "broadcast"
        self.in_chat = True

        self.print_header("BROADCAST MODE")
        print("\n📢 Broadcasting to ALL online nodes")
        print("💡 Messages will be sent to everyone who's online")

        # Check who's online
        online_nodes = []
        for key in self.node_network:
            if key != self.current_node and self.check_node_online(key):
                online_nodes.append(key)

        print(f"\n🟢 Online nodes ({len(online_nodes)}):")
        for node in online_nodes:
            print(f"  • {self.node_network[node]['emoji']} {self.node_network[node]['name']}")

        if not online_nodes:
            print("\n❌ No nodes online for broadcast")
            input("Press Enter to continue...")
            self.in_chat = False
            return

        print("\nType /quit to exit broadcast mode\n")
        print("─"*70)

        while self.in_chat:
            message = input(f"\n📢 [BROADCAST] > ").strip()

            if message == '/quit':
                self.in_chat = False
                break
            elif message:
                sent = 0
                for node in online_nodes:
                    if self.send_message(f"[BROADCAST] {message}", self.node_network[node]['ip']):
                        sent += 1

                print(f"✅ Broadcast sent to {sent}/{len(online_nodes)} nodes")

    def setup_group_chat(self):
        """Setup group chat"""
        self.print_header("GROUP CHAT SETUP")

        print("\n👥 Select nodes for group chat:\n")

        available = [(k, v) for k, v in self.node_network.items() if k != self.current_node]
        selected = []

        for i, (key, node) in enumerate(available, 1):
            status = "🟢" if self.check_node_online(key) else "🔴"
            print(f"  {i}. {status} {node['emoji']} {node['name']}")

        print("\n💡 Enter numbers separated by spaces (e.g., 1 3 4)")
        print("   Or 'all' for all online nodes")

        choice = input("\n👥 Select: ").strip().lower()

        if choice == 'all':
            selected = [k for k, v in available if self.check_node_online(k)]
        else:
            try:
                indices = [int(x) - 1 for x in choice.split()]
                selected = [available[i][0] for i in indices if 0 <= i < len(available)]
            except:
                print("❌ Invalid selection")
                time.sleep(1)
                return

        if not selected:
            print("❌ No nodes selected")
            time.sleep(1)
            return

        self.group_nodes = selected
        self.current_mode = "group"
        self.in_chat = True

        self.print_header(f"GROUP CHAT ({len(selected)} nodes)")

        print("\n👥 Group members:")
        for node in selected:
            print(f"  • {self.node_network[node]['emoji']} {self.node_network[node]['name']}")

        print("\nType /quit to exit group chat\n")
        print("─"*70)

        while self.in_chat:
            message = input(f"\n👥 [GROUP] > ").strip()

            if message == '/quit':
                self.in_chat = False
                break
            elif message:
                sent = 0
                for node in selected:
                    if self.send_message(f"[GROUP] {message}", self.node_network[node]['ip']):
                        sent += 1

                print(f"✅ Sent to {sent}/{len(selected)} group members")

    def run(self):
        """Main application loop"""
        try:
            print("\n🚀 Starting Universal Chat System...")
            print("🏔️ Philosophy: 'One foot in front of the other'")
            time.sleep(1)

            self.show_main_menu()

        except KeyboardInterrupt:
            print("\n\n⚠️ Use menu options to exit properly")
        finally:
            self.running = False
            print("\n👋 Goodbye! Thank you for using RangerCode Chat")
            print("🌟 'One foot in front of the other' - Keep building!")

def main():
    """Main entry point"""
    bridge = UniversalChatBridge()
    bridge.run()

if __name__ == "__main__":
    main()