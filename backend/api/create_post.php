<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");
require_once("../config/content_schema.php");
require_once("../config/community_schema.php");

$content = "";
$userId = null;
$image = null;
$category = "general";
$linkUrl = null;
$communityId = null;

if (!empty($_POST)) {
    $userId = $_POST["user_id"] ?? null;
    $content = trim($_POST["content"] ?? "");
    $category = trim($_POST["category"] ?? "general");
    $linkUrl = trim($_POST["link_url"] ?? "");
    $communityId = $_POST["community_id"] ?? null;
} else {
    $data = json_decode(file_get_contents("php://input"));
    $userId = $data->user_id ?? null;
    $content = trim($data->content ?? "");
    $category = trim($data->category ?? "general");
    $linkUrl = trim($data->link_url ?? "");
    $communityId = $data->community_id ?? null;
}

if (
    !$userId ||
    ($content === "" && empty($_FILES["image"]["name"]) && $linkUrl === "")
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing data"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureContentSchema($conn);
ensureCommunitySchema($conn);

$allowedCategories = ["general", "question", "project", "event", "resource"];

if (!in_array($category, $allowedCategories, true)) {
    $category = "general";
}

if ($linkUrl === "") {
    $linkUrl = null;
} elseif (!filter_var($linkUrl, FILTER_VALIDATE_URL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid link URL"
    ]);
    exit;
}

if ($communityId === "" || $communityId === "null") {
    $communityId = null;
}

if ($communityId !== null) {
    $communityStmt = $conn->prepare("
        SELECT id
        FROM communities
        WHERE id = :community_id
        LIMIT 1
    ");

    $communityStmt->execute([":community_id" => $communityId]);

    if (!$communityStmt->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Community not found"
        ]);
        exit;
    }

    if (!isCommunityMember($conn, $userId, $communityId)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "You must join this community before publishing there"
        ]);
        exit;
    }
}

if (!empty($_FILES["image"]["name"])) {
    if ($_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "success" => false,
            "message" => "Image upload error",
            "upload_error" => $_FILES["image"]["error"]
        ]);
        exit;
    }

    $allowedTypes = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp"
    ];

    $imageInfo = getimagesize($_FILES["image"]["tmp_name"]);
    $mimeType = $imageInfo["mime"] ?? null;

    if (!isset($allowedTypes[$mimeType])) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid image type",
            "detected_type" => $mimeType
        ]);
        exit;
    }

    if ($_FILES["image"]["size"] > 5 * 1024 * 1024) {
        echo json_encode([
            "success" => false,
            "message" => "Image is too large"
        ]);
        exit;
    }

    $uploadDir = __DIR__ . "/../uploads/posts";

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            echo json_encode([
                "success" => false,
                "message" => "Could not create upload directory"
            ]);
            exit;
        }
    }

    $fileName = uniqid("post_", true) . "." . $allowedTypes[$mimeType];
    $targetPath = $uploadDir . "/" . $fileName;

    if (!move_uploaded_file($_FILES["image"]["tmp_name"], $targetPath)) {
        echo json_encode([
            "success" => false,
            "message" => "Image upload failed"
        ]);
        exit;
    }

    $image = "http://localhost:8888/connecthub1/backend/uploads/posts/" . $fileName;
}

$query = "INSERT INTO posts (user_id, community_id, content, image, category, link_url) 
          VALUES (:user_id, :community_id, :content, :image, :category, :link_url)";
$stmt = $conn->prepare($query);

$stmt->bindParam(":user_id", $userId);
$stmt->bindParam(":community_id", $communityId);
$stmt->bindParam(":content", $content);
$stmt->bindParam(":image", $image);
$stmt->bindParam(":category", $category);
$stmt->bindParam(":link_url", $linkUrl);

if ($stmt->execute()) {
    $postId = $conn->lastInsertId();
    $hashtags = extractHashtags($content);

    if (!empty($hashtags)) {
        $tagStmt = $conn->prepare("
            INSERT IGNORE INTO post_hashtags (post_id, tag)
            VALUES (:post_id, :tag)
        ");

        foreach ($hashtags as $tag) {
            $tagStmt->execute([
                ":post_id" => $postId,
                ":tag" => $tag
            ]);
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Post created"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error creating post"
    ]);
}
