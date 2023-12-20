async function authenticate() {
    const password = document.getElementById('password-input').value;
    const element = document.getElementById('location-select');
    const locationName = element.value;
    return fetch('/authentication', {
        method: 'POST',
        body: JSON.stringify({ password, locationName}),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    // check if token is valid
    .then(response => {
        if (response.token) {
            window.location.href = '/';
            return;
        } else {
            // skal det her være der?
            console.log("Authentication failed");
        }
    })
}

// JavaScript to toggle password visibility
function togglePasswordVisibility() {
    var passwordInput = document.getElementById('password-input');
    var togglePassword = document.getElementById('toggle-password');
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }
}