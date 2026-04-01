# Database Implementation Guidelines for The Academic Architect

This document outlines the recommended database architecture and schema for implementing the "Academic Architect" learning agent.

## 1. Technology Stack Recommendation
- **Primary Database**: PostgreSQL (Relational)
- **Vector Database**: Pinecone or pgvector (for RAG/Semantic Search)
- **Caching/Session**: Redis

## 2. Core Schema Design

### Users Table
Stores user profiles, mastery levels, and preferences.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bloom_level VARCHAR(50) DEFAULT 'INITIALIZING',
    mastery_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB -- Store UI themes, notification settings, etc.
);
```

### Orchestration_Engines Table
Stores configuration for background processes (CLI/API).
```sql
CREATE TABLE orchestration_engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    engine_type VARCHAR(50), -- 'claude-code', 'gemini-cli', 'anthropic-api'
    config JSONB, -- Store API keys (encrypted), local paths, etc.
    is_active BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP WITH TIME ZONE
);
```

### Study_Artifacts Table
Stores uploaded documents, notes, and links.
```sql
CREATE TABLE study_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content_text TEXT, -- Extracted text for indexing
    file_url VARCHAR(512),
    artifact_type VARCHAR(50), -- 'pdf', 'markdown', 'url'
    vector_id VARCHAR(255), -- Reference to vector DB index
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Synthesis_Sessions Table
Stores chat history and Socratic dialogues.
```sql
CREATE TABLE synthesis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    summary TEXT,
    token_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES synthesis_sessions(id),
    role VARCHAR(20), -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB, -- Store thought process, citations, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Mastery_Matrix Table
Tracks progress across different concepts.
```sql
CREATE TABLE mastery_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    concept_name VARCHAR(100) NOT NULL,
    mastery_percentage INTEGER DEFAULT 0,
    last_evaluated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, concept_name)
);
```

## 3. Implementation Guidelines

### Security & Privacy
- **Encryption at Rest**: Use AES-256 for sensitive fields like `config` (API keys).
- **Row Level Security (RLS)**: Implement RLS in PostgreSQL to ensure users can only access their own data.
- **Data Retention**: Implement a policy for purging old logs and temporary session data.

### Performance
- **Indexing**: Create indexes on `user_id` and `created_at` for fast dashboard loading.
- **Vector Search**: Use `pgvector` if staying within PostgreSQL to perform semantic similarity searches between user queries and study artifacts.

### Scalability
- **JSONB Usage**: Use JSONB for flexible metadata that might change as the AI models evolve.
- **Audit Logs**: Maintain a separate table for critical system events and connection logs.
