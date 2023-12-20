// authenticate funktionen tager passworded og lokationen fra input felterne og sender dem til databasen
// ved et POST kald til /authentication
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
// hvis der er en response token så sættes vinduet til /
    .then(response => {
        if (response.token) {
            window.location.href = '/';
            return;
        } else {
            console.log("Authentication failed");
        }
    })
}

// tager passwordet og gør det synligt, hvis det er skjult og omvendt
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