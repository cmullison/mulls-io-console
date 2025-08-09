-- Landing pages main table
CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  userId TEXT NOT NULL,
  teamId TEXT,
  name TEXT NOT NULL,
  prd JSON NOT NULL,
  sections JSON NOT NULL,
  metadata JSON,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);

-- Landing page version history
CREATE TABLE IF NOT EXISTS landing_page_versions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  landingPageId TEXT NOT NULL,
  version INTEGER NOT NULL,
  sections JSON NOT NULL,
  changedBy TEXT NOT NULL,
  changeNote TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landingPageId) REFERENCES landing_pages(id) ON DELETE CASCADE,
  FOREIGN KEY (changedBy) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(landingPageId, version)
);

-- Indexes for performance
CREATE INDEX idx_landing_pages_userId ON landing_pages(userId);
CREATE INDEX idx_landing_pages_teamId ON landing_pages(teamId);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);
CREATE INDEX idx_landing_page_versions_landingPageId ON landing_page_versions(landingPageId);
CREATE INDEX idx_landing_page_versions_changedBy ON landing_page_versions(changedBy);