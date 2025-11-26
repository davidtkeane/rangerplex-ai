-- 🍽️ Restaurant Memory Schema
-- Based on RangerOS "Restaurant Memory" System by Seamus
-- Manages browser tab memory with active/phantom engine architecture

CREATE TABLE IF NOT EXISTS memory_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT NOT NULL UNIQUE,
    tab_id TEXT NOT NULL,                           -- Browser tab identifier
    conversation_content TEXT,                      -- Chat/editor content snapshot
    memory_recipe_used TEXT,                        -- 'quick_snapshot', 'deep_freeze', 'hot_serve'
    engine_assignment TEXT NOT NULL,                -- 'active_engine' or 'phantom_engine'
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP,
    quality_rating REAL DEFAULT 10.0,               -- Memory preservation quality (0-10)
    cosmic_power_used REAL,                         -- Resource consumption metric
    status TEXT DEFAULT 'cooking',                  -- 'cooking', 'served', 'stored', 'archived'
    chef_satisfaction TEXT,                         -- 'excellent', 'good', 'needs_improvement'
    restoration_count INTEGER DEFAULT 0,            -- How many times tab was restored

    INDEX idx_operation_id (operation_id),
    INDEX idx_tab_id (tab_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- Memory Recipes (restoration strategies)
CREATE TABLE IF NOT EXISTS memory_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_name TEXT NOT NULL UNIQUE,
    description TEXT,
    freeze_strategy TEXT,                           -- 'full_state', 'dom_only', 'minimal'
    thaw_priority INTEGER DEFAULT 5,                -- 1-10 (higher = faster restoration)
    memory_threshold_mb REAL DEFAULT 100.0,         -- Trigger threshold
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Building Support (cross-tab coordination)
CREATE TABLE IF NOT EXISTS building_support (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    support_id TEXT NOT NULL UNIQUE,
    requesting_tab TEXT NOT NULL,
    assisting_tab TEXT,
    support_type TEXT,                              -- 'resource_share', 'data_sync', 'state_backup'
    status TEXT DEFAULT 'pending',                  -- 'pending', 'active', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    INDEX idx_support_status (status),
    INDEX idx_requesting_tab (requesting_tab)
);

-- Insert default recipes
INSERT OR IGNORE INTO memory_recipes (recipe_name, description, freeze_strategy, thaw_priority) VALUES
('quick_snapshot', 'Fast tab suspension for immediate restoration', 'minimal', 10),
('deep_freeze', 'Complete state preservation for long-term storage', 'full_state', 5),
('hot_serve', 'Keep tab warm for instant activation', 'dom_only', 9);
