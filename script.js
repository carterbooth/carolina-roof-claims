// Form handling and validation
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!validateForm(data)) {
            return;
        }
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        // Submit to backend
        submitToBackend(data)
            .then(result => {
                console.log('Lead submitted successfully:', result);
                showSuccessMessage(result);
                
                // Reset button
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Get Free Assessment';
                submitBtn.disabled = false;
                
                // Reset form
                form.reset();
            })
            .catch(error => {
                console.error('Error submitting lead:', error);
                showErrorMessage();
                
                // Reset button
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Get Free Assessment';
                submitBtn.disabled = false;
            });
    });
    
    // Form validation with anti-spam filtering
    function validateForm(data) {
        const required = ['name', 'phone', 'address', 'damage_date', 'damage_type', 'insurance_status', 'urgency'];
        
        // Check required fields
        for (let field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the ${field.replace('_', ' ')} field.`);
                return false;
            }
        }
        
        // Advanced validation and spam filtering
        if (!validateName(data.name)) {
            alert('Please enter a valid full name.');
            return false;
        }
        
        if (!validatePhone(data.phone)) {
            alert('Please enter a valid US phone number.');
            return false;
        }
        
        if (!validateAddress(data.address)) {
            alert('Please enter a complete street address.');
            return false;
        }
        
        if (!validateEmail(data.email)) {
            alert('Please enter a valid email address or leave it blank.');
            return false;
        }
        
        return true;
    }
    
    // Name validation - detect fake/spam names
    function validateName(name) {
        if (!name || name.trim().length < 2) return false;
        
        // Must have at least first and last name
        const parts = name.trim().split(/\s+/);
        if (parts.length < 2) return false;
        
        // Each part should be at least 2 characters
        for (let part of parts) {
            if (part.length < 2) return false;
        }
        
        // Block obvious spam patterns
        const spamPatterns = [
            /test\s*test/i,
            /asdf/i,
            /qwerty/i,
            /fake/i,
            /spam/i,
            /\d{3,}/,  // 3+ consecutive numbers
            /[^a-zA-Z\s\-'.]/, // invalid characters
            /^[a-z]+$/,  // all lowercase (legitimate names have caps)
            /^[A-Z]+$/   // all uppercase
        ];
        
        for (let pattern of spamPatterns) {
            if (pattern.test(name)) return false;
        }
        
        return true;
    }
    
    // Phone validation - US numbers only, block common fake patterns
    function validatePhone(phone) {
        if (!phone) return false;
        
        // Clean phone number
        const cleaned = phone.replace(/[^\d]/g, '');
        
        // Must be 10 digits for US
        if (cleaned.length !== 10) return false;
        
        // Block fake/test patterns
        const fakePatterns = [
            /^1234567890$/,
            /^0{10}$/,
            /^1{10}$/,
            /^(\d)\1{9}$/,  // same digit repeated
            /^555/, // often fake
            /^000/, // invalid area code
            /^[01]\d{2}/ // invalid area code patterns
        ];
        
        for (let pattern of fakePatterns) {
            if (pattern.test(cleaned)) return false;
        }
        
        return true;
    }
    
    // Address validation - require real street address format
    function validateAddress(address) {
        if (!address || address.trim().length < 10) return false;
        
        // Should have number and street name
        const addressRegex = /^\d+\s+[a-zA-Z]/;
        if (!addressRegex.test(address.trim())) return false;
        
        // Block obvious spam
        const spamPatterns = [
            /test/i,
            /fake/i,
            /asdf/i,
            /123.*test/i,
            /^\d+\s*$/  // just numbers
        ];
        
        for (let pattern of spamPatterns) {
            if (pattern.test(address)) return false;
        }
        
        return true;
    }
    
    // Email validation - optional but if provided must be valid
    function validateEmail(email) {
        if (!email || email.trim() === '') return true; // optional field
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        // Block obvious fake domains
        const fakeDomains = [
            'test.com',
            'fake.com',
            'spam.com',
            'example.com',
            'test.test'
        ];
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (fakeDomains.includes(domain)) return false;
        
        return true;
    }
    
    // Submit lead to backend
    async function submitToBackend(data) {
        const response = await fetch('http://localhost:3001/api/leads/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
    
    // Success message with tier info
    function showSuccessMessage(result = {}) {
        const tierInfo = {
            1: 'Premium Emergency',
            2: 'Standard Priority', 
            3: 'Basic Assessment'
        };
        
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>Assessment Request Received!</h3>
                <p>Thank you! Your request has been classified as <strong>${tierInfo[result.tier] || 'Priority'}</strong> and a qualified contractor will contact you within 24 hours.</p>
                <small>Lead ID: ${result.leadId || 'Generated'} • Check your email for confirmation details.</small>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove after 6 seconds
        setTimeout(() => {
            message.remove();
        }, 6000);
    }
    
    // Error message
    function showErrorMessage() {
        const message = document.createElement('div');
        message.className = 'error-message';
        message.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Submission Failed</h3>
                <p>We're sorry, there was an issue submitting your request. Please try again or use the contact form above.</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '($1) $2');
        }
        
        e.target.value = value;
    });
    
    // Dynamic urgency messaging
    const urgencySelect = document.getElementById('urgency');
    urgencySelect.addEventListener('change', function(e) {
        const submitBtn = document.querySelector('.submit-btn');
        
        switch(e.target.value) {
            case 'emergency':
                submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Get Emergency Assessment';
                submitBtn.style.background = '#dc2626';
                break;
            case 'soon':
                submitBtn.innerHTML = '<i class="fas fa-clock"></i> Get Priority Assessment';
                submitBtn.style.background = '#ea580c';
                break;
            default:
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Get Free Assessment';
                submitBtn.style.background = '#dc2626';
        }
    });
});

// Add message styles
const styles = `
.success-message, .error-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    width: 90%;
    text-align: center;
}

.success-content i {
    color: #10b981;
    font-size: 3rem;
    margin-bottom: 1rem;
}

.error-content i {
    color: #dc2626;
    font-size: 3rem;
    margin-bottom: 1rem;
}

.success-content h3, .error-content h3 {
    color: #1e40af;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.success-content p, .error-content p {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.success-content small {
    color: #9ca3af;
    font-size: 0.9rem;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);