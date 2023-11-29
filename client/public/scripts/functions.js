const socket = io();


function acceptOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    socket.emit('accepted', order.id);
}

socket.on('accepted', orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    const progressColumn = document.querySelector('#progress');
    progressColumn.appendChild(order);
})

function finishOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    socket.emit("done", order.id);   
}

socket.on("done", orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    const doneColumn = document.querySelector("#done");
    doneColumn.appendChild(order);
});

function reProgress(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    socket.emit('accepted', order.id);
}

function archive(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('archived', order.id);
}

socket.on('archived', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    socket.emit('archived', order.id);
})

function rejectOrder(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('rejected', order.id);
}

socket.on('rejected', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    socket.emit('rejected', order.id);
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

