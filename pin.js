
$(document).ready(function () {
    /**
     * Apply the flashing effect for a card.
     * @param {jQuery} card - The card element.
     * @param {boolean} shouldFlash - Whether the card should flash.
     */
    function toggleFlash(card, shouldFlash) {
        if (card.data('flash-interval')) {
            clearInterval(card.data('flash-interval'));
            card.removeData('flash-interval');
        }
        card.removeClass('flash-red');
        card.css({
            'background-color': '',
            'border-color': '',
        });

        if (shouldFlash) {
            card.addClass('flash-red');
        }
    }

    /**
     * Helper function to format numbers with comma separators.
     * @param {number|string} num - The number to format.
     * @returns {string} - The formatted number with commas.
     */
    function formatNumber(num) {
        if (isNaN(num)) return num;
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Create a pinned card with fields specific to Buying or Selling.
     */
    function createPinnedCard(itemId, lowestSellPrice, highestBuyPrice, type) {
        const itemName = window.itemIdMap[String(itemId)] || `Unknown Item (${itemId})`;
        const formattedLowestSellPrice = formatNumber(lowestSellPrice);
        const formattedHighestBuyPrice = formatNumber(highestBuyPrice);

        const fields =
            type === 'buying'
                ? `
                <p><strong>${itemName}</strong></p>
                <div class="custom-input">
                    <label for="customInput-${itemId}">Your Price:</label>
                    <input type="text" id="customInput-${itemId}" 
                           class="price-input" 
                           data-highest-buy-price="${highestBuyPrice}" />
                </div>
                <p><strong>Highest Buy Price:</strong> ${formattedHighestBuyPrice}</p>
              `
                : `
                <p><strong>${itemName}</strong></p>
                <div class="custom-input">
                    <label for="customInput-${itemId}">Your Price:</label>
                    <input type="text" id="customInput-${itemId}" 
                           class="price-input" 
                           data-lowest-sell-price="${lowestSellPrice}" />
                </div>
                <p><strong>Lowest Sell Price:</strong> ${formattedLowestSellPrice}</p>
              `;

        return `
            <div class="card" data-item-id="${itemId}" data-type="${type}" 
                 data-lowest-sell-price="${lowestSellPrice}" 
                 data-highest-buy-price="${highestBuyPrice}">
                ${fields}
                <div class="arrow-box">
                    <button class="arrow-btn move-left"><</button>
                    <button class="arrow-btn move-right">></button>
                </div>
                <button class="unpin-btn">Unpin</button>
            </div>`;
    }

    // Handle input changes to apply validation
    $(document).on('input', '.price-input', function () {
        let inputValue = $(this).val().replace(/,/g, '');
        const card = $(this).closest('.card');
        const isBuying = card.data('type') === 'buying';
        const isSelling = card.data('type') === 'selling';

        if (isNaN(inputValue) || inputValue === '') {
            toggleFlash(card, false);
            return;
        }

        inputValue = parseFloat(inputValue);

        if (isBuying) {
            const highestBuyPrice = parseFloat(card.data('highest-buy-price'));
            toggleFlash(card, inputValue < highestBuyPrice);
        }

        if (isSelling) {
            const lowestSellPrice = parseFloat(card.data('lowest-sell-price'));
            toggleFlash(card, inputValue > lowestSellPrice);
        }
    });

    // Handle pin button click to create a new Buying pin
    function handlePinAction() {
        const searchValue = $('#search').val().toLowerCase();
        if (!searchValue) return alert('Please enter an item name to pin.');

        let itemFound = false;
        $('#item-table tbody tr').each(function () {
            const itemName = $(this).find('td:first').text().toLowerCase();

            if (itemName === searchValue) {
                const itemId = Object.keys(window.itemIdMap).find(key => window.itemIdMap[key].toLowerCase() === itemName);
                const lowestSellPrice = parseFloat($(this).find('td:nth-child(2)').data('value')) || 0;
                const highestBuyPrice = parseFloat($(this).find('td:nth-child(3)').data('value')) || 0;

                const isDuplicate = $(`[data-item-id="${itemId}"]`).length > 0;

                if (!isDuplicate) {
                    const cardHtml = createPinnedCard(
                        itemId,
                        lowestSellPrice,
                        highestBuyPrice,
                        'buying'
                    );
                    $('#buying-cards').append(cardHtml);
                    itemFound = true;
                    return false;
                }
            }
        });

        if (!itemFound) alert('Item not found.');
    }

    $('#pin-button').on('click', handlePinAction);

    // Add event listener for ENTER key to pin item
    $('#search').on('keydown', function (e) {
        if (e.key === 'Enter') {
            handlePinAction();
        }
    });

    // Add event listener for TAB key to autocomplete the search
    $('#search').on('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const searchValue = $('#search').val().toLowerCase();
            const suggestions = Object.values(window.itemIdMap).filter(name =>
                name.toLowerCase().includes(searchValue)
            );
            if (suggestions.length > 0) {
                $('#search').val(suggestions[0]);
            }
        }
    });

    // Handle card movement between Buying and Selling
    $(document).on('click', '.move-left, .move-right', function () {
        const card = $(this).closest('.card');
        const targetSection = $(this).hasClass('move-left') ? '#buying-cards' : '#selling-cards';
        const isMovingToBuying = targetSection === '#buying-cards';

        const itemId = card.data('item-id');
        const lowestSellPrice = card.data('lowest-sell-price');
        const highestBuyPrice = card.data('highest-buy-price');

        card.remove();

        const updatedCardHtml = createPinnedCard(
            itemId,
            lowestSellPrice,
            highestBuyPrice,
            isMovingToBuying ? 'buying' : 'selling'
        );
        $(targetSection).append(updatedCardHtml);
    });

    // Handle unpin button
    $(document).on('click', '.unpin-btn', function () {
        const card = $(this).closest('.card');
        toggleFlash(card, false);
        card.remove();
    });

    // Listen for table updates and synchronize pinned cards
    window.addEventListener('tableUpdated', (event) => {
        const updatedData = event.detail;

        console.log('tableUpdated Event Triggered:', updatedData);

        $('.card').each(function () {
            const card = $(this);
            const itemId = card.data('item-id');
            const itemData = updatedData.find(item => String(item.itemId) === String(itemId));

            if (itemData) {
                const type = card.data('type');

                if (type === 'buying') {
                    // Update and re-evaluate for buying cards
                    const newHighestBuyPrice = itemData.highestBuyPrice;
                    card.find('.price-input').data('highest-buy-price', newHighestBuyPrice);
                    card.find('p:contains("Highest Buy Price")').html(`<strong>Highest Buy Price:</strong> ${formatNumber(newHighestBuyPrice)}`);

                    const userPrice = parseFloat(card.find('.price-input').val().replace(/,/g, ''));
                    if (!isNaN(userPrice)) {
                        // Trigger flashing if user price is lower
                        toggleFlash(card, userPrice < newHighestBuyPrice);
                    } else {
                        // Stop flashing if no valid input
                        toggleFlash(card, false);
                    }
                } else if (type === 'selling') {
                    // Update and re-evaluate for selling cards
                    const newLowestSellPrice = itemData.lowestSellPrice;
                    card.find('.price-input').data('lowest-sell-price', newLowestSellPrice);
                    card.find('p:contains("Lowest Sell Price")').html(`<strong>Lowest Sell Price:</strong> ${formatNumber(newLowestSellPrice)}`);

                    const userPrice = parseFloat(card.find('.price-input').val().replace(/,/g, ''));
                    if (!isNaN(userPrice)) {
                        // Trigger flashing if user price is higher
                        toggleFlash(card, userPrice > newLowestSellPrice);
                    } else {
                        // Stop flashing if no valid input
                        toggleFlash(card, false);
                    }
                }
            } else {
                console.warn(`Item with ID ${itemId} not found in updated data.`);
            }
        });
    });
});
