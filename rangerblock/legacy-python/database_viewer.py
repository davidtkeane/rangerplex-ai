#!/usr/bin/env python3
"""
RangerChain Database Viewer - Explore All Historical Data
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Every transaction tells a story
Mission: Browse and analyze complete blockchain history from SQLite database
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
import webbrowser
import http.server
import socketserver
import threading
import time

class RangerChainDatabaseViewer:
    """Web-based viewer for RangerChain historical database"""
    
    def __init__(self, db_path="rangerchain_history.db"):
        self.db_path = Path(db_path)
        if not self.db_path.exists():
            print(f"❌ Database not found: {self.db_path}")
            print("Please run blockchain_logger.py first to create the database")
            return
        
        print(f"📚 Connected to RangerChain database: {self.db_path}")
    
    def generate_html_viewer(self):
        """Generate comprehensive HTML viewer for the database"""
        
        # Get all data
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get recent activity
        cursor.execute('''
            SELECT timestamp, 'TRANSACTION' as type, transaction_type, 
                   sender, receiver, amount, education_tithe, description, additional_data
            FROM transactions
            UNION ALL
            SELECT timestamp, 'BLOCK' as type, 
                   'BLOCK_MINED' as transaction_type,
                   NULL, NULL, total_amount, education_contribution,
                   'Block #' || block_number || ' mined (' || transaction_count || ' txs)',
                   '{"block_hash": "' || COALESCE(block_hash, 'unknown') || '"}'
            FROM blocks  
            WHERE block_number >= 0
            UNION ALL
            SELECT timestamp, 'EVENT' as type, event_type as transaction_type, 
                   node_id as sender, NULL, NULL, NULL, description, details
            FROM network_events
            ORDER BY timestamp DESC
            LIMIT 100
        ''')
        recent_activity = cursor.fetchall()
        
        # Get statistics
        cursor.execute('SELECT COUNT(*) FROM blocks')
        block_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM transactions')  
        tx_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0')
        total_value = cursor.fetchone()[0] or 0.0
        
        cursor.execute('SELECT COALESCE(MAX(running_total), 0) FROM education_fund')
        education_total = cursor.fetchone()[0] or 0.0
        
        # Get education fund history
        cursor.execute('''
            SELECT timestamp, contribution_amount, source_transaction, 
                   running_total, milestone_reached
            FROM education_fund 
            ORDER BY timestamp DESC
            LIMIT 50
        ''')
        education_history = cursor.fetchall()
        
        # Get all blocks
        cursor.execute('''
            SELECT block_number, timestamp, block_hash, transaction_count,
                   total_amount, education_contribution, mining_time_seconds
            FROM blocks 
            ORDER BY block_number DESC
        ''')
        blocks = cursor.fetchall()
        
        conn.close()
        
        html_content = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗄️ RangerChain Database Explorer</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #e8e8f0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            line-height: 1.6;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}

        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 10px;
            border: 2px solid #00ff88;
        }}

        .header h1 {{
            font-size: 2.2em;
            background: linear-gradient(45deg, #00ff88, #0088ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .stat-card {{
            background: rgba(30, 30, 60, 0.8);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }}

        .stat-value {{
            font-size: 2em;
            color: #00ff88;
            margin-bottom: 5px;
            font-weight: bold;
        }}

        .stat-label {{
            color: #ccccdd;
            font-size: 0.9em;
        }}

        .section {{
            background: rgba(30, 30, 60, 0.8);
            border: 2px solid #0088ff;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }}

        .section h2 {{
            color: #0088ff;
            margin-bottom: 15px;
            border-bottom: 2px solid #0088ff;
            padding-bottom: 5px;
        }}

        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}

        .table th, .table td {{
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #444;
        }}

        .table th {{
            background: rgba(0, 136, 255, 0.2);
            color: #0088ff;
            font-weight: bold;
        }}

        .table tr:hover {{
            background: rgba(255, 255, 255, 0.05);
        }}

        .activity-item {{
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            border-left: 4px solid;
        }}

        .activity-transaction {{ border-left-color: #00ff88; }}
        .activity-block {{ border-left-color: #ffaa00; }}
        .activity-event {{ border-left-color: #0088ff; }}

        .activity-time {{
            color: #888;
            font-size: 0.85em;
            float: right;
        }}

        .activity-type {{
            color: #00ff88;
            font-weight: bold;
            margin-right: 10px;
        }}

        .activity-desc {{
            margin-top: 5px;
            color: #ccc;
        }}

        .education-progress {{
            background: linear-gradient(90deg, #00ff88, #ffaa00);
            height: 20px;
            border-radius: 10px;
            margin: 10px 0;
            position: relative;
            overflow: hidden;
        }}

        .education-text {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #000;
            font-weight: bold;
            font-size: 0.8em;
        }}

        .tabs {{
            display: flex;
            margin-bottom: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 5px;
        }}

        .tab {{
            flex: 1;
            padding: 10px 20px;
            text-align: center;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
            color: #ccc;
        }}

        .tab.active {{
            background: rgba(0, 136, 255, 0.3);
            color: #0088ff;
        }}

        .tab-content {{
            display: none;
        }}

        .tab-content.active {{
            display: block;
        }}

        .milestone {{
            background: rgba(255, 170, 0, 0.2);
            border: 2px solid #ffaa00;
            border-radius: 5px;
            padding: 10px;
            margin: 5px 0;
            color: #ffaa00;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ RangerChain Database Explorer</h1>
            <p>💾 Complete historical record of David's revolutionary blockchain</p>
            <p>🏔️ "One foot in front of the other" - Every step preserved</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{block_count}</div>
                <div class="stat-label">📦 Total Blocks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{tx_count}</div>
                <div class="stat-label">💰 Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">€{total_value:.2f}</div>
                <div class="stat-label">💵 Total Value</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">€{education_total:.2f}</div>
                <div class="stat-label">🎓 Education Fund</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Education Fund Progress</h2>
            <div class="education-progress">
                <div class="education-text">€{education_total:.2f} of €7,100,000 goal ({(education_total/7100000*100):.6f}%)</div>
            </div>
            <p>🎯 Students that could be funded: <strong>{education_total/20000:.4f}</strong> (€20,000 per student per year)</p>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('activity')">📊 Recent Activity</div>
            <div class="tab" onclick="showTab('blocks')">⛏️ Block History</div>
            <div class="tab" onclick="showTab('education')">🎓 Education Fund</div>
        </div>

        <div id="activity" class="tab-content active">
            <div class="section">
                <h2>🕒 Recent Activity (Last 100 Events)</h2>
'''
        
        # Add recent activity
        for activity in recent_activity:
            activity_type_class = f"activity-{activity['type'].lower()}"
            timestamp_str = datetime.fromisoformat(activity['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            
            # Format description based on type
            if activity['type'] == 'TRANSACTION':
                if activity['sender'] and activity['receiver']:
                    desc = f"{activity['sender']} → {activity['receiver']}: €{activity['amount']:.2f}"
                    if activity['education_tithe']:
                        desc += f" (Education: €{activity['education_tithe']:.2f})"
                else:
                    desc = activity['description'] or activity['transaction_type']
            else:
                desc = activity['description'] or activity['transaction_type']
            
            html_content += f'''
                <div class="activity-item {activity_type_class}">
                    <div class="activity-time">{timestamp_str}</div>
                    <div class="activity-type">{activity['type']}: {activity['transaction_type']}</div>
                    <div class="activity-desc">{desc}</div>
                </div>
'''
        
        html_content += '''
            </div>
        </div>

        <div id="blocks" class="tab-content">
            <div class="section">
                <h2>⛏️ Complete Block History</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Block #</th>
                            <th>Timestamp</th>
                            <th>Hash</th>
                            <th>Transactions</th>
                            <th>Value</th>
                            <th>Education</th>
                            <th>Mine Time</th>
                        </tr>
                    </thead>
                    <tbody>
'''
        
        # Add blocks table
        for block in blocks:
            timestamp_str = datetime.fromisoformat(block['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            hash_short = block['block_hash'][:12] + '...' if block['block_hash'] else 'N/A'
            
            html_content += f'''
                        <tr>
                            <td>#{block['block_number']}</td>
                            <td>{timestamp_str}</td>
                            <td>{hash_short}</td>
                            <td>{block['transaction_count']}</td>
                            <td>€{block['total_amount']:.2f}</td>
                            <td>€{block['education_contribution']:.2f}</td>
                            <td>{block['mining_time_seconds']:.1f}s</td>
                        </tr>
'''
        
        html_content += '''
                    </tbody>
                </table>
            </div>
        </div>

        <div id="education" class="tab-content">
            <div class="section">
                <h2>🎓 Education Fund History</h2>
'''
        
        # Add education fund history
        for edu in education_history:
            timestamp_str = datetime.fromisoformat(edu['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            
            milestone_html = ""
            if edu['milestone_reached']:
                milestone_html = f'<div class="milestone">🎉 {edu["milestone_reached"]}</div>'
            
            html_content += f'''
                <div class="activity-item activity-transaction">
                    <div class="activity-time">{timestamp_str}</div>
                    <div class="activity-type">+€{edu['contribution_amount']:.2f}</div>
                    <div class="activity-desc">
                        From: {edu['source_transaction']} → Running Total: €{edu['running_total']:.2f}
                        {milestone_html}
                    </div>
                </div>
'''
        
        html_content += f'''
            </div>
        </div>

    </div>

    <script>
        function showTab(tabName) {{
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }}

        // Auto-refresh every 30 seconds
        setTimeout(() => {{
            location.reload();
        }}, 30000);

        console.log('🗄️ RangerChain Database Explorer loaded!');
        console.log('📚 Total records: {block_count} blocks, {tx_count} transactions');
        console.log('🎓 Education fund: €{education_total:.2f}');
    </script>
</body>
</html>'''
        
        return html_content
    
    def serve_viewer(self, port=8887):
        """Serve the database viewer on a local web server"""
        
        class DatabaseHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, viewer_instance=None, **kwargs):
                self.viewer = viewer_instance
                super().__init__(*args, **kwargs)
            
            def do_GET(self):
                if self.path == '/' or self.path == '/index.html':
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    html_content = self.viewer.generate_html_viewer()
                    self.wfile.write(html_content.encode())
                else:
                    super().do_GET()
        
        # Create handler with viewer instance
        handler = lambda *args, **kwargs: DatabaseHandler(*args, viewer_instance=self, **kwargs)
        
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                url = f"http://localhost:{port}"
                print(f"🌐 Database viewer running at: {url}")
                print("📊 Auto-refreshes every 30 seconds")
                print("💡 Port 8887 (avoiding Jupyter on 8888)")
                print("🛑 Press Ctrl+C to stop the server")
                
                # Open browser
                threading.Thread(target=lambda: (time.sleep(1), webbrowser.open(url))).start()
                
                httpd.serve_forever()
                
        except KeyboardInterrupt:
            print("\\n🛑 Database viewer stopped")
        except OSError as e:
            print(f"❌ Could not start server on port {port}: {e}")
            print(f"💡 Try a different port or check if port {port} is in use")

if __name__ == "__main__":
    print("🗄️ Starting RangerChain Database Explorer...")
    
    viewer = RangerChainDatabaseViewer()
    
    if viewer.db_path.exists():
        print("🚀 Starting web interface...")
        viewer.serve_viewer()
    else:
        print("Please run blockchain_logger.py first to create the database")
    
    def serve_viewer(self, port=8887):
        """Serve the database viewer on a local web server"""
        
        class DatabaseHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, viewer_instance=None, **kwargs):
                self.viewer = viewer_instance
                super().__init__(*args, **kwargs)
            
            def do_GET(self):
                if self.path == '/' or self.path == '/index.html':
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    html_content = self.viewer.generate_html_viewer()
                    self.wfile.write(html_content.encode())
                else:
                    super().do_GET()
        
        # Create handler with viewer instance
        handler = lambda *args, **kwargs: DatabaseHandler(*args, viewer_instance=self, **kwargs)
        
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                url = f"http://localhost:{port}"
                print(f"🌐 Database viewer running at: {url}")
                print("📊 Auto-refreshes every 30 seconds")
                print("💡 Port 8887 (avoiding Jupyter on 8888)")
                print("🛑 Press Ctrl+C to stop the server")
                
                # Open browser
                threading.Thread(target=lambda: (time.sleep(1), webbrowser.open(url))).start()
                
                httpd.serve_forever()
                
        except KeyboardInterrupt:
            print("\n🛑 Database viewer stopped")
        except OSError as e:
            print(f"❌ Could not start server on port {port}: {e}")
            print(f"💡 Try a different port or check if port {port} is in use")

if __name__ == "__main__":
    print("🗄️ Starting RangerChain Database Explorer...")
    
    viewer = RangerChainDatabaseViewer()
    
    if viewer.db_path.exists():
        print("🚀 Starting web interface...")
        viewer.serve_viewer()
    else:
        print("Please run blockchain_logger.py first to create the database")