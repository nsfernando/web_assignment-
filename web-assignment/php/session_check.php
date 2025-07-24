<?php
session_start();

function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function requireLogin($redirect = 'login.html') {
    if (!isLoggedIn()) {
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {

            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Please log in to continue']);
            exit;
        } else {

            header("Location: $redirect");
            exit;
        }
    }
}

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getUserData() {
    if (!isLoggedIn()) {
        return null;
    }

    return [
        'user_id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'first_name' => $_SESSION['first_name'] ?? null,
        'last_name' => $_SESSION['last_name'] ?? null
    ];
}

function destroySession() {
    $_SESSION = array();

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    if (isset($_COOKIE['remember_token'])) {
        setcookie('remember_token', '', time() - 3600, '/');
    }

    session_destroy();
}

if (!isLoggedIn() && isset($_COOKIE['remember_token'])) {
    require_once 'db.php';

    try {
        $remember_token = $_COOKIE['remember_token'];

        $stmt = executeStatement(
            "SELECT user_id, email, first_name, last_name FROM users WHERE remember_token = ? AND remember_token IS NOT NULL",
            "s",
            $remember_token
        );

        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {

            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['logged_in'] = true;
        } else {

            setcookie('remember_token', '', time() - 3600, '/');
        }

    } catch (Exception $e) {
        error_log("Remember token error: " . $e->getMessage());
        setcookie('remember_token', '', time() - 3600, '/');
    }
}
?>