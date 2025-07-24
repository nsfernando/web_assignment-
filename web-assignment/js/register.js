function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;

    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };

    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
            if (requirements[req]) {
                element.classList.add('met');
                score++;
            } else {
                element.classList.remove('met');
            }
        }
    });

    const strengthFill = document.getElementById('passwordStrengthFill');
    strengthFill.className = 'password-strength-fill';

    if (score === 1) strengthFill.classList.add('strength-weak');
    else if (score === 2) strengthFill.classList.add('strength-fair');
    else if (score === 3) strengthFill.classList.add('strength-good');
    else if (score === 4) strengthFill.classList.add('strength-strong');

    return score === 4;
}

function validateField(field) {
    const formGroup = field.closest('.form-group');
    let isValid = true;

    formGroup.classList.remove('error', 'success');

    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
    }

    if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            isValid = false;
        }
    }

if (field.type === 'tel' && field.value) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(field.value.replace(/[\s\-\(\)]/g, ''))) {
        isValid = false;
    }
}

    if (field.id === 'registerPassword') {
        isValid = checkPasswordStrength(field.value);
    }

    if (field.id === 'confirmPassword') {
        const password = document.getElementById('registerPassword').value;
        if (field.value !== password) {
            isValid = false;
        }
    }

    if (isValid && field.value.trim()) {
        formGroup.classList.add('success');
    } else if (!isValid) {
        formGroup.classList.add('error');
    }

    return isValid;
}

async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('registerForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isFormValid = true;

    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const formData = new FormData(form);
        const response = await fetch('php/register.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('successMessage').classList.add('show');
            form.reset();

            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error', 'success');
            });
        } else {

            if (result.errors) {
                Object.entries(result.errors).forEach(([field, message]) => {
                    const input = document.querySelector(`[name="${field}"]`);
                    if (input) {
                        const formGroup = input.closest('.form-group');
                        formGroup.classList.add('error');
                        const errorMessage = formGroup.querySelector('.error-message');
                        if (errorMessage) {
                            errorMessage.textContent = message;
                        }
                    }
                });
            }
            alert(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration. Please try again.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const inputs = form.querySelectorAll('input, select');

    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));

        if (input.id === 'registerPassword') {
            input.addEventListener('input', () => {
                checkPasswordStrength(input.value);

                const confirmField = document.getElementById('confirmPassword');
                if (confirmField.value) {
                    validateField(confirmField);
                }
            });
        }

        if (input.id === 'confirmPassword') {
            input.addEventListener('input', () => validateField(input));
        }
    });

    form.addEventListener('submit', handleRegisterFormSubmit);
});