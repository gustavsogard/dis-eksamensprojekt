

const buttons = {
    created: `<span class="buttons">
                <button onClick="rejectOrder(this)">Reject</button>
                <button onClick="acceptOrder(this)">Accept</button>
            </span>`,
    progress: `<span class="buttons">
                <button onClick="finishOrder(this)">Finished</button>
            </span>`,
    done: `<span class="buttons">
                <button onClick="reProgress(this)">In progress</button>
                <button onClick="archive(this)">Archive</button>
            </span>`,
}

document.addEventListener('DOMContentLoaded', async () => {
    const orders = await fetch('/orders', {
        method: "GET",
        credentials: "include",
    })
        .then(response => response.json());


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
    })
})