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

            // Validate Email
            const email = document.getElementById('email');
            if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                showError('emailErr');
                isValid = false;
            } else {
                clearError('emailErr');
                email.classList.add('valid');
            }

            // Validate Password
            const password = document.getElementById('password');
            if (!password.value || password.value.length < 4) {
                showError('passwordErr');
                isValid = false;
            } else {
                clearError('passwordErr');
                password.classList.add('valid');
            }

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

            // Validate Disease Document if disease is "yes"
            if (diseaseYes.checked) {
                const doc = document.getElementById('disease_document');
                if (!doc.files || doc.files.length === 0) {
                    showError('docErr');
                    isValid = false;
                } else {
                    clearError('docErr');
                    doc.classList.add('valid');
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
        async function submitRegistration() {
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const spinner = submitBtn.querySelector('.spinner');
            
            btnText.style.opacity = '0';
            spinner.style.display = 'block';

            const formData = new FormData();
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            formData.append('name', document.getElementById('name').value);
            formData.append('address', document.getElementById('address').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('alternate_phone', document.getElementById('altPhone').value);
            formData.append('dob', document.getElementById('dob').value);
            formData.append('blood_group', document.getElementById('bloodGroup').value);
            
            const hasDisease = document.querySelector('input[name="disease"]:checked').value;
            formData.append('has_disease', hasDisease);
            
            if (hasDisease === 'yes') {
                const docFile = document.getElementById('disease_document').files[0];
                if (docFile) {
                    formData.append('disease_document', docFile);
                }
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/api/user/register', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    // Show success overlay
                    formBody.style.display = 'none';
                    successOverlay.classList.add('show');

                    // Display submitted data
                    const successDetail = document.getElementById('successDetail');
                    successDetail.innerHTML = `
                        <strong>Name:</strong> ${result.user.name}<br/>
                        <strong>Email:</strong> ${result.user.email}<br/>
                        <strong>Status:</strong> ${result.user.status}
                    `;
                } else {
                    alert('Registration failed: ' + (result.error || 'Server error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Connection error. Is the backend running?');
            } finally {
                submitBtn.disabled = false;
                btnText.style.opacity = '1';
                spinner.style.display = 'none';
            }
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
