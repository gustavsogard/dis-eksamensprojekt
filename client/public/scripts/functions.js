// socket bliver defineret
const socket = io();
// accept ordrer knappen ændres til accepted
function acceptOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    socket.emit('accepted', order.id);
}
// når der emittes accepted, så bliver knappen ændret til accepted, og ordren bliver flyttet til progress kolonnen
socket.on('accepted', orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    const progressColumn = document.querySelector('#progress');
    progressColumn.appendChild(order);
})
// når der trykkes på finished, så bliver knappen ændret til done, og der emittes done
function finishOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    socket.emit("done", order.id);   
}
// når der emittes done, så bliver knappen ændret til done, og ordren bliver flyttet til done kolonnen
socket.on("done", orderId => {
    const order = document.getElementById(orderId);
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.done;
    const doneColumn = document.querySelector("#done");
    doneColumn.appendChild(order);
});
// når der trykkes på in progress, så bliver knappen ændret til accept 
function reProgress(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.accepted;
    socket.emit('accepted', order.id);
}
// når der trykkes på archive, så bliver ordren fjernet fra siden
function archive(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('archived', order.id);
}
// når der emittes archived, så emittes der archived, og ordren bliver fjernet fra siden
socket.on('archived', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    socket.emit('archived', order.id);
})
// når ordrer bliver afvist så bliver de fjernet fra siden og emittet rejected
function rejectOrder(e) {
    const order = e.parentNode.parentNode;
    order.remove();
    socket.emit('rejected', order.id);
}
// når der emittes rejected, så bliver ordren fjernet fra siden
socket.on('rejected', orderId => {
    const order = document.getElementById(orderId);
    order.remove();
    socket.emit('rejected', order.id);
    //Gem til database senere
});
// når der emittes newOrder, så laves HTML'en for ordren lavet og tilføjes til created kolonnen
socket.on("newOrder", order => {
    const orderElement = document.createElement("div");
    orderElement.classList.add("order");
    orderElement.id = order.order_id;
    orderElement.innerHTML = `
        <p class="nameOnOrder">${order.customer_name}</p>
        <ul>
            ${order.products.map(product => `<li>${product.product_name} x${product.quantity}</li>`).join('')}
        </ul>
        ${buttons[order.status]}
    `;
    const createdColumn = document.querySelector("#created");
    createdColumn.appendChild(orderElement);
})

