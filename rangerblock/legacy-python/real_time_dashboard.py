#!/usr/bin/env python3
"""
RangerChain Real-Time Dashboard - 100% REAL DATA ONLY
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Show only actual blockchain truth
Mission: Display ONLY real transactions and blocks from the actual blockchain
"""

import sqlite3
import json
import time
from datetime import datetime
from pathlib import Path
import http.server
import socketserver
import threading
import webbrowser

class RealTimeDashboard:
    """Real-time dashboard showing ONLY actual blockchain data"""
    
    def __init__(self, db_path="rangerchain_history.db"):
        self.db_path = Path(db_path)
        self.server = None
        
    def get_real_blockchain_data(self):
        """Get 100% real data from the actual blockchain database"""
        if not self.db_path.exists():
            return {
                'blocks': 0, 'transactions': 0, 'education_fund': 0.0,
                'recent_activity': [], 'is_live': False
            }
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get real statistics
        cursor.execute('SELECT COUNT(*) FROM blocks')
        block_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM transactions WHERE amount > 0')
        tx_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COALESCE(MAX(running_total), 0) FROM education_fund')
        education_fund = cursor.fetchone()[0] or 0.0
        
        cursor.execute('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0')
        total_value = cursor.fetchone()[0] or 0.0
        
        # Get ONLY real recent activity (last 50 events)
        cursor.execute('''
            SELECT timestamp, 'TRANSACTION' as type, transaction_type, 
                   sender, receiver, amount, education_tithe, description
            FROM transactions
            UNION ALL
            SELECT timestamp, 'BLOCK' as type, 
                   'BLOCK_MINED' as transaction_type,
                   NULL, NULL, total_amount, education_contribution,
                   'Block #' || block_number || ' mined (' || transaction_count || ' transactions)'
            FROM blocks  
            WHERE block_number >= 0
            UNION ALL
            SELECT timestamp, 'EVENT' as type, event_type as transaction_type, 
                   node_id as sender, NULL, NULL, NULL, description
            FROM network_events
            ORDER BY timestamp DESC
            LIMIT 50
        ''')
        recent_activity = cursor.fetchall()
        
        # Check if system is currently live (recent activity within 5 minutes)
        cursor.execute('''
            SELECT timestamp FROM network_events 
            WHERE event_type LIKE '%MINING%' OR event_type LIKE '%BLOCK%'
            ORDER BY timestamp DESC LIMIT 1
        ''')
        last_activity = cursor.fetchone()
        is_live = False
        if last_activity:
            last_time = datetime.fromisoformat(last_activity['timestamp'])
            is_live = (datetime.now() - last_time).total_seconds() < 300  # 5 minutes
        
        conn.close()
        
        return {
            'blocks': block_count,
            'transactions': tx_count,
            'total_value': total_value,
            'education_fund': education_fund,
            'recent_activity': recent_activity,
            'is_live': is_live,
            'last_updated': datetime.now().isoformat()
        }
    
    def generate_real_dashboard_html(self):
        """Generate HTML dashboard with ONLY real blockchain data"""
        data = self.get_real_blockchain_data()
        
        # Status indicators based on real data
        status_color = "#00ff88" if data['is_live'] else "#ffaa00"
        status_text = "🟢 LIVE" if data['is_live'] else "⏸️ OFFLINE"
        
        html = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔗 RangerChain REAL-TIME Dashboard</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            background: linear-gradient(135deg, #0f0f23 0%, #1e1e3f 50%, #2a2a5a 100%);
            color: #e8e8f0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
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
            background: rgba(30, 30, 60, 0.8);
            border: 2px solid {status_color};
            border-radius: 10px;
        }}

        .header h1 {{
            font-size: 2.2em;
            background: linear-gradient(45deg, #00ff88, #0088ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }}

        .status-badge {{
            display: inline-block;
            padding: 8px 16px;
            background: rgba({("0, 255, 136" if data['is_live'] else "255, 170, 0")}, 0.2);
            border: 2px solid {status_color};
            border-radius: 20px;
            color: {status_color};
            font-weight: bold;
            margin: 10px 0;
        }}

        .reality-check {{
            background: rgba(255, 170, 0, 0.1);
            border: 2px solid #ffaa00;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #ffaa00;
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
            font-size: 2.2em;
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

        .real-badge {{
            background: #00ff88;
            color: #000;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: bold;
        }}

        .progress-bar {{
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }}

        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #0088ff);
            border-radius: 10px;
            width: {min((data['education_fund']/7100000)*100, 100):.6f}%;
        }}

        .update-time {{
            text-align: center;
            color: #888;
            font-size: 0.9em;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 RangerChain REAL-TIME Dashboard</h1>
            <div class="status-badge">{status_text}</div>
            <p>💎 100% REAL blockchain data - No simulations, only truth</p>
            <p>🏔️ "One foot in front of the other" - Every step verified</p>
        </div>

        <div class="reality-check">
            <strong>🎯 REALITY CHECK:</strong> This dashboard shows ONLY actual blockchain data from your database.
            If you see "0" transactions, that means no real marketplace purchases have occurred yet.
            The education fund reflects only genuine blockchain activity, not simulated data.
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{data['blocks']}</div>
                <div class="stat-label">📦 Real Blocks <span class="real-badge">REAL</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{data['transactions']}</div>
                <div class="stat-label">💰 Real Transactions <span class="real-badge">REAL</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-value">€{data['total_value']:.2f}</div>
                <div class="stat-label">💵 Total Value <span class="real-badge">REAL</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-value">€{data['education_fund']:.2f}</div>
                <div class="stat-label">🎓 Education Fund <span class="real-badge">REAL</span></div>
            </div>
        </div>

        <div class="section">
            <h2>📚 Real Education Fund Progress</h2>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <p>🎯 Progress to €7,100,000 goal: <strong>{(data['education_fund']/7100000*100):.8f}%</strong></p>
            <p>🎓 Students fundable: <strong>{data['education_fund']/20000:.4f}</strong> (€20,000 per student per year)</p>
        </div>

        <div class="section">
            <h2>📊 REAL Transaction & Block Activity</h2>
            <p style="margin-bottom: 15px;">
                <span class="real-badge">100% REAL</span> 
                All data below comes directly from your blockchain database - no simulations!
            </p>
'''
        
        # Add real activity
        if data['recent_activity']:
            for activity in data['recent_activity']:
                activity_type_class = f"activity-{activity['type'].lower()}"
                timestamp_str = datetime.fromisoformat(activity['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
                
                # Format description
                if activity['type'] == 'TRANSACTION' and activity['sender'] and activity['receiver']:
                    desc = f"{activity['sender']} → {activity['receiver']}: €{activity['amount']:.2f}"
                    if activity['education_tithe']:
                        desc += f" (Education: €{activity['education_tithe']:.2f})"
                else:
                    desc = activity['description'] or activity['transaction_type']
                
                html += f'''
            <div class="activity-item {activity_type_class}">
                <div class="activity-time">{timestamp_str}</div>
                <div class="activity-type">{activity['type']}: {activity['transaction_type']}</div>
                <div class="activity-desc">{desc} <span class="real-badge">REAL</span></div>
            </div>
'''
        else:
            html += '''
            <div class="activity-item activity-event">
                <div class="activity-type">NO ACTIVITY YET</div>
                <div class="activity-desc">
                    🔍 No real blockchain activity detected. 
                    Start the enhanced genesis node to see real transactions here!
                </div>
            </div>
'''
        
        html += f'''
        </div>

        <div class="update-time">
            📊 Real-time data • Last updated: {datetime.fromisoformat(data['last_updated']).strftime('%Y-%m-%d %H:%M:%S')} 
            • Auto-refresh: 10s
        </div>
    </div>

    <script>
        // Real-time updates every 10 seconds
        setTimeout(() => {{
            location.reload();
        }}, 10000);

        console.log('🔗 RangerChain REAL-TIME Dashboard loaded!');
        console.log('💎 Showing 100% real blockchain data');
        console.log('📊 Blocks: {data['blocks']}, Transactions: {data['transactions']}, Education: €{data['education_fund']:.2f}');
    </script>
</body>
</html>'''
        
        return html
    
    def serve_real_dashboard(self, port=8889):
        """Serve the real-time dashboard"""
        
        class RealDashboardHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, dashboard_instance=None, **kwargs):
                self.dashboard = dashboard_instance
                super().__init__(*args, **kwargs)
            
            def do_GET(self):
                if self.path == '/' or self.path == '/index.html':
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.send_header('Cache-Control', 'no-cache')
                    self.end_headers()
                    html_content = self.dashboard.generate_real_dashboard_html()
                    self.wfile.write(html_content.encode())
                else:
                    super().do_GET()
        
        handler = lambda *args, **kwargs: RealDashboardHandler(*args, dashboard_instance=self, **kwargs)
        
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                url = f"http://localhost:{port}"
                print(f"🌐 REAL-TIME Dashboard running at: {url}")
                print("💎 Shows 100% real blockchain data only")
                print("🔄 Auto-refreshes every 10 seconds")
                print("🛑 Press Ctrl+C to stop")
                
                # Open browser
                threading.Thread(target=lambda: (time.sleep(1), webbrowser.open(url))).start()
                
                httpd.serve_forever()
                
        except KeyboardInterrupt:
            print("\n🛑 Real-time dashboard stopped")
        except OSError as e:
            print(f"❌ Could not start server on port {port}: {e}")

if __name__ == "__main__":
    print("🔗 Starting RangerChain REAL-TIME Dashboard...")
    print("💎 100% REAL DATA ONLY - No simulations or fake transactions")
    
    dashboard = RealTimeDashboard()
    dashboard.serve_real_dashboard()