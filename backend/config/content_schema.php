<?php

function ensureContentSchema($conn)
{
    try {
        $conn->exec("ALTER TABLE posts ADD COLUMN category VARCHAR(50) DEFAULT 'general'");
    } catch (Exception $e) {
    }

    try {
        $conn->exec("ALTER TABLE posts ADD COLUMN link_url VARCHAR(1024) DEFAULT NULL");
    } catch (Exception $e) {
    }

    try {
        $conn->exec("ALTER TABLE posts ADD COLUMN community_id INT NULL");
    } catch (Exception $e) {
    }

    $conn->exec("
        CREATE TABLE IF NOT EXISTS post_hashtags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            tag VARCHAR(80) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, tag),
            INDEX(tag),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    ");
}

function extractHashtags($content)
{
    preg_match_all('/(^|\\s)#([A-Za-z0-9_]{2,80})/', $content, $matches);

    if (empty($matches[2])) {
        return [];
    }

    return array_values(array_unique(array_map(
        fn($tag) => strtolower($tag),
        $matches[2]
    )));
}
