<?php

class Database
{
    public function connect()
    {
        try {
            $conn = new PDO(
                "mysql:host=localhost;port=8889;dbname=connecthub1;charset=utf8mb4",
                "root",
                "root"
            );

            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            return $conn;

        } catch (PDOException $e) {
            die(json_encode([
                "success" => false,
                "message" => "Database connection failed",
                "error" => $e->getMessage()
            ]));
        }
    }
}