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

    // Load doctors from API
    // if (doctorContainer) {
    //     const loadingMessage = document.createElement("p");
    //     loadingMessage.textContent = "Loading doctors...";
    //     doctorContainer.appendChild(loadingMessage);

    //     fetch("http://localhost:3000/api/doctors/alldoctors")
    //         .then((res) => {
    //             if (!res.ok) throw new Error("Failed to fetch doctors");
    //             return res.json();
    //         })
    //         .then((doctors) => {
    //             doctorContainer.innerHTML = "";

    //             const displayedDoctors = doctors.slice(0, 3);
    //             displayedDoctors.forEach((doctor) => {
    //                 const card = document.createElement("div");
    //                 card.className = "card";
    //                 card.innerHTML = `
    //                     <img src="${doctor.image}" alt="${doctor.name}" />
    //                     <p><strong>${doctor.name}</strong></p>
    //                     <p class="speciality">${doctor.speciality}</p>
    //                 `;
    //                 card.addEventListener("click", () => {
    //                     window.location.href = `doctor.html?id=${encodeURIComponent(doctor._id)}`;
    //                 });

    //                 doctorContainer.appendChild(card);
    //             });
    //         })
    //         .catch((err) => {
    //             doctorContainer.innerHTML = "<p style='color:red;'>Failed to load doctors.</p>";
    //             console.error("Error:", err);
    //         });
    // }
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
    console.log("🚪 Logging out...");
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
    
    // if (connectBtn) {
    //     connectBtn.addEventListener("click", function () {
    //         let email = document.getElementById("email");
    //         let pass = document.getElementById("pass");
    //         let contact = document.getElementById("contact");

    //         let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    //         if (!emailRegex.test(email.value)) {
    //             alert("Invalid email address");
    //             return;
    //         }

    //         let contactRegex = /^((\+92|0)3[0-9]{9}|0[1-9][0-9]{8,9})$/;
    //         if (!contactRegex.test(contact.value)) {
    //             alert("Invalid contact number");
    //             return;
    //         }

    //         if (pass.value.length < 6) {
    //             alert("Password must be at least 6 characters long");
    //             return;
    //         }

    //         if (email.value === "" || pass.value === "" || contact.value === "") {
    //             alert("Please Enter Details");
    //         } else {
    //             alert("You Logged In");
    //             localStorage.setItem('userRole', 'patient');
    //             updateNavbar();
    //         }
    //     });
    // }

//     const contactForm = document.getElementById('contactForm');
//     if (contactForm) {
//         contactForm.addEventListener('submit', async function (e) {
//             e.preventDefault();

//             const email = document.getElementById('email').value.trim();
// const name = document.getElementById('name').value.trim();
// const phone = document.getElementById('phone').value.trim();
// const message = document.getElementById('message').value.trim();

// let isValid = true;

// // 📧 Email validation
// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// if (!emailRegex.test(email)) {
//     alert("Please enter a valid email address.");
//     isValid = false;
// }

// // 👤 Name validation
// if (name.length < 2) {
//     alert("Please enter your full name (at least 2 characters).");
//     isValid = false;
// }

// // 📱 Pakistani phone validation (Mobile or PTCL, with optional +92)
// const pkPhoneRegex = /^((\+92|0)3[0-9]{9}|0[1-9][0-9]{8,9})$/;
// if (!pkPhoneRegex.test(phone)) {
//     alert("Please enter a valid Pakistani mobile or PTCL number.");
//     isValid = false;
// }

// // 📝 Message validation
// if (message.length === 0) {
//     alert("Please enter a message.");
//     isValid = false;
// }

// if (!isValid) return;

// // ✅ If all checks pass, proceed with form submission (fetch or whatever)
// alert("Form is valid, submitting...");


//             const data = { email, name, phone, message };

//             try {
//                 const response = await fetch('http://localhost:3000/contact', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify(data)
//                 });

//                 const result = await response.json();
//                 alert(result.message || 'Form submitted successfully!');
//             } catch (error) {
//                 console.error('Error:', error);
//                 alert('Failed to submit. Try again.');
//             }
//         });
    //     }
    contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pass = document.getElementById('pass') ? document.getElementById('pass').value.trim() : '';
    const message = document.getElementById('message').value.trim();

         if (!email || !name || !phone || !message || (document.getElementById('pass') && !pass)) {
            alert("❌ Please enter all fields.");
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
