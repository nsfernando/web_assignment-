class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.selectedRating = 0;
        this.selectedPriority = 'medium';
        this.isSubmitting = false;

        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Contact form not found');
            return;
        }

        this.setupEventListeners();
        this.initializePriorityButtons();
    }

    setupEventListeners() {

        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        this.setupStarRating();

        this.setupPriorityButtons();

        this.setupCharacterCounter();

        this.setupRealTimeValidation();
    }

    setupStarRating() {
        const stars = document.querySelectorAll('.star');
        const starRating = document.getElementById('starRating');
        const ratingText = document.getElementById('ratingText');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                this.selectedRating = parseInt(star.dataset.rating);
                this.updateStarRating();
                document.getElementById('ratingInput').value = this.selectedRating;
            });

            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            });
        });

        if (starRating) {
            starRating.addEventListener('mouseleave', () => {
                this.updateStarRating();
            });
        }
    }

    highlightStars(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    updateStarRating() {
        const ratingTexts = {
            0: 'Click to rate',
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };

        this.highlightStars(this.selectedRating);
        const ratingTextElement = document.getElementById('ratingText');
        if (ratingTextElement) {
            ratingTextElement.textContent = ratingTexts[this.selectedRating];
        }
    }

    setupPriorityButtons() {
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedPriority = btn.dataset.priority;
                document.getElementById('priority').value = this.selectedPriority;
            });
        });
    }

    initializePriorityButtons() {

        document.querySelectorAll('.priority-btn').forEach(btn => {
            if (btn.dataset.priority === 'medium') {
                btn.classList.add('selected');
            }
        });
    }

    setupCharacterCounter() {
        const messageField = document.getElementById('message');
        const charCounter = document.getElementById('charCounter');

        if (messageField && charCounter) {
            messageField.addEventListener('input', () => {
                const current = messageField.value.length;
                const max = 1000;

                charCounter.textContent = `${current} / ${max}`;

                charCounter.classList.toggle('warning', current > max * 0.9);
                charCounter.classList.toggle('limit', current >= max);
            });
        }
    }

    setupRealTimeValidation() {
        const fields = ['name', 'email', 'phone'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });

        const subjectField = document.getElementById('subject');
        if (subjectField) {
            subjectField.addEventListener('change', () => this.validateField('subject'));
        }
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'name':
                if (!value || value.length < 2) {
                    isValid = false;
                    errorMessage = 'Please enter your full name (minimum 2 characters)';
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'phone':
                if (value && (value.length < 10 || !/^[\+\d\s\-\(\)]+$/.test(value))) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;

            case 'subject':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a subject';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(fieldId, errorMessage);
        } else {
            this.clearFieldError(fieldId);
        }

        return isValid;
    }

    validateForm() {
        this.clearAllErrors();
        let isValid = true;

        const requiredFields = ['name', 'email', 'subject', 'message'];

        requiredFields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        const message = document.getElementById('message').value.trim();
        if (message.length < 10) {
            this.showFieldError('message', 'Message must be at least 10 characters long');
            isValid = false;
        } else if (message.length > 1000) {
            this.showFieldError('message', 'Message must not exceed 1000 characters');
            isValid = false;
        }

        return isValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) {
            return;
        }

        if (!this.validateForm()) {
            this.showNotification('Please correct the errors below', 'error');
            return;
        }

        this.isSubmitting = true;
        this.showLoading();

        try {
            const formData = new FormData(this.form);

            const response = await fetch('php/contact.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                this.resetForm();
            } else {
                if (result.errors) {

                    Object.keys(result.errors).forEach(field => {
                        this.showFieldError(field, result.errors[field]);
                    });
                }
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('An error occurred while sending your message. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (field) field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (field) field.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    clearAllErrors() {
        const inputs = document.querySelectorAll('input, select, textarea');
        const errors = document.querySelectorAll('.error-message');

        inputs.forEach(input => input.classList.remove('error'));
        errors.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    showLoading() {
        const container = document.querySelector('.contact-form-container');
        const submitBtn = document.getElementById('submitBtn');

        if (container) container.classList.add('loading');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending Message...';
        }
    }

    hideLoading() {
        const container = document.querySelector('.contact-form-container');
        const submitBtn = document.getElementById('submitBtn');

        if (container) container.classList.remove('loading');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    }

    showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        if (successElement) {
            successElement.textContent = message || 'Thank you for contacting us! We\'ve received your message and will respond within 24 hours.';
            successElement.classList.add('show');
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = '✓ Message Sent!';
            submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';

            setTimeout(() => {
                submitBtn.textContent = 'Send Message';
                submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                if (successElement) successElement.classList.remove('show');
            }, 5000);
        }
    }

    showNotification(message, type = 'info') {

        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    resetForm() {
        this.form.reset();
        this.selectedRating = 0;
        this.selectedPriority = 'medium';

        this.updateStarRating();
        document.getElementById('ratingInput').value = '';

        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.priority === 'medium') {
                btn.classList.add('selected');
            }
        });

        document.getElementById('priority').value = 'medium';

        const charCounter = document.getElementById('charCounter');
        if (charCounter) {
            charCounter.textContent = '0 / 1000';
            charCounter.classList.remove('warning', 'limit');
        }

        this.clearAllErrors();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});