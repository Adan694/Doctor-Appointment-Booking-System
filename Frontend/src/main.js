document.addEventListener('DOMContentLoaded', function () {
    const userRole = localStorage.getItem('userRole');
    const authButton = document.getElementById('authButton');
    const myAppointmentsTab = document.getElementById('myprofile');
    const closeBtn = document.getElementById("close");
    const connectBtn = document.getElementById("connectBtn");
    let slide = document.querySelectorAll(".patientCard");
    let card = document.querySelectorAll(".card");
    let count = 0;
    const doctorContainer = document.getElementById("doctorContainer");
function updateNavbar() {
    const profileMenu = document.getElementById('profileMenu');
    const authButton = document.getElementById('authButton');
    const userRole = localStorage.getItem('userRole');
    const dropdown = profileMenu ? profileMenu.querySelector('.dropdown-menu') : null;

    if (userRole === 'patient') {
        if (profileMenu) profileMenu.style.display = 'block';
        if (authButton) authButton.style.display = 'none';

    if (dropdown && !document.getElementById('logoutLink')) {
    const logoutLi = document.createElement('li');
    logoutLi.innerHTML = `
        <a href="javascript:void(0);" id="logoutLink" class="logout-button" onclick="logout()">
             Logout
        </a>
    `;
    dropdown.appendChild(logoutLi);
}
    } else {
        if (profileMenu) profileMenu.style.display = 'none';
        if (authButton) {
            authButton.style.display = 'block';
            authButton.innerHTML = `
                <a href="login.html" class="login-button">
                    <i class="fa-solid fa-right-to-bracket"></i> Login
                </a>
            `;
        }
    }
}

const profileMenu = document.getElementById('profileMenu');
if (profileMenu) {
    const profileIcon = profileMenu.querySelector('.profile-icon');
    profileIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });
}

updateNavbar();
window.logout = function () {
    console.log(" Logging out...");
    localStorage.clear();
    updateNavbar();
    location.reload();
};


const bar = document.getElementById('bar');
if (bar) {
    bar.addEventListener('click', function () {
        const menu = document.querySelector('nav ul');
        menu.classList.toggle('active');
    });
}

slide.forEach(function (slides, index) {
    slides.style.left = `${index * 100}%`;
    });
function myFun() {
    slide.forEach(function (curVal) {
    curVal.style.transform = `translateX(-${count * 99}%)`;
    });
}

const prevArrow = document.getElementById('prevArrow');
const nextArrow = document.getElementById('nextArrow');

prevArrow.addEventListener('click', () => {
    count--;
    if (count < 0) count = slide.length - 1;
    myFun();
});

nextArrow.addEventListener('click', () => {
    count++;
    if (count >= slide.length) count = 0;
    myFun();
});
    
  // ========== CONTACT FORM VALIDATION ==========
const contactForm = document.getElementById('contactForm');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactPhone = document.getElementById('contactPhone');
const contactMessage = document.getElementById('contactMessage');

// Error elements
const contactNameError = document.getElementById('contactNameError');
const contactEmailError = document.getElementById('contactEmailError');
const contactPhoneError = document.getElementById('contactPhoneError');
const contactMessageError = document.getElementById('contactMessageError');

