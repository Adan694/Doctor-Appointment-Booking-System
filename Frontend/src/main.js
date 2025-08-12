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
    if (doctorContainer) {
        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "Loading doctors...";
        doctorContainer.appendChild(loadingMessage);

        fetch("http://localhost:3000/api/doctors/alldoctors")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch doctors");
                return res.json();
            })
            .then((doctors) => {
                doctorContainer.innerHTML = "";

                const displayedDoctors = doctors.slice(0, 3);
                displayedDoctors.forEach((doctor) => {
                    const card = document.createElement("div");
                    card.className = "card";
                    card.innerHTML = `
                        <img src="${doctor.image}" alt="${doctor.name}" />
                        <p><strong>${doctor.name}</strong></p>
                        <p>${doctor.speciality}</p>
                    `;
                    card.addEventListener("click", () => {
                        window.location.href = `doctor.html?id=${encodeURIComponent(doctor._id)}`;
                    });

                    doctorContainer.appendChild(card);
                });
            })
            .catch((err) => {
                doctorContainer.innerHTML = "<p style='color:red;'>Failed to load doctors.</p>";
                console.error("Error:", err);
            });
    }

// Update navigation bar based on user role
   function updateNavbar() {
    const profileMenu = document.getElementById('profileMenu');
    const authButton = document.getElementById('authButton');
    const userRole = localStorage.getItem('userRole');

    if (userRole === 'patient') {
        if (profileMenu) profileMenu.style.display = 'block';
        if (authButton) {
            authButton.innerHTML = `
                <a href="javascript:void(0);" onclick="logout()" class="logout-button">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </a>
            `;
        }
    } else {
        if (profileMenu) profileMenu.style.display = 'none';
        if (authButton) {
            authButton.innerHTML = `
                <a href="login.html" class="login-button">
                    <i class="fa-solid fa-right-to-bracket"></i> Login
                </a>
            `;
        }
    }
    }
    // Profile icon click event
const profileIcon = profileMenu.querySelector('.profile-icon');
profileIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    profileMenu.classList.toggle('active');
});
    document.addEventListener('click', () => {
        if (profileMenu) profileMenu.classList.remove('active');
    });
    updateNavbar();

     // Logout function
    window.logout = function () {
        localStorage.removeItem('userRole');
        updateNavbar();
        location.reload();
    };

    // Mobile menu toggle
    const bar = document.getElementById('bar');
    if (bar) {
        bar.addEventListener('click', function () {
            const menu = document.querySelector('nav ul');
            menu.classList.toggle('active');
        });
    }

    // Initialize slides for patient cards
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

    // card.forEach(function (cards) {
    //     cards.addEventListener("click", function () {
    //         console.log(cards.firstElementChild.src);
    //         document.querySelector(".content").style.display = "block";
    //         document.querySelector(".contentDetail").innerHTML = `
    //             <img src=${cards.firstElementChild.src}>
    //             <div>
    //                 <h1>Dr Alexa Zoan</h1>
    //                 <p>Experienced surgeon specializing in minimally invasive procedures.</p>
    //                 <p>Experience: 10 Years</p>
    //             </div>
    //         `;
    //         closeBtn.addEventListener("click", function () {
    //             document.querySelector(".content").style.display = "none";
    //         });
    //     });
    // });

     // Connect button event for login validation
    if (connectBtn) {
        connectBtn.addEventListener("click", function () {
            let email = document.getElementById("email");
            let pass = document.getElementById("pass");
            let contact = document.getElementById("contact");

            // Email validation
            let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email.value)) {
                alert("Invalid email address");
                return;
            }

            // Contact number validation
            let contactRegex = /^[0-9]{11}$/;
            if (!contactRegex.test(contact.value)) {
                alert("Invalid contact number");
                return;
            }

            // Password validation
            if (pass.value.length < 8) {
                alert("Password must be at least 8 characters long");
                return;
            }

            // Check if all fields are filled
            if (email.value === "" || pass.value === "" || contact.value === "") {
                alert("Please Enter Details");
            } else {
                alert("You Logged In");
                localStorage.setItem('userRole', 'patient');
                updateNavbar();
            }
        });
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;

            const data = { email, name, phone, message };

            try {
                const response = await fetch('http://localhost:3000/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                alert(result.message || 'Form submitted successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to submit. Try again.');
            }
        });
    }

     // Animate words in specified selector
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
    function showToast(msg) {
        alert(msg); // Replace with a fancier toast if needed
    }
})