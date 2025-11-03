-- ============================================
-- Needs Connect Database Schema
-- ============================================
-- This schema defines the database structure for the Needs Connect platform
-- which connects helpers with non-profits to fulfill their needs.

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS funding;
DROP TABLE IF EXISTS baskets;
DROP TABLE IF EXISTS needs;
DROP TABLE IF EXISTS users;

-- ============================================
-- Table: users
-- ============================================
-- Stores user information for both helpers and nonprofit managers
-- Helpers can browse and fund needs
-- Managers can create and manage needs for their organizations
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('helper', 'manager') DEFAULT 'helper',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: needs
-- ============================================
-- Stores needs/requests posted by nonprofit managers
-- Each need represents an item or service required by a nonprofit
-- Tracks fulfillment progress through quantity_fulfilled
CREATE TABLE needs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    quantity_fulfilled INT DEFAULT 0,
    priority ENUM('urgent', 'high', 'normal') DEFAULT 'normal',
    category VARCHAR(50),
    org_type VARCHAR(50) DEFAULT 'other',
    needed_by DATE,
    is_perishable TINYINT(1) DEFAULT 0,
    bundle_tag ENUM('basic_food','winter_clothing','hygiene_kit','cleaning_supplies','beautification','other') DEFAULT 'other',
    service_required TINYINT(1) DEFAULT 0,
    request_count INT DEFAULT 0,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_quantity_fulfilled CHECK (quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: baskets
-- ============================================
-- Stores items that helpers have added to their basket/cart
-- Represents intent to fund before actual funding is confirmed
-- Allows users to collect multiple needs before committing
CREATE TABLE baskets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    need_id INT,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    CONSTRAINT check_basket_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: funding
-- ============================================
-- Records completed funding transactions
-- Tracks which helper funded which need and for what amount
-- This is the permanent record of contributions made
CREATE TABLE funding (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    need_id INT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    funded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    CONSTRAINT check_funding_quantity CHECK (quantity > 0),
    CONSTRAINT check_funding_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Indexes for Performance Optimization
-- ============================================
-- Create indexes on foreign keys and commonly queried columns
CREATE INDEX idx_needs_manager_id ON needs(manager_id);
CREATE INDEX idx_needs_priority ON needs(priority);
CREATE INDEX idx_needs_category ON needs(category);
CREATE INDEX idx_needs_needed_by ON needs(needed_by);
CREATE INDEX idx_needs_bundle_tag ON needs(bundle_tag);
CREATE INDEX idx_needs_request_count ON needs(request_count);
CREATE INDEX idx_baskets_user_id ON baskets(user_id);
CREATE INDEX idx_baskets_need_id ON baskets(need_id);
CREATE INDEX idx_funding_user_id ON funding(user_id);
CREATE INDEX idx_funding_need_id ON funding(need_id);

-- ============================================
-- Table: distribution_events
-- ============================================
-- Schedules volunteer-driven activities tied to a need
CREATE TABLE distribution_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    need_id INT NOT NULL,
    event_type ENUM('delivery','cleanup','kit_build','distribution') NOT NULL,
    location VARCHAR(150),
    event_start DATETIME NOT NULL,
    event_end DATETIME,
    volunteer_slots INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: event_volunteers
-- ============================================
-- Tracks volunteer sign-ups for each distribution event
CREATE TABLE event_volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('confirmed','waitlist','cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES distribution_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event_user (event_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for events
CREATE INDEX idx_events_need_id ON distribution_events(need_id);
CREATE INDEX idx_events_event_start ON distribution_events(event_start);
CREATE INDEX idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_user_id ON event_volunteers(user_id);

-- ============================================
-- Schema Setup Complete
-- ============================================

