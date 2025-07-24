class LoginHandler {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.autoFocusEmail();
        this.setupDemoCredentials();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                this.clearFieldError(input);
                this.hideMessages();
            });
        });
    }

    validateField(field) {
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

        if (isValid && field.value.trim()) {
            formGroup.classList.add('success');
        } else if (!isValid) {
            formGroup.classList.add('error');
        }

        return isValid;
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup.classList.contains('error')) {
            formGroup.classList.remove('error');
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required]');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    async handleLogin() {
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        this.setLoadingState(true);
        this.hideMessages();

        try {
            const response = await fetch('php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                this.form.reset();
                this.clearAllValidationStates();

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);

            } else {
                this.showError(result.message);
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;
            this.submitBtn.textContent = 'Signing In...';
        } else {
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Sign In';
        }
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.classList.add('show');
        this.errorMessage.classList.remove('show');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        this.successMessage.classList.remove('show');
    }

    hideMessages() {
        this.successMessage.classList.remove('show');
        this.errorMessage.classList.remove('show');
    }

    clearAllValidationStates() {
        this.form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error', 'success');
        });
    }

    autoFocusEmail() {
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.focus();
        }
    }

    setupDemoCredentials() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                document.getElementById('email').value = 'demo@student.edu';
                document.getElementById('password').value = 'Demo123!';
                this.validateField(document.getElementById('email'));
                this.validateField(document.getElementById('password'));
            }
        });
    }
}

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

function showForgotPassword() {
    const email = prompt('Enter your email address to reset password:');
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(`Password reset link has been sent to ${email}`);
    } else if (email) {
        alert('Please enter a valid email address');
    }
}

function socialLogin(provider) {
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login would be handled here`);
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});