$(document).ready(function () {
    const items = [];
    $('#item-table tbody tr').each(function () {
        const itemName = $(this).find('td:first').text().trim();
        items.push(itemName);
    });

    /**
     * Generate and display suggestions based on search input.
     * Clears suggestions if input is empty.
     * @param {string} searchValue - The current value in the search bar.
     */
    function populateSuggestions(searchValue) {
        const suggestionBox = $('#suggestions');
        suggestionBox.empty(); // Clear previous suggestions

        if (!searchValue.trim()) {
            suggestionBox.removeClass('visible'); // Hide suggestions if input is empty
            return;
        }

        const suggestions = items.filter(item =>
            item.toLowerCase().includes(searchValue)
        );

        if (suggestions.length > 0) {
            suggestionBox.addClass('visible'); // Show suggestions
            suggestions.forEach(item => {
                suggestionBox.append(`<li class="suggestion-item">${item}</li>`);
            });
        } else {
            suggestionBox.removeClass('visible'); // Hide if no matches
        }

        // Click event for selecting a suggestion
        $('.suggestion-item').on('click', function () {
            $('#search').val($(this).text());
            suggestionBox.removeClass('visible'); // Hide after selection
        });
    }


    /**
     * Autofill the search input with the first suggestion when TAB is pressed.
     * @param {Event} e - The keydown event.
     */
    function handleTabAutofill(e) {
        if (e.key === 'Tab') {
            e.preventDefault(); // Prevent default tabbing behavior
            const firstSuggestion = $('#suggestions .suggestion-item:first').text();
            if (firstSuggestion) {
                $('#search').val(firstSuggestion);
                $('#suggestions').empty(); // Clear suggestions after autofill
            }
        }
    }

    // Bind input and keydown events
    $('#search').on('input', function () {
        const searchValue = $(this).val().toLowerCase();
        populateSuggestions(searchValue);
    });

    $('#search').on('keydown', handleTabAutofill);
});
