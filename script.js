import itemsData from './items.json';

const pinnedItems = document.getElementById('pinnedItems');
const marketData = document.getElementById('marketData');
const searchBox = document.getElementById('searchBox');
const suggestions = document.getElementById('suggestions');

async function fetchMarketData() {
    const response = await fetch('./market_data.json');
    const data = await response.json();
    populateTable(data);
}

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

function pinItem(itemName) {
    const item = itemsData.find(i => i.name === itemName);
    if (item) {
        const card = document.createElement('div');
        card.className = 'pinned-item-card';
        card.innerHTML = `
            <h4>${item.name}</h4>
            <p>Buy: ${item.highestBuyOffer}</p>
            <p>Sell: ${item.lowestSellOffer}</p>
        `;
        pinnedItems.appendChild(card);
    }
}

fetchData.addEventListener('click', fetchMarketData);
pinButton.addEventListener('click', () => pinItem(searchBox.value));
