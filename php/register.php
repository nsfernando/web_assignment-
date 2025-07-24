<?php
require_once 'db.php';

header('Content-Type: application/json');

$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit;
}

$firstName = trim($_POST['firstName'] ?? '');
$lastName = trim($_POST['lastName'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$dateOfBirth = $_POST['dateOfBirth'] ?? '';
$gender = $_POST['gender'] ?? '';
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if (empty($firstName)) {
    $response['errors']['firstName'] = 'First name is required';
}

if (empty($lastName)) {
    $response['errors']['lastName'] = 'Last name is required';
}

if (empty($email)) {
    $response['errors']['email'] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['errors']['email'] = 'Invalid email format';
}

if (!empty($phone)) {

    $cleanPhone = preg_replace('/[\s\-\(\)]/', '', $phone);
    if (!preg_match('/^[0-9]{10}$/', $cleanPhone)) {
        $response['errors']['phone'] = 'Phone number must be exactly 10 digits';
    }
}

if (empty($dateOfBirth)) {
    $response['errors']['dateOfBirth'] = 'Date of birth is required';
} elseif (strtotime($dateOfBirth) > strtotime('-13 years')) {
    $response['errors']['dateOfBirth'] = 'You must be at least 13 years old';
}

if (empty($gender) || !in_array($gender, ['male', 'female', 'other', 'prefer-not-to-say'])) {
    $response['errors']['gender'] = 'Please select a valid gender';
}

if (empty($password)) {
    $response['errors']['password'] = 'Password is required';
} elseif (strlen($password) < 8 || 
          !preg_match('/[A-Z]/', $password) || 
          !preg_match('/[a-z]/', $password) || 
          !preg_match('/[0-9]/', $password)) {
    $response['errors']['password'] = 'Password must be at least 8 characters with uppercase, lowercase, and a number';
}

if ($password !== $confirmPassword) {
    $response['errors']['confirmPassword'] = 'Passwords do not match';
}

if (!empty($response['errors'])) {
    $response['message'] = 'Please correct the errors in the form';
    echo json_encode($response);
    exit;
}

try {
    $db = Database::getInstance();
    $stmt = $db->prepare("SELECT email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $response['errors']['email'] = 'Email already registered';
        $response['message'] = 'Email already registered';
        echo json_encode($response);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $cleanPhone = !empty($phone) ? preg_replace('/[\s\-\(\)]/', '', $phone) : '';

    $stmt = $db->prepare("INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone, 
        date_of_birth, 
        gender
    ) VALUES (?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        "sssssss", 
        $email, 
        $passwordHash, 
        $firstName, 
        $lastName, 
        $cleanPhone, 
        $dateOfBirth, 
        $gender
    );

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Registration successful!';
    } else {
        $response['message'] = 'Registration failed. Please try again.';
    }
} catch (Exception $e) {
    $response['message'] = 'An error occurred: ' . $e->getMessage();
}

echo json_encode($response);
?>