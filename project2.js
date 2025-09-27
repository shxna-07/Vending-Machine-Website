document.addEventListener("DOMContentLoaded", function () {
    const resultsSection = document.getElementById("space-section");
    const resultsContainer = document.querySelector(".space-container");
    const searchBar = document.getElementById("search-bar");
    const loadingSpinner = document.createElement("div");
    loadingSpinner.classList.add("loading-spinner");
    loadingSpinner.textContent = "Loading...";
    const vendingMachinesHeading = document.querySelector(".available-spaces h3");

    async function fetchVendingMachineData() {
        try {
            const response = await fetch("http://127.0.0.1:8080/api/overview/vending-machines");
            if (!response.ok) {
                throw new Error("Failed to fetch vending machine data.");
            }
            const data = await response.json();
            data.sort((a, b) => a.vending_machine_id - b.vending_machine_id);
            displayVendingMachines(data);
        } catch (error) {
            console.error("Error fetching vending machine data:", error);
        }
    }

    function displayVendingMachines(data) {
        resultsSection.classList.remove("hidden");
        resultsContainer.innerHTML = "";

        vendingMachinesHeading.style.display = "block";

        data.forEach((machine) => {
            const card = document.createElement("div");
            card.classList.add("vending-card");
            card.setAttribute("data-vending-machine-id", machine.vending_machine_id);

            card.innerHTML = `
                <h3>
                    <a href="http://127.0.0.1:8080/items.html?vending_machine_id=${machine.vending_machine_id}" target="_blank">
                    Vending Machine ${machine.vending_machine_id}
                    </a>
                </h3>
                <p><u>${machine.payment_name}</u></p>
                <p><b>${machine.school}</b></p>
                <p>Block:${machine.block}</p>
                <p>Floor:${machine.floor}</p>
            `;
            resultsContainer.appendChild(card);
        });
    }

    async function searchAPI(query) {
        if (!query) {
            alert("Please enter a search term.");
            return;
        }

        vendingMachinesHeading.style.display = "none";

        resultsContainer.innerHTML = "";
        resultsContainer.appendChild(loadingSpinner);

        try {
            const response = await fetch(`http://127.0.0.1:8080/api/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error("Failed to fetch results from API.");
            }

            const results = await response.json();
            displaySearchResults(results);
        } catch (error) {
            console.error("Error:", error);
            resultsContainer.innerHTML = `<p class="error">Error fetching results: ${error.message}</p>`;
        } finally {
            loadingSpinner.remove();
        }
    }

    function displaySearchResults(results) {
        resultsContainer.innerHTML = "";

        if (results.length === 0) {
            resultsContainer.innerHTML = "<p>No results found.</p>";
            return;
        }

        results.forEach((result) => {
            const resultDiv = document.createElement("div");
            resultDiv.classList.add("result-card");

            resultDiv.innerHTML = `
                <h3>Vendor: ${result.vendor_name}</h3>
                <p><strong>School:</strong> ${result.school}</p>
                <p><strong>Block:</strong> ${result.block}</p>
                <p><strong>Floor:</strong>${result.floor}</p>
                <p><strong>Status:</strong> ${result.status_name}</p>
                <p><strong>Item Name:</strong>${result.item_name}</p>
                <p><strong>Cost:</strong>$${parseFloat(result.item_cost).toFixed(2)}</p>
                <p><strong>Availability:</strong>${result.availability === 1 ? "Available" : "Unavailable"}</p>
                <p><strong>Quantity:</strong>${result.item_quantity}</p>
                <p><strong>Payment Method:</strong>${result.payment_name}</p>
            `;
            resultsContainer.appendChild(resultDiv);
        });
    }

    searchBar.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const query = searchBar.value.trim();
            searchAPI(query);
        }
    });

    fetchVendingMachineData();
});