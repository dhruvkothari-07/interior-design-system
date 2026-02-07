/**
 * Get the current user's role from the stored JWT token
 * @returns {string} 'admin' | 'staff' | null
 */
export const getCurrentUserRole = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || 'staff';
    } catch (e) {
        console.error("Error decoding token", e);
        return 'staff'; // Fallback to safest role
    }
};

/**
 * Check if the current user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
    return getCurrentUserRole() === 'admin';
};
