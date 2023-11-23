const socket = io();
console.log(socket)

function acceptOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.progress;
    socket.emit('orderAccepted', order.id);
}

socket.on('orderAccepted', orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.progress;
    const progressColumn = document.querySelector('#progress');
    progressColumn.appendChild(order);
})

function finishOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    socket.emit("orderFinished", order.id);   
}

socket.on("orderFinished", orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    const doneColumn = document.querySelector("#done");
    doneColumn.appendChild(order);
});

function reProgress(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.progress;
    socket.emit('orderAccepted', order.id);
}

socket.on('orderAccepted', orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.progress;
    const progressColumn = document.querySelector('#progress');
    progressColumn.appendChild(order);
})

function archive(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('orderArchived', order.id);
}

socket.on('orderArchived', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    //Gem til database senere
})

function rejectOrder(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('orderRejected', order.id);
}

socket.on('orderRejected', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    //Gem til database senere
});

socket.on("newOrder", order => {
    const orderElement = document.createElement("div");
    orderElement.classList.add("order");
    orderElement.id = order.id;
    orderElement.innerHTML = `
        <p>${order.customer}</p>
        <ul>
            ${order.products.map(product => `<li>${product.name}</li>`).join("")}
        </ul>
        ${buttons[order.status]}
    `;
    const createdColumn = document.querySelector("#created");
    createdColumn.appendChild(orderElement);
})

