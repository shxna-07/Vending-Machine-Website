document.addEventListener("DOMContentLoaded", () => {
    let vendingMachines = {};
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalForm = document.getElementById("modal-form");
    const formFields = document.getElementById("form-fields");
    const modalSubmit = document.getElementById("modal-submit");

    async function fetchVendingMachines() {
        try {
            const response = await fetch("http://127.0.0.1:8080/api/vending-machines");
            if (!response.ok) {
                throw new Error("Failed to fetch vending machines");
            }

            vendingMachines = await response.json();
            renderVendingMachines(vendingMachines);
        } catch (error) {
            console.error("Error fetching vending machines:", error);
        }
    }

    function viewAllItems() {
        fetch("http://127.0.0.1:8080/api/items")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch items");
                }
                return response.json();
            })
            .then(data => {
                displayItems(data);
            })
            .catch(error => {
                console.error("Error fetching items:", error);
            });
    }

    function displayItems(items) {
        const container = document.querySelector(".container");
        container.innerHTML = "";

        if (items.length === 0) {
            container.innerHTML = "<p>No items found.</p>";
            return;
        }

        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Cost</th>
                    <th>Image</th>
                    <th>Availability</th>
                    <th>Item Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${items
                .map(
                    (item, index) => {
                        const availabilityDisplay = item.availability === 1 ? "Available" : "Unavailable";
                        const imageUrl = item.item_image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq-4lVkrGko5C8Q50toWz8A3vCnZFZz4m-_w&s";
                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.item_name}</td>
                                <td>${item.item_cost}</td>
                                <td><img src="${imageUrl}" alt="${item.name}" class="item-image" width="50"></td>
                                <td>${availabilityDisplay}</td>
                                <td>${item.item_quantity}</td>
                            </tr>
                        `;
                    }
                )
                .join("")}
            </tbody>
        `;
        container.appendChild(table);
    }

    document.getElementById("view-item-button").addEventListener("click", viewAllItems);

    function renderVendingMachines(vendingMachines) {
        const vendingMachinesContainer = document.querySelector(".container");
        if (!vendingMachinesContainer) {
            console.error("No container element wiht the class '.container' found in the DOM");
            return;
        }
        vendingMachinesContainer.innerHTML = "";
        vendingMachines.forEach((machine) => {
            const section = document.createElement("div");
            section.id = `machine-${machine.vending_machine_id}`;
            section.classList.add("highlight");

            const machineHeader = document.createElement("h2");
            machineHeader.classList.add("items-header");
            machineHeader.textContent = `Items in ${machine.name}`;
            section.appendChild(machineHeader);

            const itemsContainer = document.createElement("div");
            itemsContainer.classList.add("items");
            section.appendChild(itemsContainer);

            vendingMachinesContainer.appendChild(section);
            fetchItems(machine.vending_machine_id);
        });
    }

    //fetch and display all items for a specific vending machine
    async function fetchItems(vendingMachineId) {

        const sectionId = `machine-${vendingMachineId}`;
        const section = document.getElementById(sectionId);

        if (!section) return;
        const itemsContainer = section.querySelector(".items");
        const itemsName = section.querySelector(".items-header");

        if (!itemsContainer || !itemsName) {
            console.error(`DOM elements not found in the section ${sectionId}`);
            return;
        }

        try {
            itemsContainer.innerHTML = "<p>Loading items...</p>";

            const response = await fetch(`http://127.0.0.1:8080/api/vending-machines/${vendingMachineId}/items`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items for vending machine ID ${vendingMachineId}`);
            }

            const items = await response.json();

            if (!items || items.length === 0) {
                itemsContainer.innerHTML = "<p>No items available in this vending machine.</p>";
                return;
            }

            itemsContainer.innerHTML = "";
            itemsName.innerHTML = `Items in Machine ${vendingMachineId}`;

            items.forEach((item) => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("item-card");

                let costDisplay = item.item_cost && !isNaN(item.item_cost)
                    ? `$${parseFloat(item.item_cost).toFixed(2)}`
                    : "Not Available";

                let availabilityDisplay = item.availability === 1 ? "Available" : "Unavailable";
                itemDiv.innerHTML = `
                    <h3>${item.item_name}</h3>
                    <p>Cost: ${costDisplay}</p>
                    <img src="${item.item_image}" alt="${item.item_name}" class="item_image"/>
                    <p>Availablity: ${availabilityDisplay}</p>
                    <p>Quantity: ${item.item_quantity}</p>
                    `;
                itemsContainer.appendChild(itemDiv);
            });
        } catch (error) {
            console.error(`Error fetching items for vending machine ID ${vendingMachineId}:`, error);
            itemsContainer.innerHTML = "<p>Failed to load items. Please try again later.</p>";
        }

    };

    //fetch items for all vending machines
    function fetchAllItems() {
        if (Array.isArray(vendingMachines) && vendingMachines.length > 0) {
            vendingMachines.forEach((machine) => {
                fetchItems(machine.vending_machine_id);
            });
        }
    }

    //add new item
    async function addItem(data) {

        try {
            const response = await fetch(`http://127.0.0.1:8080/api/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert("Item added successfully!");
                fetchItems();
            } else {
                const errorData = await response.json();
                alert(`Failed to add item: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error adding item:", error);
            alert("An error occurred while adding the item. Please try again.");
        }
    }

    //update an item
    async function updateItem(itemId, data) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/api/items/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert("Item updated successfully!");
            } else {
                const errorData = await response.json();
                alert(`Failed to update item: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error updating item:", error);
            alert("An error occurred while updating the item. Please try again.");
        }
    }

    //delete an item
    async function deleteItem(itemid) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/api/items/${itemid}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Item deleted successfully!");
            } else {
                const errorData = await response.json();
                alert(`Failed to delete item: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("An error occurred while deleting the item. Please try again.");
        }
    }

    function showModal(title, fieldsHTML, submitHandler) {
        modalTitle.textContent = title;
        formFields.innerHTML = fieldsHTML;
        modalSubmit.onclick = (e) => {
            e.preventDefault();
            submitHandler(new FormData(modalForm));
        };
        modal.classList.add("show");
        modal.classList.remove("hidden");
    }

    const closeModalButton = document.getElementById("close-modal-button");
    closeModalButton.addEventListener("click", () => {
        modal.classList.add("hidden");
        modal.classList.remove("show");
    });

    document.getElementById("add-button").addEventListener("click", () => {
        showModal(
            "Add Item",
            `
            <label>Item Name: <input name="item_name" type="text" required></label>
            <label>Item Cost: <input name="item_cost" type="number" step="0.01" required></label>
            <label>Image URL: <input name="item_image" type="url" required></label>
            <label>Availability: <input name="availability" type="number" required></label>
            <label>Quantity: <input name="item_quantity" type="number" required></label>
            `,
            async (formData) => {
                const data = Object.fromEntries(formData);
                await addItem(data);
            }
        );
    });

    document.getElementById("update-button").addEventListener("click", () => {
        showModal(
            "Update Item",
            `
            <label>Item ID: <input name="item_id" type="number" required></label>
            <label>Item Name: <input name="item_name" type="text" required></label>
            <label>Item Cost: <input name="item_cost" type="number" step="0.01" required></label>
            <label>Image URL: <input name="item_image" type="url" required></label>
            <label>Availability: <input name="availability" type="number" required></label>
            <label>Quantity: <input name="item_quantity" type="number" required></label>
            `,
            async (formData) => {
                const data = Object.fromEntries(formData);
                await updateItem(data.item_id, data);
            }
        );
    });

    document.getElementById("delete-button").addEventListener("click", () => {
        showModal(
            "Delete Item",
            `
            <label>Item ID: <input name="item_id" type="number" required></label>
            `,
            async (formData) => {
                const { item_id } = Object.fromEntries(formData);
                await deleteItem(item_id);
            }
        );
    })

    //fetch all items intially
    fetchVendingMachines().then(fetchAllItems());
});
