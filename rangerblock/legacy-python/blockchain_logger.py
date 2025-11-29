#!/usr/bin/env python3
"""
RangerChain Transaction Logger - Preserve All History
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Every transaction tells the story
Mission: Log all blockchain activity to SQLite database for historical analysis
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
import hashlib

class RangerChainLogger:
    """Logs all blockchain activity to SQLite database for permanent history"""
    
    def __init__(self, db_path="rangerchain_history.db"):
        """Initialize the blockchain logger with database"""
        self.db_path = Path(db_path)
        self.init_database()
        print(f"📚 RangerChain Logger initialized: {self.db_path}")
    
    def init_database(self):
        """Create database tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                transaction_type TEXT NOT NULL,
                sender TEXT,
                receiver TEXT,
                amount REAL,
                education_tithe REAL,
                block_number INTEGER,
                transaction_hash TEXT,
                description TEXT,
                additional_data TEXT
            )
        ''')
        
        # Create blocks table  
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                block_number INTEGER UNIQUE NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                block_hash TEXT,
                previous_hash TEXT,
                transaction_count INTEGER DEFAULT 0,
                total_amount REAL DEFAULT 0.0,
                education_contribution REAL DEFAULT 0.0,
                mining_time_seconds REAL,
                chain_valid BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Create network_events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS network_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT NOT NULL,
                node_id TEXT,
                description TEXT,
                details TEXT
            )
        ''')
        
        # Create education_fund table  
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS education_fund (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                contribution_amount REAL NOT NULL,
                source_transaction TEXT,
                running_total REAL NOT NULL,
                milestone_reached TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Database tables initialized successfully")
    
    def log_genesis_creation(self):
        """Log the historic genesis block creation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Log genesis block
        cursor.execute('''
            INSERT INTO blocks (block_number, block_hash, previous_hash, transaction_count, 
                              total_amount, education_contribution, mining_time_seconds)
            VALUES (0, ?, "0", 0, 0.0, 0.0, 0.0)
        ''', ("genesis_" + hashlib.sha256(str(datetime.now()).encode()).hexdigest()[:16],))
        
        # Log genesis event
        cursor.execute('''
            INSERT INTO network_events (event_type, node_id, description, details)
            VALUES ("GENESIS_CREATED", "M3_PRO", "Historic Genesis Block Created", 
                   "First block in RangerChain universe - David''s 3-year vision realized")
        ''')
        
        # Log genesis transaction record
        cursor.execute('''
            INSERT INTO transactions (transaction_type, description, block_number, additional_data)
            VALUES ("GENESIS_BLOCK", "The foundation of RangerChain universe established", 0,
                   '{"historic_moment": true, "vision_years": 3, "creator": "David Keane"}')
        ''')
        
        conn.commit()
        conn.close()
        print("🏗️ Genesis creation logged to database")
    
    def log_transaction(self, tx_type, sender=None, receiver=None, amount=0.0, 
                       education_tithe=0.0, block_num=None, description="", **kwargs):
        """Log a transaction to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate transaction hash
        tx_data = f"{tx_type}_{sender}_{receiver}_{amount}_{datetime.now().isoformat()}"
        tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()[:16]
        
        cursor.execute('''
            INSERT INTO transactions (transaction_type, sender, receiver, amount, 
                                    education_tithe, block_number, transaction_hash, 
                                    description, additional_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (tx_type, sender, receiver, amount, education_tithe, block_num, 
              tx_hash, description, json.dumps(kwargs)))
        
        conn.commit()
        conn.close()
        
        # Update education fund if tithe was paid
        if education_tithe > 0:
            self.log_education_contribution(education_tithe, f"tx_{tx_hash}")
        
        print(f"💰 Transaction logged: {tx_type} - €{amount:.2f} (Education: €{education_tithe:.2f})")
    
    def log_block_mined(self, block_number, block_hash, previous_hash, 
                       transaction_count=0, total_amount=0.0, education_contribution=0.0, 
                       mining_time=30.0):
        """Log a newly mined block"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO blocks (block_number, block_hash, previous_hash, transaction_count,
                              total_amount, education_contribution, mining_time_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (block_number, block_hash, previous_hash, transaction_count, 
              total_amount, education_contribution, mining_time))
        
        # Log block event
        cursor.execute('''
            INSERT INTO network_events (event_type, node_id, description, details)
            VALUES ("BLOCK_MINED", "M3_PRO", ?, ?)
        ''', (f"Block #{block_number} mined successfully", 
              json.dumps({"education_contribution": education_contribution, 
                         "transaction_count": transaction_count})))
        
        conn.commit()
        conn.close()
        
        print(f"⛏️ Block #{block_number} logged to database (Education: €{education_contribution:.2f})")
    
    def log_education_contribution(self, amount, source):
        """Log education fund contribution and update running total"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get current total
        cursor.execute('SELECT COALESCE(MAX(running_total), 0) FROM education_fund')
        current_total = cursor.fetchone()[0] or 0.0
        new_total = current_total + amount
        
        # Check for milestones
        milestone = None
        milestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 7100000]
        for m in milestones:
            if current_total < m <= new_total:
                milestone = f"€{m:,} milestone reached!"
                break
        
        cursor.execute('''
            INSERT INTO education_fund (contribution_amount, source_transaction, 
                                      running_total, milestone_reached)
            VALUES (?, ?, ?, ?)
        ''', (amount, source, new_total, milestone))
        
        conn.commit()
        conn.close()
        
        if milestone:
            print(f"🎉 MILESTONE: {milestone}")
        
        print(f"📚 Education fund updated: +€{amount:.2f} → €{new_total:.2f} total")
    
    def log_network_event(self, event_type, node_id, description, details=None):
        """Log general network events"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO network_events (event_type, node_id, description, details)
            VALUES (?, ?, ?, ?)
        ''', (event_type, node_id, description, json.dumps(details) if details else None))
        
        conn.commit()
        conn.close()
        
        print(f"📡 Network event logged: {event_type} - {description}")
    
    def get_recent_activity(self, limit=20):
        """Get recent blockchain activity for display"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, 'TRANSACTION' as type, transaction_type, 
                   sender, receiver, amount, education_tithe, description
            FROM transactions
            UNION ALL
            SELECT timestamp, 'BLOCK' as type, 
                   'Block #' || block_number as transaction_type,
                   NULL, NULL, total_amount, education_contribution,
                   'Block mined with ' || transaction_count || ' transactions'
            FROM blocks  
            WHERE block_number > 0
            UNION ALL
            SELECT timestamp, 'EVENT' as type, event_type, 
                   node_id, NULL, NULL, NULL, description
            FROM network_events
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return results
    
    def get_education_fund_total(self):
        """Get current education fund total"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COALESCE(MAX(running_total), 0) FROM education_fund')
        total = cursor.fetchone()[0] or 0.0
        
        conn.close()
        return total
    
    def get_stats(self):
        """Get comprehensive blockchain statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Block count
        cursor.execute('SELECT COUNT(*) FROM blocks')
        block_count = cursor.fetchone()[0]
        
        # Transaction count  
        cursor.execute('SELECT COUNT(*) FROM transactions')
        tx_count = cursor.fetchone()[0]
        
        # Total value transacted
        cursor.execute('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0')
        total_value = cursor.fetchone()[0] or 0.0
        
        # Education fund
        cursor.execute('SELECT COALESCE(MAX(running_total), 0) FROM education_fund')
        education_total = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        return {
            'blocks': block_count,
            'transactions': tx_count, 
            'total_value': total_value,
            'education_fund': education_total,
            'avg_education_per_tx': (education_total / max(tx_count, 1))
        }

# Demo usage and historic logging
if __name__ == "__main__":
    print("🚀 Initializing RangerChain Historical Logger...")
    
    logger = RangerChainLogger()
    
    # Log the genesis creation
    logger.log_genesis_creation()
    
    # Log the historic test transactions from your blockchain
    logger.log_transaction(
        "MARKETPLACE_PURCHASE", "Alice", "Bob", 100.0, 10.0, 1,
        "Historic first transaction in RangerChain",
        marketplace_item="Digital Asset", historic=True
    )
    
    logger.log_block_mined(1, "c344dbe2bbb9e2bab36fc27f9c0da2349f6fa57c490c37add2019d09c37c6532", 
                          "genesis_hash", 1, 100.0, 10.0, 28.5)
    
    logger.log_transaction(
        "MARKETPLACE_PURCHASE", "Charlie", "David", 50.0, 5.0, 2,
        "Second historic transaction",
        marketplace_item="Educational Content"
    )
    
    logger.log_block_mined(2, "ce375d34c424323b235e797fb94b3a6097d05c6eef8c706a3df9f96b608811f4", 
                          "c344dbe2...", 1, 50.0, 5.0, 31.2)
    
    # Log system verification  
    logger.log_network_event("SYSTEM_VERIFICATION", "M3_PRO", 
                           "Complete system verification passed",
                           {"chain_valid": True, "total_blocks": 3, "total_fund": 35.0})
    
    # Log Genesis Node going live
    logger.log_network_event("GENESIS_NODE_LIVE", "M3_PRO",
                           "Genesis Node operational and ready for peers",
                           {"listening": True, "ready_for_peers": True, "historic_moment": True})
    
    # Show stats
    stats = logger.get_stats()
    print(f"\n📊 RangerChain Database Statistics:")
    print(f"   Blocks: {stats['blocks']}")  
    print(f"   Transactions: {stats['transactions']}")
    print(f"   Total Value: €{stats['total_value']:.2f}")
    print(f"   Education Fund: €{stats['education_fund']:.2f}")
    print(f"   Avg Education/TX: €{stats['avg_education_per_tx']:.2f}")
    
    print(f"\n✅ All historic blockchain activity preserved in {logger.db_path}")
    print("🏔️ 'One foot in front of the other' - Every step recorded for posterity!")