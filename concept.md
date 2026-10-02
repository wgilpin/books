# Speculative Fiction Discovery Engine: Concept Document

## 1. Problem Statement
The Amazon Kindle Storefront has degraded into an ad-driven recommendation loop optimized for Kindle Unlimited (KU) page-reads and Amazon A9 search ranking:
* **Catalog Noise:** Low-effort KU churn and self-published algorithm manipulation dominate subgenre rankings.
* **Title Hijacking:** Publishers and indie authors stuff title fields with keyword ad copy (e.g., *"Title: An unmissable pulse-pounding sci-fi thriller from..."*), obscuring canonical book names.
* **Zero Negative Filtering:** The storefront cannot filter out books already read, purchased, or explicitly rejected by the user.

## 2. Objective
Build a lightweight, local-first book discovery system that decouples discovery from fulfillment. The system will:
1. Ingest clean, canonical speculative fiction metadata.
2. Track user state (`READ`, `REJECTED`, `QUEUED`, `UNREAD`).
3. Present an uncluttered, subtitle-stripped discovery stream.
4. Provide direct one-click fulfillment links to Amazon Kindle checkout.

---

## 3. Architecture & Components

```
+-------------------------------------------------------------+
|                     Metadata Sources                        |
|  - ISFDB Dumps / API (Canonical SF/F data)                  |
|  - Curated Award Archives (Clarke, Hugo, Nebula, BSFA)      |
|  - Curated Canons (SF Masterworks, Locus All-Time)          |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    Title Normalizer & Cleaner               |
|  - Strips subtitle spam, series blurbs, and promo tags      |
|  - Normalizes author names and release years                |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  Local State Ledger (SQLite)                |
|  - books (id, title, author, year, series, awards)          |
|  - book_state (book_id, state: READ|REJECTED|QUEUED, date)  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Presentation Layer                     |
|  - Minimal CLI/TUI (Textual/Curses) or Local Web UI         |
|  - Query: WHERE state IS NULL OR state = 'QUEUED'           |
|  - Actions: [R]ead, [X] Reject, [O]pen Buy Link             |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   Fulfillment Link Generator                |
|  - [https://amazon.co.uk/s?k=](https://amazon.co.uk/s?k=){clean_title}+{author}&i=digital-text
+-------------------------------------------------------------+
```

---

## 4. Data Model (SQLite)

```sql
CREATE TABLE books (
    id TEXT PRIMARY KEY,               -- e.g., slug: 'blindsight-peter-watts' or ISFDB ID
    canonical_title TEXT NOT NULL,     -- Strictly normalized title without marketing copy
    author TEXT NOT NULL,
    publication_year INTEGER,
    series_name TEXT,
    series_position REAL,
    award_nominations TEXT,           -- JSON array or comma-separated tags (e.g., "Clarke 2007, Hugo 2007")
    synopsis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_book_state (
    book_id TEXT PRIMARY KEY,
    state TEXT CHECK(state IN ('read', 'rejected', 'queued')),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX idx_books_year ON books(publication_year);
CREATE INDEX idx_user_state ON user_book_state(state);
```

---

## 5. Core Workflows

### 5.1 Ingestion & Hygiene
* **Seed Sources:** Pull data from ISFDB (Internet Speculative Fiction Database) database extracts or curated award archives. ISFDB enforces strict bibliographic naming rules that forbid marketing subtitles.
* **Normalization Pipeline:** Pass candidate records through a cleanup regex filter:
  * Remove colon/hyphen suffixes matching marketing triggers (`"A Novel of..."`, `"A Thriller..."`, `"Book \d+ in the..."`).
  * Deduplicate editions into a single canonical work entity.

### 5.2 Negative Ledger Seeding (Bootstrap)
* **Import Existing History:** Ingest past Kindle purchases (via Amazon "Manage Your Content and Devices" CSV order export) or existing Goodreads/StoryGraph exports.
* **Fuzzy Title/Author Matching:** Map past reads into `user_book_state` as `'read'`.
* **Exclusion Enforcement:** Active discovery feeds execute `WHERE books.id NOT IN (SELECT book_id FROM user_book_state WHERE state IN ('read', 'rejected'))`.

### 5.3 Discovery & Interaction Loop
* **Display Format:**
  ```text
  [Clarke Nominee 2007] Blindsight (2006) — Peter Watts
  Synopsis: A crew of specialists investigates an alien vessel at the edge of the solar system...
  [R] Mark Read  |  [X] Reject / Never Show  |  [W] Add to Queue  |  [Enter] Buy on Kindle
  ```
* **Fulfillment Action:** Hitting `[Enter]` opens a browser tab with a direct scoped Kindle search:
  `https://www.amazon.co.uk/s?k=Blindsight+Peter+Watts&i=digital-text`
  This drops directly onto the Kindle edition page, bypassing all storefront algorithmic recommendations.

---

## 6. Implementation Stages
1. **Stage 1 (Core Store & Award Scraper):** SQLite schema + scraper for Arthur C. Clarke, Hugo, Nebula, and BSFA winning/shortlisted novels (clean canonical seed).
2. **Stage 2 (Negative State Ledger):** CLI command to import reading history CSV and interactively flag read/rejected titles.
3. **Stage 3 (Discovery CLI/TUI):** Interactive terminal viewer (e.g., Python `textual` or `rich`) with keyboard bindings to triage unread titles and open buy links.