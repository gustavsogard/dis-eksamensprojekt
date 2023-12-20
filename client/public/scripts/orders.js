// alle kommentarer er på dansk

// addToOrdersList sætter HTML op for varer på dashboard siden
// addToOrdersList bliver kaldt når der trykkes på en vare i menuen
function addToOrdersList(e) {
    const orderName = e.value;
    const orderElement = document.createElement("div");
    orderElement.classList.add("ordersInOrdersList");
    orderElement.innerHTML = insertCorrectQuantity(e);
    
    if (orderElement.innerHTML !== "undefined") {
        //create button the removes the item from the list
        const removeButton = document.createElement("button");
        removeButton.classList.add("removeButton");
        removeButton.innerHTML = "X";
        removeButton.addEventListener("click", () => {
            orderElement.remove();
        });
        orderElement.appendChild(removeButton);

        const currentOrderList = document.getElementById("currentOrderList");
        currentOrderList.appendChild(orderElement);
    }   
}
// insertCorrectQuantity tjekker om varen allerede er tilføjet til listen, hvis den er, så opdateres antallet
function insertCorrectQuantity(e) {
    const currentOrderList = document.getElementById("currentOrderList");
    const orderListItems = currentOrderList.querySelectorAll("p");

    for (const item of orderListItems) {
        const itemName = item.innerText.substring(0, e.value.length);

        if (itemName === e.value) {
            const quantity = parseInt(item.innerText.match(/x(\d+)/)[1]);
            const updatedQuantity = quantity + 1;
            item.innerText = `${e.value} x${updatedQuantity}`;
            return; // exit the function if the item is found and updated
        }
    }

    // hvis varen ikke er tilføjet til listen, så tilføjes den med antallet 1
    return `<p>${e.value} x1</p>`;
}


// tager fat i værdierne fra input felterne og laver et array med dem
function submitOrder() {
    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("phoneNumber").value;
    const customerPhoneCode = document.getElementById("phoneCode").value;

    const orderList = document.getElementById("currentOrderList");
    const orderListItems = orderList.querySelectorAll("p");
    const order = [];
    // laver et indeks for hver vare, så de kan identificeres, og de bliver added til et array
    index = 0;
    orderListItems.forEach((item, index) => {
        const itemName = item.innerText.split(" x")[0];
        const itemQuantity = item.innerText.split(" x")[1];
        order.push({ id: index + 1, name: itemName, quantity: itemQuantity });
    });
    // hvis der ikke er nogen varer i listen, så kommer der en alert
    if (order.length === 0) {
        alert("You must add at least one item to the order!");
        return;
    }
    // hvis der ikke er nogen kunde navn, så kommer der en alert
    if (customerName === "") {
        alert("You must add a customer name!");
        return;
    }
    // hvis der ikke er noget telefon nummer, så kommer der en alert
    if (customerPhone === "") {
        alert("You must add a customer phone number!");
        return;
    }
    // hvis telefon nummeret ikke er 8 cifre, så kommer der en alert
    if (customerPhone.length != 8 || document.getElementById("phoneCode").value === "") {
        alert("You must add a valid phone number!");
        return;
    }
    // der fetches produkterne fra databasen
    fetch("/api/products", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((products) => {
            // mapper produkterne til et objekt
            const productMap = {};
            products.forEach((product) => {
                productMap[product.product_name] = product.id;
            });

            // Map order items til product IDs
            const orderToSend = {
                customer_name: customerName,
                products: order.map((item) => {
                    return {
                        product_id: productMap[item.name],
                        product_name: item.name,
                        quantity: item.quantity,
                    };
                }),
                customer_phone: customerPhoneCode + customerPhone,
            };

            // send ordrerne til databasen
            return fetch("/api/orders", {
                method: "POST",
                body: JSON.stringify(orderToSend),
                headers: {
                    "Content-Type": "application/json",
                },
            });
        })
        .then((response) => response.json())
        .then((data) => {
            // fjerner indholdet i input felterne og listen
            orderList.innerHTML = "";
            document.getElementById("customerName").value = "";
            document.getElementById("phoneNumber").value = "";
            document.getElementById("ordersPlaced").innerText = "Orders are now placed!";
        })
        .catch((error) => {
            console.error(error);
            // Handle errors
        });
}


// åbner og lukker modalen
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('[data-modal]');
    // for hvert modal element, tilføjes en eventlistener til at åbne modalen
    modals.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
        event.preventDefault();
        const modal = document.getElementById(trigger.dataset.modal);
        modal.classList.add('open');
        const exits = modal.querySelectorAll('.modal-exit');
        exits.forEach(function (exit) {
        exit.addEventListener('click', function (event) {
            event.preventDefault();
            modal.classList.remove('open');
        });
        });
    });
    });
});