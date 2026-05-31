<?php

function getUserRole($conn, $userId)
{
    if (!$userId) {
        return null;
    }

    $stmt = $conn->prepare("
    SELECT role
    FROM users
    WHERE id = :id
    LIMIT 1
    ");

    $stmt->execute([":id" => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    return $user ? $user["role"] : null;
}

function requireRole($conn, $userId, $allowedRoles)
{
    $role = getUserRole($conn, $userId);

    if (!$role || !in_array($role, $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Forbidden"
        ]);
        exit;
    }

    return $role;
}
