<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

try {

    $stmt = executeStatement(
        "SELECT user_id, email, password_hash, first_name, last_name FROM users WHERE email = ?",
        "s",
        $email
    );

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {

        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {

        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['logged_in'] = true;

    if (isset($input['rememberMe']) && $input['rememberMe']) {

        $remember_token = bin2hex(random_bytes(32));

        $stmt = executeStatement(
            "UPDATE users SET remember_token = ? WHERE user_id = ?",
            "si",
            $remember_token,
            $user['user_id']
        );

        setcookie('remember_token', $remember_token, time() + (30 * 24 * 60 * 60), '/');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['user_id'],
            'email' => $user['email'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again later.']);
    error_log("Login error: " . $e->getMessage());
}
?>