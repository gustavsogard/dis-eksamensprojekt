const buttons = {
    created: `<span class="buttons">
                <button>Reject</button>
                <button onClick="acceptOrder(this)">Accept</button>
            </span>`,
    progress: `<span class="buttons">
                <button>Finished</button>
            </span>`,
    done: `<span class="buttons">
                <button>In progress</button>
                <button>Archive</button>
            </span>`,
}

document.addEventListener('DOMContentLoaded', async () => {
    const orders = await fetch('http://localhost:3000/orders')
        .then(response => response.json());
    console.log(orders);

    const createdColumn = document.querySelector('#created');
    const progressColumn = document.querySelector('#progress');
    const doneColumn = document.querySelector('#done');

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order');
        orderElement.id = order.id;
        orderElement.innerHTML = `
            <p>${order.customer}</p>
            <ul>
                ${order.products.map(product => `<li>${product.name}</li>`).join('')}
            </ul>
            ${buttons[order.status]}
        `;

        if (order.status === 'created') {
            createdColumn.appendChild(orderElement);
        } else if (order.status === 'progress') {
            progressColumn.appendChild(orderElement);
        } else if (order.status === 'done') {
            doneColumn.appendChild(orderElement);
        }
    }
)})