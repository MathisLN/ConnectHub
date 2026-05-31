<?php

function ensureCommunitySchema($conn)
{
    $conn->exec("
        CREATE TABLE IF NOT EXISTS communities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            cover_image VARCHAR(255),
            creator_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS community_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            community_id INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, community_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
        )
    ");
}

function isCommunityMember($conn, $userId, $communityId)
{
    $stmt = $conn->prepare("
        SELECT 1
        FROM community_members
        WHERE user_id = :user_id
        AND community_id = :community_id
        LIMIT 1
    ");

    $stmt->execute([
        ":user_id" => $userId,
        ":community_id" => $communityId
    ]);

    return (bool) $stmt->fetchColumn();
}
