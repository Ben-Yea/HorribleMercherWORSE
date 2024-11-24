document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://query.idleclans.com/api/PlayerMarket/items/prices/latest';
    const itemJsonUrl = 'itemIdNames.json';
    let itemIdMap = {};

    // Helper function to format item names
    function formatItemName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Load item names from the JSON file or localStorage
    async function loadItemNames() {
        try {
            const cachedItemNames = localStorage.getItem('itemIdMap');
            if (cachedItemNames) {
                itemIdMap = JSON.parse(cachedItemNames);
                console.log('Item names loaded from cache');
            } else {
                const response = await fetch(itemJsonUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch item names: ${response.status}`);
                }
                const data = await response.json();
                data.forEach(item => {
                    itemIdMap[String(item.internal_id)] = formatItemName(item.name_id);
                });
                localStorage.setItem('itemIdMap', JSON.stringify(itemIdMap));
                console.log('Item names loaded from server:', itemIdMap);
            }

            // Export itemIdMap to the global window object
            window.itemIdMap = itemIdMap;

        } catch (error) {
            console.error('Error loading item names:', error);
        }
    }

    // Fetch data from the API and populate the table
    async function fetchAndPopulateTable() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            const data = await response.json();

            // Populate the table
            const tableBody = document.querySelector('#item-table tbody');
            tableBody.innerHTML = ''; // Clear existing rows

            data.forEach(item => {
                const itemIdStr = String(item.itemId);
                const itemName = itemIdMap[itemIdStr] || `Unknown Item (${itemIdStr})`;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${itemName}</td>
                    <td>${item.lowestSellPrice}</td>
                    <td>${item.highestBuyPrice}</td>
                    <td>${item.lowestPriceVolume}</td>
                    <td>${item.highestPriceVolume}</td>
                `;
                tableBody.appendChild(row);
            });

            console.log('Data fetched and table populated.');
            window.dispatchEvent(new CustomEvent('tablePopulated', { detail: data }));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Load item names and then fetch the market data
    async function initialize() {
        await loadItemNames(); // Load the item names first
        await fetchAndPopulateTable(); // Then populate the table with market data
    }

    // Run the initialization
    initialize();

    // Settings box toggle
    const settingsIcon = document.querySelector('.settings-icon');
    const settingsBox = document.querySelector('.settings-box');
    const nightModeToggle = document.querySelector('#night-mode-toggle');

    if (settingsIcon && settingsBox) {
        settingsIcon.addEventListener('click', () => {
            settingsBox.classList.toggle('visible'); // Toggle visibility
        });

        // Night Mode toggle
        nightModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('night-mode');
                localStorage.setItem('nightMode', 'enabled');
            } else {
                document.body.classList.remove('night-mode');
                localStorage.setItem('nightMode', 'disabled');
            }
        });

        // Apply night mode based on localStorage
        if (localStorage.getItem('nightMode') === 'enabled') {
            document.body.classList.add('night-mode');
            nightModeToggle.checked = true;
        }
    }

    // Sorting functionality
    const table = document.querySelector('.table');
    const headers = table.querySelectorAll('th');
    let currentSortColumnIndex = null;
    let ascendingOrder = true;

    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(index);
        });
    });

    function sortTable(columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        // Determine the sorting direction
        if (currentSortColumnIndex === columnIndex) {
            ascendingOrder = !ascendingOrder;
        } else {
            currentSortColumnIndex = columnIndex;
            ascendingOrder = true;
        }

        rows.sort((a, b) => {
            const cellA = a.children[columnIndex].textContent.trim();
            const cellB = b.children[columnIndex].textContent.trim();

            if (!isNaN(cellA) && !isNaN(cellB)) {
                return ascendingOrder ? cellA - cellB : cellB - cellA;
            } else {
                return ascendingOrder
                    ? cellA.localeCompare(cellB)
                    : cellB.localeCompare(cellA);
            }
        });

        // Append the sorted rows back to the tbody
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    // Search suggestions adjustments to fix the issue
    const searchInput = document.getElementById('search');
    const suggestionBox = document.getElementById('suggestions');

    searchInput.addEventListener('input', () => {
        const searchValue = searchInput.value.toLowerCase();
        suggestionBox.innerHTML = '';

        if (searchValue.trim()) {
            const suggestions = Object.values(itemIdMap).filter(name =>
                name.toLowerCase().includes(searchValue)
            );

            if (suggestions.length) {
                suggestions.forEach(name => {
                    const suggestionItem = document.createElement('li');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = name;
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = name;
                        suggestionBox.classList.remove('visible');
                    });
                    suggestionBox.appendChild(suggestionItem);
                });
                suggestionBox.classList.add('visible');
            } else {
                suggestionBox.classList.remove('visible');
            }
        } else {
            suggestionBox.classList.remove('visible');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.classList.remove('visible');
        }
    });
});
