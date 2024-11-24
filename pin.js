$(document).ready(function () {
    /**
     * Apply the flashing effect for a card.
     * @param {jQuery} card - The card element.
     * @param {boolean} shouldFlash - Whether the card should flash.
     */
    function toggleFlash(card, shouldFlash) {
        // Clear any existing flashing effect first
        if (card.data('flash-interval')) {
            clearInterval(card.data('flash-interval'));
            card.removeData('flash-interval');
        }
        card.removeClass('flash-red');
        card.css({
            'background-color': '',
            'border-color': '',
        });

        const isNightMode = $('body').hasClass('night-mode'); // Detect Night Mode

        if (shouldFlash) {
            if (isNightMode) {
                // Subtle flashing for Night Mode
                let isFlashing = true;

                // Save the interval ID on the card element for reference
                card.data('flash-interval', setInterval(() => {
                    card.css({
                        'background-color': isFlashing ? 'rgba(255, 99, 99, 0.1)' : '#2a2a3c',
                        'border-color': isFlashing ? 'rgba(255, 99, 99, 0.3)' : '#3c3c4e',
                    });
                    isFlashing = !isFlashing; // Toggle state
                }, 500)); // Flash every 500ms
            } else {
                // Stronger flashing for Day Mode (CSS class)
                card.addClass('flash-red');
            }
        }
    }

    /**
     * Helper function to format numbers with comma separators.
     * @param {number|string} num - The number to format.
     * @returns {string} - The formatted number with commas.
     */
    function formatNumber(num) {
        if (isNaN(num)) return num; // If it's not a number, return as is
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Create a pinned card with fields specific to Buying or Selling.
     */
    function createPinnedCard(itemId, lowestSellPrice, highestBuyPrice, type) {
        // Access the item name from itemIdMap using the global window object
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
                           data-lowest-sell-price="${lowestSellPrice}" />
                </div>
                <p><strong>Lowest Sell Price:</strong> ${formattedLowestSellPrice}</p>
              `
                : `
                <p><strong>${itemName}</strong></p>
                <div class="custom-input">
                    <label for="customInput-${itemId}">Your Price:</label>
                    <input type="text" id="customInput-${itemId}" 
                           class="price-input" 
                           data-highest-buy-price="${highestBuyPrice}" />
                </div>
                <p><strong>Highest Buy Price:</strong> ${formattedHighestBuyPrice}</p>
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

    // Handle pin button click to create a new Buying pin
    $('#pin-button').on('click', function () {
        const searchValue = $('#search').val().toLowerCase();
        if (!searchValue) return alert('Please enter an item name to pin.');

        let itemFound = false;
        $('#item-table tbody tr').each(function () {
            const itemName = $(this).find('td:first').text().toLowerCase();

            if (itemName.includes(searchValue)) {
                const itemId = Object.keys(window.itemIdMap).find(key => window.itemIdMap[key].toLowerCase() === itemName);
                const lowestSellPrice = $(this).find('td:nth-child(2)').text();
                const highestBuyPrice = $(this).find('td:nth-child(3)').text();

                const isDuplicate = $(`[data-item-id="${itemId}"]`).length > 0;

                if (!isDuplicate) {
                    const cardHtml = createPinnedCard(
                        itemId,
                        lowestSellPrice,
                        highestBuyPrice,
                        'buying' // Default type is Buying
                    );
                    $('#buying-cards').append(cardHtml);
                    itemFound = true;
                    return false;
                }
            }
        });

        if (!itemFound) alert('Item not found.');
    });

    // Handle input changes to apply validation
    $(document).on('input', '.price-input', function () {
        let inputValue = $(this).val().replace(/,/g, '');
        if (isNaN(inputValue) || inputValue === '') {
            inputValue = ''; // Reset to empty if NaN or empty
        } else {
            inputValue = parseFloat(inputValue).toLocaleString();
        }
        $(this).val(inputValue);

        const card = $(this).closest('.card');
        const isBuying = card.data('type') === 'buying';
        const isSelling = card.data('type') === 'selling';

        if (isBuying) {
            const lowestSellPrice = parseFloat(card.data('lowest-sell-price'));
            toggleFlash(card, inputValue && parseFloat(inputValue.replace(/,/g, '')) < lowestSellPrice);
        }

        if (isSelling) {
            const highestBuyPrice = parseFloat(card.data('highest-buy-price'));
            toggleFlash(card, inputValue && parseFloat(inputValue.replace(/,/g, '')) > highestBuyPrice);
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

        // Remove the current card
        card.remove();

        // Create and append a new card with updated fields
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

        // Stop flashing before removing
        toggleFlash(card, false);
        card.remove();
    });
});
