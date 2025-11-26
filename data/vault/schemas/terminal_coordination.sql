-- 🖥️ Terminal Coordination Schema
-- Based on RangerOS Phantom Wing Architecture
-- For managing terminal sessions with dual-engine support

CREATE TABLE IF NOT EXISTS terminal_coordination (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    terminal_type TEXT NOT NULL,                    -- 'integrated', 'xterm', 'external'
    engine_assignment TEXT NOT NULL,                -- 'active_engine' or 'phantom_engine'
    user_request TEXT,
    launch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    safety_checks_passed BOOLEAN DEFAULT 1,
    cosmic_power_allocated REAL DEFAULT 1.0,        -- Resource allocation (0.0-10.0)
    status TEXT DEFAULT 'active',                   -- 'active', 'completed', 'suspended', 'archived'
    supervisor_notes TEXT,

    -- Indexes for performance
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_launch_time (launch_time)
);

-- Terminal History (command log)
CREATE TABLE IF NOT EXISTS terminal_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    command TEXT NOT NULL,
    output TEXT,
    exit_code INTEGER,
    working_directory TEXT,
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,

    FOREIGN KEY (session_id) REFERENCES terminal_coordination(session_id) ON DELETE CASCADE,
    INDEX idx_session_history (session_id, execution_time)
);

-- Terminal State (for restoration)
CREATE TABLE IF NOT EXISTS terminal_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    scrollback_buffer TEXT,                         -- JSON array of terminal lines
    cursor_position TEXT,                           -- JSON: {row, col}
    working_directory TEXT,
    environment_vars TEXT,                          -- JSON object
    last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES terminal_coordination(session_id) ON DELETE CASCADE,
    INDEX idx_session_state (session_id, last_saved)
);
