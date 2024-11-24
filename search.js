$(document).ready(function () {
    const items = [];
    const suggestionBox = $('#suggestions');
    const searchInput = $('#search');

    // Handle the tablePopulated event to initialize the items array with item names
    window.addEventListener('tablePopulated', (event) => {
        const data = event.detail;

        // Ensure itemIdMap is available globally
        if (window.itemIdMap) {
            items.length = 0; // Clear existing items
            data.forEach(item => {
                const itemName = window.itemIdMap[String(item.itemId)] || `Unknown Item (${item.itemId})`; // Use formatted name
                items.push(itemName);
            });
            console.log('Items array initialized with names:', items); // Debugging
        } else {
            console.error('itemIdMap is not available');
        }
    });

    // Populate the suggestion box
    function populateSuggestions(searchValue) {
        suggestionBox.empty(); // Clear previous suggestions

        if (!searchValue.trim()) {
            suggestionBox.removeClass('visible');
            return;
        }

        const suggestions = items.filter(item =>
            item.toLowerCase().includes(searchValue.toLowerCase())
        );

        if (suggestions.length > 0) {
            suggestionBox.addClass('visible');
            suggestions.forEach(item => {
                suggestionBox.append(`<li class="suggestion-item">${item}</li>`);
            });
        } else {
            suggestionBox.removeClass('visible');
        }
    }

    // Hide suggestions
    function hideSuggestions() {
        suggestionBox.removeClass('visible');
        suggestionBox.empty();
    }

    // Event listeners for the search input
    searchInput.on('input', function () {
        const searchValue = $(this).val();
        populateSuggestions(searchValue);
    });

    // Hide suggestions on ESC
    searchInput.on('keydown', function (e) {
        if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    // Hide suggestions when clicking outside
    $(document).on('click', function (e) {
        if (
            !$(e.target).closest('#search').length &&
            !$(e.target).closest('#suggestions').length
        ) {
            hideSuggestions();
        }
    });

    // Handle click on a suggestion
    $(document).on('click', '.suggestion-item', function () {
        searchInput.val($(this).text()); // Fill the search box
        hideSuggestions(); // Hide suggestions
    });
});
