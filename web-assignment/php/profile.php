<?php
require_once 'session_check.php';
require_once 'db.php';

header('Content-Type: application/json');

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $userId = getUserId();

    $stmt = executeStatement(
        "SELECT user_id, email, first_name, last_name, phone, date_of_birth, gender, created_at 
         FROM users WHERE user_id = ?",
        "i",
        $userId
    );

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $profileData = [
        'personal' => [
            'id' => 'ST' . str_pad($user['user_id'], 7, '0', STR_PAD_LEFT),
            'fullName' => trim($user['first_name'] . ' ' . $user['last_name']),
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?: 'Not provided',
            'dateOfBirth' => $user['date_of_birth'] ? date('M j, Y', strtotime($user['date_of_birth'])) : 'Not provided',
            'gender' => $user['gender'] ? ucfirst(str_replace('-', ' ', $user['gender'])) : 'Not specified',
            'memberSince' => date('M Y', strtotime($user['created_at']))
        ],
        'academic' => [
            'gpa' => '3.85', 
            'credits' => '84', 
            'semester' => 'Fall 2025',
            'yearLevel' => '3rd Year'
        ],
        'courses' => [
            [
                'code' => 'CS401',
                'title' => 'Advanced Algorithms',
                'instructor' => 'Dr. Wiraj',
                'grade' => 'A-',
                'progress' => 85
            ],
            [
                'code' => 'CS350',
                'title' => 'Database Systems',
                'instructor' => 'Prof. Dhanushka',
                'grade' => 'B+',
                'progress' => 72
            ],
            [
                'code' => 'MATH301',
                'title' => 'Linear Algebra',
                'instructor' => 'Dr. Nadeehsa',
                'grade' => 'A',
                'progress' => 90
            ]
        ],
        'recentActivity' => [
            [
                'icon' => '📝',
                'title' => 'Submitted Assignment: Algorithm Analysis Report',
                'time' => '2 hours ago'
            ],
            [
                'icon' => '📊',
                'title' => 'Grade Posted: Database Systems Quiz 3 - 92%',
                'time' => '1 day ago'
            ],
            [
                'icon' => '📚',
                'title' => 'Enrolled in CS401: Advanced Algorithms',
                'time' => '3 days ago'
            ],
            [
                'icon' => '🎯',
                'title' => 'Achievement Unlocked: Dean\'s List Spring 2025',
                'time' => '1 week ago'
            ]
        ]
    ];

    echo json_encode([
        'success' => true,
        'data' => $profileData
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while loading profile data']);
    error_log("Profile data error: " . $e->getMessage());
}
?>