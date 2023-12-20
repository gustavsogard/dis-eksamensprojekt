// opretter html elementer for statusserne
const buttons = {
    created: `<span class="buttons">
                <button onClick="rejectOrder(this)">Reject</button>
                <button onClick="acceptOrder(this)">Accept</button>
            </span>`,
    accepted: `<span class="buttons">
                <button onClick="finishOrder(this)">Finished</button>
            </span>`,
    done: `<span class="buttons">
                <button onClick="reProgress(this)">In progress</button>
                <button onClick="archive(this)">Archive</button>
            </span>`,
}
// dom content loaded, henter alle ordrer fra api 
document.addEventListener('DOMContentLoaded', async () => {
    const orders = await fetch('/api/orders', {
        method: "GET",
        credentials: "include",
    })
        .then(response => response.json());

// tager fat i de forskellige kolonner efter deres id
    const createdColumn = document.querySelector('#created');
    const progressColumn = document.querySelector('#progress');
    const doneColumn = document.querySelector('#done');
// for hver ordre, oprettes et div element med en klasse og id
// og der bliver tilføjet navn på kunden, og en boks for hver ordre
// der bliver tilføjet en knap for hver status, som kan ændre statussen
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order');
        orderElement.id = order.order_id;
        orderElement.innerHTML = `
            <p class="nameOnOrder">${order.customer_name}</p>
            <ul>
                ${order.products.map(product => `<li>${product.product_name} x${product.quantity}</li>`).join('')}
            </ul>
            ${buttons[order.status]}
        `;
// hvis status er created, så bliver ordren tilføjet til created kolonnen
// hvis status er accepted, så bliver ordren tilføjet til progress kolonnen
// hvis status er done, så bliver ordren tilføjet til done kolonnen
        if (order.status === 'created') {
            createdColumn.appendChild(orderElement);
        } else if (order.status === 'accepted') {
            progressColumn.appendChild(orderElement);
        } else if (order.status === 'done') {
            doneColumn.appendChild(orderElement);
        }
    })
})