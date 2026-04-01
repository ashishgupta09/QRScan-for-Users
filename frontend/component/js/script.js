document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerBtn');
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            console.log('Register button clicked - Redirecting to registration page');
            window.location.href = './register.html';
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

    // =========================================================================
    // REGISTRATION FORM HANDLING
    // =========================================================================
    const regForm = document.getElementById('regForm');
    if (regForm) {
        // Disease field visibility toggle
        const diseaseYes = document.getElementById('diseaseYes');
        const diseaseNo = document.getElementById('diseaseNo');
        const diseaseFields = document.getElementById('diseaseFields');
        
        if (diseaseYes && diseaseNo) {
            [diseaseYes, diseaseNo].forEach(radio => {
                radio.addEventListener('change', () => {
                    if (diseaseYes.checked) {
                        diseaseFields.classList.add('show');
                    } else {
                        diseaseFields.classList.remove('show');
                        document.getElementById('diseaseDetails').value = '';
                    }
                });
            });
        }

        // Form submission
        const submitBtn = document.getElementById('submitBtn');
        const successOverlay = document.getElementById('successOverlay');
        const formBody = document.getElementById('formBody');
        
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm()) {
                submitRegistration();
            }
        });

        // Form validation
        function validateForm() {
            let isValid = true;

            // Validate Name
            const name = document.getElementById('name');
            if (!name.value.trim()) {
                showError('nameErr');
                isValid = false;
            } else {
                clearError('nameErr');
                name.classList.add('valid');
            }

            // Validate Address
            const address = document.getElementById('address');
            if (!address.value.trim()) {
                showError('addressErr');
                isValid = false;
            } else {
                clearError('addressErr');
                address.classList.add('valid');
            }

            // Validate Phone
            const phone = document.getElementById('phone');
            if (!phone.value || phone.value.length !== 10 || !/^\d{10}$/.test(phone.value)) {
                showError('phoneErr');
                isValid = false;
            } else {
                clearError('phoneErr');
                phone.classList.add('valid');
            }

            // Validate Alternate Phone (optional but if provided, must be valid)
            const altPhone = document.getElementById('altPhone');
            if (altPhone.value && (altPhone.value.length !== 10 || !/^\d{10}$/.test(altPhone.value))) {
                showError('altPhoneErr');
                isValid = false;
            } else {
                clearError('altPhoneErr');
                if (altPhone.value) altPhone.classList.add('valid');
            }

            // Validate DOB
            const dob = document.getElementById('dob');
            if (!dob.value) {
                showError('dobErr');
                isValid = false;
            } else {
                clearError('dobErr');
                dob.classList.add('valid');
            }

            // Validate Blood Group
            const bloodGroup = document.getElementById('bloodGroup');
            if (!bloodGroup.value) {
                showError('bloodErr');
                isValid = false;
            } else {
                clearError('bloodErr');
                bloodGroup.classList.add('valid');
            }

            // Validate Disease selection
            const disease = document.querySelector('input[name="disease"]:checked');
            if (!disease) {
                showError('diseaseErr');
                isValid = false;
            } else {
                clearError('diseaseErr');
            }

            // Validate Disease Details if disease is "yes"
            if (diseaseYes.checked) {
                const diseaseDetails = document.getElementById('diseaseDetails');
                if (!diseaseDetails.value.trim()) {
                    showError('diseaseDetailsErr');
                    isValid = false;
                } else {
                    clearError('diseaseDetailsErr');
                    diseaseDetails.classList.add('valid');
                }
            }

            return isValid;
        }

        function showError(errorId) {
            const errorEl = document.getElementById(errorId);
            if (errorEl) {
                errorEl.classList.add('show');
                const inputId = errorId.replace('Err', '');
                const input = document.getElementById(inputId);
                if (input) {
                    input.classList.remove('valid');
                    input.classList.add('error');
                }
            }
        }

        function clearError(errorId) {
            const errorEl = document.getElementById(errorId);
            if (errorEl) {
                errorEl.classList.remove('show');
                const inputId = errorId.replace('Err', '');
                const input = document.getElementById(inputId);
                if (input) {
                    input.classList.remove('error');
                }
            }
        }

        // Form submission
        function submitRegistration() {
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const spinner = submitBtn.querySelector('.spinner');
            
            btnText.style.opacity = '0';
            spinner.style.display = 'block';

            // Simulate API call (replace with actual backend call)
            setTimeout(() => {
                const formData = {
                    name: document.getElementById('name').value,
                    address: document.getElementById('address').value,
                    phone: document.getElementById('phone').value,
                    altPhone: document.getElementById('altPhone').value || 'N/A',
                    dob: document.getElementById('dob').value,
                    bloodGroup: document.getElementById('bloodGroup').value,
                    disease: document.querySelector('input[name="disease"]:checked').value,
                    diseaseDetails: document.getElementById('diseaseDetails').value || 'N/A'
                };

                // Show success overlay
                formBody.style.display = 'none';
                successOverlay.classList.add('show');

                // Display submitted data
                const successDetail = document.getElementById('successDetail');
                successDetail.innerHTML = `
                    <strong>Name:</strong> ${formData.name}<br/>
                    <strong>Phone:</strong> ${formData.phone}<br/>
                    <strong>Blood Group:</strong> ${formData.bloodGroup}<br/>
                    <strong>Status:</strong> Pending Approval
                `;

                submitBtn.disabled = false;
                btnText.style.opacity = '1';
                spinner.style.display = 'none';
            }, 1500);
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                regForm.reset();
                formBody.style.display = 'block';
                successOverlay.classList.remove('show');
                diseaseFields.classList.remove('show');
                
                // Clear validation states
                document.querySelectorAll('input, textarea, select').forEach(field => {
                    field.classList.remove('valid', 'error');
                });
                document.querySelectorAll('.err-msg').forEach(err => {
                    err.classList.remove('show');
                });
            });
        }
    }
});
