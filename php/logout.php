<?php
require_once 'session_check.php';
require_once 'db.php';

if (isLoggedIn() && isset($_COOKIE['remember_token'])) {
    try {
        $userId = getUserId();
        $stmt = executeStatement(
            "UPDATE users SET remember_token = NULL WHERE user_id = ?",
            "i",
            $userId
        );
    } catch (Exception $e) {
        error_log("Logout error: " . $e->getMessage());
    }
}

destroySession();

header("Location: ../login.html");
exit;
?>