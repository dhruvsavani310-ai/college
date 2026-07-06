// Main JS
console.log('Attendance System Loaded');

document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn && sidebar) {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop d-md-none';
        document.body.appendChild(backdrop);
        
        // Toggle function
        const toggleSidebar = () => {
            sidebar.classList.toggle('show');
            backdrop.classList.toggle('show');
        };
        
        toggleBtn.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar);
    }
});
