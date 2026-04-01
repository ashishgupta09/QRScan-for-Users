document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerBtn');
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            console.log('Register button clicked');
            // Redirect to registration page or show a modal
            // window.location.href = '/register';
        });
    }
    
    // Add subtle hover effects or other micro-animations if needed
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.setAttribute('aria-expanded', 'true');
        });
        card.addEventListener('mouseleave', () => {
            card.setAttribute('aria-expanded', 'false');
        });
    });
});
