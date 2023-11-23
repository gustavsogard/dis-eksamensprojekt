requestRoute = () => {
    fetch('/', {
        method: 'GET',
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response error');
        }
        return response.text();
    })
    .then(html => {
        document.body.innerHTML = html;
    })
    .catch(error => console.error('Error:', error));}



function authenticate() {
    const password = document.getElementById('password-input').value;
    const element = document.getElementById('location-select');
    const locationName = element.value;
    console.log(locationName);
    console.log(password);
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