-- ==============================================================================
-- MARGINS — An Interactive Personal Digital Library
-- Database Schema (MySQL 5.7+ / 8.0+)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS margins_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE margins_db;

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Books Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  cover_url TEXT DEFAULT NULL,
  genre VARCHAR(100) DEFAULT NULL,
  publication_year INT DEFAULT NULL,
  isbn VARCHAR(50) DEFAULT NULL,
  total_pages INT DEFAULT 0,
  current_page INT DEFAULT 0,
  status ENUM('READING', 'COMPLETED', 'WANT_TO_READ', 'PAUSED') DEFAULT 'WANT_TO_READ',
  rating TINYINT UNSIGNED DEFAULT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT DEFAULT NULL,
  started_at DATE DEFAULT NULL,
  completed_at DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_books_user (user_id),
  INDEX idx_books_status (status),
  INDEX idx_books_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Owner-curated public shelf. This keeps the featured reading list independent
-- from account data while still serving it through the database-backed API.
CREATE TABLE IF NOT EXISTS curated_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  author VARCHAR(255) NOT NULL,
  status ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Journal Entries Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  INDEX idx_journal_user (user_id),
  INDEX idx_journal_book (book_id),
  INDEX idx_journal_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Highlights / Passages Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS highlights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT DEFAULT NULL,
  passage TEXT NOT NULL,
  page_number INT DEFAULT NULL,
  personal_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  INDEX idx_highlights_user (user_id),
  INDEX idx_highlights_book (book_id),
  INDEX idx_highlights_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Tags and Normalized Relationship
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_entry_tags (
  journal_entry_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (journal_entry_id, tag_id),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES journal_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Reading Goals Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  target_books INT NOT NULL DEFAULT 12,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_year (user_id, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
