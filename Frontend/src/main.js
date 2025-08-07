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

    // Function to update the navbar based on user role
    function updateNavbar() {
        if (userRole === 'patient') {
            myAppointmentsTab.style.display = 'block';
            authButton.innerHTML = '<a href="#" class="logout-button" onclick="logout()">Logout</a>';
        } else {
            myAppointmentsTab.style.display = 'none';
            authButton.innerHTML = '<a href="login.html" class="login-button">Login</a>';
        }
    }
    updateNavbar();

    // Function to handle logout
    window.logout = function () {
        localStorage.removeItem('userRole');
        location.reload();
    };

    // JavaScript to toggle the hamburger menu
    const bar = document.getElementById('bar');
    if (bar) {
        bar.addEventListener('click', function () {
            const menu = document.querySelector('nav ul');
            menu.classList.toggle('active');
        });
    }

    // Initialize slides position
    slide.forEach(function (slides, index) {
        slides.style.left = `${index * 100}%`;
    });

    // Function to handle slide animation
    function myFun() {
        slide.forEach(function (curVal) {
            curVal.style.transform = `translateX(-${count * 99}%)`;
        });
    }

    // Automatic slide change every 2 seconds
    setInterval(function () {
        count++;
        if (count == slide.length) {
            count = 0;
        }
        myFun();
    }, 2000);

    // Event listeners for doctor cards
    card.forEach(function (cards) {
        cards.addEventListener("click", function () {
            console.log(cards.firstElementChild.src);
            document.querySelector(".content").style.display = "block";
            document.querySelector(".contentDetail").innerHTML = `
                <img src=${cards.firstElementChild.src}>
                <div>
                    <h1>Dr Alexa Zoan</h1>
                    <p>Experienced surgeon specializing in minimally invasive procedures.</p>
                    <p>Experience: 10 Years</p>
                </div>
            `;
            // Close button functionality
            closeBtn.addEventListener("click", function () {
                document.querySelector(".content").style.display = "none";
            });
        });
    });

    // Event listener for the connect button (Login form)
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

    // Contact Us form submission
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
});
// Word-by-word animation function
function animateWords(selector, delay = 300) {
    const el = document.querySelector(selector);
    
    // Replace <br> with a placeholder token
    const rawHTML = el.innerHTML.replace(/<br\s*\/?>/gi, '[[BR]]');
    const words = rawHTML.split(' ');

    el.innerHTML = ''; // Clear existing content

    let index = 0;

    words.forEach((word) => {
        if (word.includes('[[BR]]')) {
            // If word has [[BR]], split and handle both parts
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

// Apply to your headings
animateWords('#heading1', 200);
animateWords('#heading3', 300);

// Logout functionality
// document.getElementById('logoutBtn').addEventListener('click', logout);

// function logout() {
//     localStorage.removeItem('token');
//     localStorage.removeItem('patientId');
//     localStorage.removeItem('doctorId');
//     localStorage.removeItem('role');
//     showToast("Logged out successfully!");
//     setTimeout(() => {
//         window.location.href = 'login.html';
//     }, 1500);
// }

// Dummy showToast function (you can replace it with your own)
function showToast(msg) {
    alert(msg); // Replace with a fancier toast if needed
}
