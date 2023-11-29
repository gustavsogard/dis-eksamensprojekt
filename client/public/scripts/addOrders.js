function addToOrdersList(e) {
    orderName = e.value;
    const orderElement = document.createElement("div");
    orderElement.classList.add("ordersInOrdersList");
    orderElement.innerHTML = `<p>${orderName}</p>`

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

function submitOrder() {
    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("phoneNumber").value;
 
    const orderList = document.getElementById("currentOrderList");
    const orderListItems = orderList.querySelectorAll("p");
    const order = [];

    index = 0;
    orderListItems.forEach((item, index) => {
        order.push({ id: index + 1, name: item.innerText });
    });

    const orderToSend = {
        customer: customerName,
        products: order,
        phoneNum: customerPhone,
    };

    console.log(orderToSend);
    fetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderToSend),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            orderList.innerHTML = "";
            document.getElementById("customerName").value = "";
            document.getElementById("phoneNumber").value = "";
            
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('[data-modal]');

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
