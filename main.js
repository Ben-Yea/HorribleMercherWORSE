document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://query.idleclans.com/api/PlayerMarket/items/prices/latest';
    const itemJsonUrl = 'itemIdNames.json';
    let itemIdMap = {};
    let refreshInterval = 30; // Time in seconds for refresh

    // Helper function to format item names
    function formatItemName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Helper function to format numbers with comma separators
    function formatNumber(num) {
        if (isNaN(num)) return num; // If it's not a number, return as is
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

            const tableBody = document.querySelector('#item-table tbody');
            const existingRows = Array.from(tableBody.querySelectorAll('tr'));

            // Create a map of existing rows by itemId for efficient lookups
            const rowMap = new Map();
            existingRows.forEach(row => {
                const itemId = row.getAttribute('data-id');
                rowMap.set(itemId, row);
            });

            data.forEach(item => {
                const itemIdStr = String(item.itemId);
                const itemName = itemIdMap[itemIdStr] || `Unknown Item (${itemIdStr})`;

                // Check if the row for this item already exists
                if (rowMap.has(itemIdStr)) {
                    const row = rowMap.get(itemIdStr);
                    const cells = row.children;

                    // Update only the cells with new data
                    cells[1].setAttribute('data-value', item.lowestSellPrice);
                    cells[1].textContent = formatNumber(item.lowestSellPrice);

                    cells[2].setAttribute('data-value', item.highestBuyPrice);
                    cells[2].textContent = formatNumber(item.highestBuyPrice);

                    cells[3].setAttribute('data-value', item.lowestPriceVolume);
                    cells[3].textContent = formatNumber(item.lowestPriceVolume);

                    cells[4].setAttribute('data-value', item.highestPriceVolume);
                    cells[4].textContent = formatNumber(item.highestPriceVolume);
                } else {
                    // Add a new row if it doesn't exist
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', itemIdStr);
                    row.innerHTML = `
                        <td>${itemName}</td>
                        <td data-value="${item.lowestSellPrice}">${formatNumber(item.lowestSellPrice)}</td>
                        <td data-value="${item.highestBuyPrice}">${formatNumber(item.highestBuyPrice)}</td>
                        <td data-value="${item.lowestPriceVolume}">${formatNumber(item.lowestPriceVolume)}</td>
                        <td data-value="${item.highestPriceVolume}">${formatNumber(item.highestPriceVolume)}</td>
                    `;
                    tableBody.appendChild(row);
                }
            });

            console.log('Data fetched and table updated.');
            window.dispatchEvent(new CustomEvent('tableUpdated', { detail: data }));

            // Dispatch tablePopulated event with the latest table data
            window.dispatchEvent(new CustomEvent('tablePopulated', {
                detail: Array.from(document.querySelectorAll('#item-table tbody tr')).map(row => {
                    return {
                        itemId: row.getAttribute('data-id'),
                        itemName: row.querySelector('td:first-child').textContent,
                    };
                })
            }));

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }




    // Countdown timer function
    function startRefreshTimer() {
        const timerElement = document.querySelector('#refresh-timer');
        let remainingTime = refreshInterval;

        const updateTimer = () => {
            if (remainingTime <= 0) {
                remainingTime = refreshInterval;
            }
            timerElement.textContent = `Next refresh in: ${remainingTime}s`;
            remainingTime--;
        };

        updateTimer(); // Initial call to display the timer immediately
        setInterval(updateTimer, 1000); // Update timer every second
    }

    // Load item names and then fetch the market data
    async function initialize() {
        await loadItemNames(); // Load the item names first
        await fetchAndPopulateTable(); // Then populate the table with market data
        setInterval(fetchAndPopulateTable, refreshInterval * 1000); // Auto-refresh the data every 30 seconds
        startRefreshTimer(); // Start the refresh countdown timer
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
            const cellA = a.children[columnIndex].dataset.value || a.children[columnIndex].textContent.trim();
            const cellB = b.children[columnIndex].dataset.value || b.children[columnIndex].textContent.trim();

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
