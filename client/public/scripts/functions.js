const socket = io();

function acceptOrder(e) {
    const order = e.parentNode.parentNode;
    order.querySelector('.buttons').remove();
    order.innerHTML += buttons.progress;
    socket.emit('orderAccepted', order.id);
}

socket.on('orderAccepted', orderId => {
    const order = document.getElementById(orderId);
    const progressColumn = document.querySelector('#progress');
    progressColumn.appendChild(order);
})