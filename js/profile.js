class ProfileManager {
    constructor() {
        this.profileData = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadProfileData();
            });
        } else {
            this.loadProfileData();
        }
    }

    async loadProfileData() {
        try {
            this.showLoading();

            const response = await fetch('php/profile.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {

                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            if (result.success) {
                this.profileData = result.data;
                this.renderProfile();
            } else {
                throw new Error(result.message || 'Failed to load profile data');
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showError(error.message);
        }
    }

    showLoading() {
        const loadingElements = [
            'studentName', 'studentId', 'fullName', 'email', 
            'phone', 'dateOfBirth', 'currentGPA', 'creditsCompleted',
            'currentSemester', 'yearLevel'
        ];

        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="loading-text">Loading...</div>';
            }
        });

        const courseList = document.getElementById('courseList');
        if (courseList) {
            courseList.innerHTML = '<div class="loading-card">Loading courses...</div>';
        }

        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = '<div class="loading-card">Loading activity...</div>';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Error Loading Profile</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;

        const container = document.querySelector('.profile-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(errorDiv);
        }
    }

    renderProfile() {
        if (!this.profileData) return;

        const { personal, academic, courses, recentActivity } = this.profileData;

        this.updateElement('studentName', personal.fullName);
        this.updateElement('studentId', `ID: ${personal.id}`);
        this.updateElement('fullName', personal.fullName);
        this.updateElement('email', personal.email);
        this.updateElement('phone', personal.phone);
        this.updateElement('dateOfBirth', personal.dateOfBirth);

        this.updateElement('currentGPA', academic.gpa);
        this.updateElement('creditsCompleted', academic.credits);
        this.updateElement('currentSemester', academic.semester);
        this.updateElement('yearLevel', academic.yearLevel);

        this.renderCourses(courses);

        this.renderActivity(recentActivity);

        const profileDataDiv = document.getElementById('profileData');
        if (profileDataDiv) {
            profileDataDiv.innerHTML = JSON.stringify(this.profileData, null, 2);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || 'Not available';
        }
    }

    renderCourses(courses) {
        const courseList = document.getElementById('courseList');
        if (!courseList || !courses) return;

        if (courses.length === 0) {
            courseList.innerHTML = '<div class="loading-card">No courses found</div>';
            return;
        }

        courseList.innerHTML = courses.map(course => `
            <div class="course-card">
                <div class="course-header">
                    <div>
                        <div class="course-code">${course.code}</div>
                    </div>
                    <div class="course-grade">${course.grade}</div>
                </div>
                <div class="course-title">${course.title}</div>
                <div class="course-instructor">${course.instructor}</div>
                <div class="course-progress">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span>${course.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${course.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderActivity(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList || !activities) return;

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="loading-card">No recent activity</div>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    async refreshProfile() {
        await this.loadProfileData();
    }

    getProfileData() {
        return this.profileData;
    }
}

const profileManager = new ProfileManager();

window.profileManager = profileManager;

function formatDate(dateString) {
    if (!dateString) return 'Not provided';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatPhoneNumber(phone) {
    if (!phone) return 'Not provided';

    if (phone.startsWith('+94')) {
        return phone;
    } else if (phone.startsWith('94')) {
        return '+' + phone;
    } else if (phone.startsWith('0')) {
        return '+94' + phone.substring(1);
    }

    return phone;
}

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && profileManager) {

    }
});