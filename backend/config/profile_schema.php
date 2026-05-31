<?php

function ensureProfileSchema($conn)
{
    $conn->exec("
        CREATE TABLE IF NOT EXISTS follows (
            id INT AUTO_INCREMENT PRIMARY KEY,
            follower_id INT NOT NULL,
            following_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    try {
        $conn->exec("ALTER TABLE users MODIFY profile_picture VARCHAR(1024) DEFAULT NULL");
    } catch (Exception $e) {
    }
}
