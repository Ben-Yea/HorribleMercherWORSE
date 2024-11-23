const pinnedItems = document.getElementById('pinnedItems');
const marketData = document.getElementById('marketData');
const searchBox = document.getElementById('searchBox');
const suggestions = document.getElementById('suggestions');
const fetchDataButton = document.getElementById('fetchData');
const pinButton = document.getElementById('pinButton');

const API_URL = 'https://query.idleclans.com/api/PlayerMarket/items/prices/latest';
// Fetch market data from API with fallback to JSON
async function fetchMarketData() {
    try {
        console.log('Fetching market data from API...');
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        console.log('Market data fetched successfully from API:', data);
        populateTable(data);
        populateSuggestions(data);
    } catch (error) {
        console.warn('API fetch failed, using backup JSON:', error);
        fetchBackupData();
    }
}

// Fallback to local market_data.json
async function fetchBackupData() {
    try {
        console.log('Fetching market data from backup JSON...');
        const response = await fetch('./market_data.json');
        if (!response.ok) throw new Error('Backup JSON fetch failed');
        const data = await response.json();
        console.log('Market data fetched successfully from JSON:', data);
        populateTable(data);
        populateSuggestions(data);
    } catch (error) {
        console.error('Failed to fetch backup JSON data:', error);
    }
}

// Populate table with market data
function populateTable(data) {
    marketData.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.highestBuyOffer}</td>
            <td>${item.lowestSellOffer}</td>
            <td>${item.buyVolume}</td>
            <td>${item.sellVolume}</td>
            <td>${item.profit}</td>
        `;
        marketData.appendChild(row);
    });
}

// Populate suggestions for the search box
function populateSuggestions(data) {
    suggestions.innerHTML = '';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        suggestions.appendChild(option);
    });
}

// Pin an item by name (restoring original UI style)
function pinItem(itemName) {
    const pinnedCard = Array.from(document.querySelectorAll('.pinned-item-card'))
        .find(card => card.querySelector('h4')?.textContent === itemName);

    if (pinnedCard) {
        alert('Item already pinned!');
        return;
    }

    const itemRow = Array.from(marketData.querySelectorAll('tr'))
        .find(row => row.cells[0]?.textContent === itemName);

    if (!itemRow) {
        alert('Item not found in market data!');
        return;
    }

    const card = document.createElement('div');
    card.className = 'pinned-item-card';
    card.innerHTML = `
        <h4>${itemName}</h4>
        <p><strong>Buy:</strong> ${itemRow.cells[1].textContent}</p>
        <p><strong>Sell:</strong> ${itemRow.cells[2].textContent}</p>
        <p><strong>Profit:</strong> ${itemRow.cells[5].textContent}</p>
        <button class="remove-button" onclick="this.parentElement.remove()">Remove</button>
    `;
    pinnedItems.appendChild(card);
}

// Event Listeners
fetchDataButton.addEventListener('click', fetchMarketData);
pinButton.addEventListener('click', () => pinItem(searchBox.value));

// Debugging messages for startup
console.log('Merching Helper Script Loaded. Ready to fetch market data.');
