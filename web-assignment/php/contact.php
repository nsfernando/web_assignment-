<?php
require_once 'db.php';
require_once 'session_check.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

function validateInput($data) {
    $errors = [];

    if (empty($data['name']) || strlen(trim($data['name'])) < 2) {
        $errors['name'] = 'Please enter your full name (minimum 2 characters)';
    }

    if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address';
    }

    if (!empty($data['phone']) && !preg_match('/^[\+\d\s\-\(\)]+$/', $data['phone'])) {
        $errors['phone'] = 'Please enter a valid phone number';
    }

    $validSubjects = ['general', 'support', 'billing', 'feature', 'bug', 'partnership', 'other'];
    if (empty($data['subject']) || !in_array($data['subject'], $validSubjects)) {
        $errors['subject'] = 'Please select a valid subject';
    }

    if (empty($data['message']) || strlen(trim($data['message'])) < 10) {
        $errors['message'] = 'Message must be at least 10 characters long';
    }

    if (strlen($data['message']) > 1000) {
        $errors['message'] = 'Message must not exceed 1000 characters';
    }

    return $errors;
}

$inputData = [
    'name' => trim($_POST['name'] ?? ''),
    'email' => trim($_POST['email'] ?? ''),
    'phone' => trim($_POST['phone'] ?? ''),
    'subject' => $_POST['subject'] ?? '',
    'message' => trim($_POST['message'] ?? ''),
    'priority' => $_POST['priority'] ?? 'medium',
    'rating' => !empty($_POST['rating']) ? (int)$_POST['rating'] : null
];

$errors = validateInput($inputData);

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Please correct the errors below',
        'errors' => $errors
    ]);
    exit;
}

try {

    $userId = isLoggedIn() ? getUserId() : null;

    $duplicateCheck = executeStatement(
        "SELECT COUNT(*) as count FROM contact_messages 
         WHERE email = ? AND message = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)",
        "ss",
        $inputData['email'],
        $inputData['message']
    );

    $duplicateResult = $duplicateCheck->get_result();
    $duplicateCount = $duplicateResult->fetch_assoc()['count'];

    if ($duplicateCount > 0) {
        http_response_code(429);
        echo json_encode([
            'success' => false, 
            'message' => 'Duplicate submission detected. Please wait a few minutes before submitting again.'
        ]);
        exit;
    }

    $query = "INSERT INTO contact_messages (user_id, name, email, phone, subject, message, priority, rating) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = executeStatement(
        $query,
        "issssssi",
        $userId,
        $inputData['name'],
        $inputData['email'],
        !empty($inputData['phone']) ? $inputData['phone'] : null,
        $inputData['subject'],
        $inputData['message'],
        $inputData['priority'],
        $inputData['rating']
    );

    if ($stmt->affected_rows > 0) {
        $messageId = Database::getInstance()->lastInsertId();

        error_log("Contact form submitted successfully. Message ID: $messageId, Email: {$inputData['email']}");

        echo json_encode([
            'success' => true, 
            'message' => 'Thank you for contacting us! We\'ve received your message and will respond within 24 hours.',
            'message_id' => $messageId
        ]);
    } else {
        throw new Exception('Failed to save message');
    }

} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred while processing your request. Please try again later.'
    ]);
}
?>