// Validation regex patterns (same as booking page)
const nameRegex = /^[A-Za-z\s\-']{3,}$/;
const emailRegex = /^[^\s@]+@([^\s@]+)$/;
const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
const phoneRegex = /^(03[0-9]{9}|0[1-9][0-9]{8,9})$/;

// Helper function to show error
function showContactError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Helper function to hide error
function hideContactError(errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

// Helper function to mark field as error
function markFieldError(field, isError) {
    if (isError) {
        field.classList.add('error');
    } else {
        field.classList.remove('error');
    }
}

// Live validation for NAME
if (contactName) {
    contactName.addEventListener('input', function() {
        const value = this.value.trim();
        
        if (value === '') {
            hideContactError(contactNameError);
            markFieldError(this, false);
        } else if (!nameRegex.test(value)) {
            showContactError(contactNameError, '❌ Name must contain only alphabets, spaces, hyphens, or apostrophes and be at least 3 characters long.');
            markFieldError(this, true);
        } else {
            hideContactError(contactNameError);
            markFieldError(this, false);
        }
    });
}

// Live validation for EMAIL
if (contactEmail) {
    contactEmail.addEventListener('input', function() {
        const value = this.value.trim();
        
        if (value === '') {
            hideContactError(contactEmailError);
            markFieldError(this, false);
        } else {
            const match = emailRegex.exec(value);
            if (!match) {
                showContactError(contactEmailError, '❌ Please enter a valid email address.');
                markFieldError(this, true);
            } else {
                const domain = match[1].toLowerCase();
                if (!allowedDomains.includes(domain)) {
                    showContactError(contactEmailError, '❌ Email must be from: gmail.com, yahoo.com, outlook.com, or hotmail.com');
                    markFieldError(this, true);
                } else {
                    hideContactError(contactEmailError);
                    markFieldError(this, false);
                }
            }
        }
    });
}

// Live validation for PHONE
if (contactPhone) {
    contactPhone.addEventListener('input', function() {
        let value = this.value.trim();
        
        // Allow only digits and plus sign
        value = value.replace(/[^0-9+]/g, '');
        this.value = value;
        
        if (value === '') {
            hideContactError(contactPhoneError);
            markFieldError(this, false);
        } else if (!phoneRegex.test(value)) {
            showContactError(contactPhoneError, '❌ Please enter a valid Pakistani phone number (e.g., 03001234567 or 0421234567).');
            markFieldError(this, true);
        } else {
            hideContactError(contactPhoneError);
            markFieldError(this, false);
        }
    });
}

// Live validation for MESSAGE
if (contactMessage) {
    contactMessage.addEventListener('input', function() {
        const value = this.value.trim();
        
        if (value === '') {
            hideContactError(contactMessageError);
            markFieldError(this, false);
        } else if (value.length < 5) {
            showContactError(contactMessageError, '❌ Message must be at least 5 characters long.');
            markFieldError(this, true);
        } else if (value.length > 500) {
            showContactError(contactMessageError, '❌ Message cannot exceed 500 characters.');
            markFieldError(this, true);
        } else {
            hideContactError(contactMessageError);
            markFieldError(this, false);
        }
    });
}

// Submit handler for contact form
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = contactName.value.trim();
        const email = contactEmail.value.trim();
        const phone = contactPhone.value.trim();
        const message = contactMessage.value.trim();
        
        let isValid = true;
        
        // Validate NAME
        if (!name) {
            showContactError(contactNameError, '❌ Please enter your name.');
            markFieldError(contactName, true);
            isValid = false;
        } else if (!nameRegex.test(name)) {
            showContactError(contactNameError, '❌ Name must contain only alphabets, spaces, hyphens, or apostrophes and be at least 3 characters long.');
            markFieldError(contactName, true);
            isValid = false;
        } else {
            hideContactError(contactNameError);
            markFieldError(contactName, false);
        }
        
        // Validate EMAIL
        if (!email) {
            showContactError(contactEmailError, '❌ Please enter your email.');
            markFieldError(contactEmail, true);
            isValid = false;
        } else {
            const match = emailRegex.exec(email);
            if (!match) {
                showContactError(contactEmailError, '❌ Please enter a valid email address.');
                markFieldError(contactEmail, true);
                isValid = false;
            } else {
                const domain = match[1].toLowerCase();
                if (!allowedDomains.includes(domain)) {
                    showContactError(contactEmailError, '❌ Email must be from: gmail.com, yahoo.com, outlook.com, or hotmail.com');
                    markFieldError(contactEmail, true);
                    isValid = false;
                } else {
                    hideContactError(contactEmailError);
                    markFieldError(contactEmail, false);
                }
            }
        }
        
        // Validate PHONE
        if (!phone) {
            showContactError(contactPhoneError, '❌ Please enter your phone number.');
            markFieldError(contactPhone, true);
            isValid = false;
        } else if (!phoneRegex.test(phone)) {
            showContactError(contactPhoneError, '❌ Please enter a valid Pakistani phone number (e.g., 03001234567 or 0421234567).');
            markFieldError(contactPhone, true);
            isValid = false;
        } else {
            hideContactError(contactPhoneError);
            markFieldError(contactPhone, false);
        }
        
        // Validate MESSAGE
        if (!message) {
            showContactError(contactMessageError, '❌ Please enter your message.');
            markFieldError(contactMessage, true);
            isValid = false;
        } else if (message.length < 5) {
            showContactError(contactMessageError, '❌ Message must be at least 5 characters long.');
            markFieldError(contactMessage, true);
            isValid = false;
        } else if (message.length > 500) {
            showContactError(contactMessageError, '❌ Message cannot exceed 500 characters.');
            markFieldError(contactMessage, true);
            isValid = false;
        } else {
            hideContactError(contactMessageError);
            markFieldError(contactMessage, false);
        }
        
        if (!isValid) {
            // Scroll to first error
            const firstError = document.querySelector('.error-message.show');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Submit form
        const submitBtn = document.getElementById('connectBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('http://localhost:3000/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, message })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('✅ ' + (result.message || 'Message sent successfully!'));
                // Clear form
                contactName.value = '';
                contactEmail.value = '';
                contactPhone.value = '';
                contactMessage.value = '';
                // Remove error styles
                [contactName, contactEmail, contactPhone, contactMessage].forEach(field => {
                    if (field) markFieldError(field, false);
                });
            } else {
                alert('❌ Error: ' + (result.message || 'Failed to send message.'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Network error. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

    function animateWords(selector, delay = 300) {
        const el = document.querySelector(selector);
            const rawHTML = el.innerHTML.replace(/<br\s*\/?>/gi, '[[BR]]');
        const words = rawHTML.split(' ');
        el.innerHTML = ''; 
        let index = 0;

        words.forEach((word) => {
            if (word.includes('[[BR]]')) {
                const parts = word.split('[[BR]]');
                if (parts[0]) {
                    const span = document.createElement('span');
                    span.textContent = parts[0] + ' ';
                    span.style.animationDelay = `${index * delay}ms`;
                    el.appendChild(span);
                    index++;
                }
                el.appendChild(document.createElement('br'));
                if (parts[1]) {
                    const span = document.createElement('span');
                    span.textContent = parts[1] + ' ';
                    span.style.animationDelay = `${index * delay}ms`;
                    el.appendChild(span);
                    index++;
                }
            } else {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.style.animationDelay = `${index * delay}ms`;
                el.appendChild(span);
                index++;
            }
        });
    }
    animateWords('#heading1', 200);
    animateWords('#heading3', 300);
})

function openSpecialityPopup() {
    document.getElementById("specialityPopup").style.display = "flex";
    document.body.style.overflow = "hidden";  
}

function closeSpecialityPopup() {
    document.getElementById("specialityPopup").style.display = "none";
    document.body.style.overflow = "auto";   
}

function goToSpeciality(speciality) {
  window.location.href = "Alldoctorsreal.html?speciality=" + encodeURIComponent(speciality);
}
