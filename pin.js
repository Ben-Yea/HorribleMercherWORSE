$(document).ready(function () {
    $('#pin-button').on('click', function () {
        const searchValue = $('#search').val().toLowerCase();
        if (!searchValue) return alert('Please enter an item name to pin.');

        let itemFound = false;
        $('#item-table tbody tr').each(function () {
            const itemId = $(this).find('td:first').text();
            const lowestSellPrice = $(this).find('td:nth-child(2)').text();
            const highestBuyPrice = $(this).find('td:nth-child(3)').text();
            const lowestVolume = $(this).find('td:nth-child(4)').text();
            const highestVolume = $(this).find('td:nth-child(5)').text();

            if (itemId.includes(searchValue)) {
                const cardHtml = `<div class="card">
                    <p><strong>Item ID:</strong> ${itemId}</p>
                    <p><strong>Lowest Sell Price:</strong> ${lowestSellPrice}</p>
                    <p><strong>Highest Buy Price:</strong> ${highestBuyPrice}</p>
                    <p><strong>Lowest Volume:</strong> ${lowestVolume}</p>
                    <p><strong>Highest Volume:</strong> ${highestVolume}</p>
                    <button class="unpin-btn">Unpin</button>
                </div>`;

                $('#buying-cards').append(cardHtml);

                $('#buying-cards').find('.unpin-btn').last().on('click', function () {
                    $(this).parent().remove();
                });

                itemFound = true;
                return false; // Break loop once item is found
            }
        });

        if (!itemFound) alert('Item not found in the table.');
    });
});