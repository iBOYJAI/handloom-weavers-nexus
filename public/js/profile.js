// Profile utilities
const profile = {
    // Load user profile
    async loadProfile() {
        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error) {
            return null;
        }
    },

    // Update profile
    async updateProfile(data) {
        try {
            const response = await api.put('/api/users/profile', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Upload avatar
    async uploadAvatar(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }
        if (file.size > 5242880) { // 5MB
            throw new Error('Image size must be less than 5MB');
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await api.upload('/api/users/avatar', formData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Preview avatar
    previewAvatar(input, previewId) {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            notifications.showToast('error', 'Error', 'Please select an image file');
            return;
        }

        if (file.size > 5242880) {
            notifications.showToast('error', 'Error', 'Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
};

