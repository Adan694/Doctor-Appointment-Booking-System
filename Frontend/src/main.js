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
// Update navigation bar based on user role
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
    
    contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pass = document.getElementById('pass') ? document.getElementById('pass').value.trim() : '';
    const message = document.getElementById('message').value.trim();

         if (!email || !name || !phone || !message || (document.getElementById('pass') && !pass)) {
            alert(" Please enter all fields.");
            return;
        }

    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        isValid = false;
    }

    if (name.length < 2) {
        alert("Please enter your full name (at least 2 characters).");
        isValid = false;
    }

    const pkPhoneRegex = /^((\+92|0)3[0-9]{9}|0[1-9][0-9]{8,9})$/;
    if (!pkPhoneRegex.test(phone)) {
        alert("Please enter a valid Pakistani mobile or PTCL number.");
        isValid = false;
    }

    if (pass && pass.length < 6) {
        alert("Password must be at least 6 characters long");
        isValid = false;
    }

    if (message.length === 0) {
        alert("Please enter a message.");
        isValid = false;
    }

    if (!isValid) return;

    const data = { email, name, phone, message, ...(pass && { password: pass }) };

    try {
        const response = await fetch('http://localhost:3000/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message || 'Form submitted successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit. Try again.');
    }
});


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
