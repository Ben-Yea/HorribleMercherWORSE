$(document).ready(function () {
    const items = [];
    const suggestionBox = $('#suggestions');
    const searchInput = $('#search');

    // Handle the tablePopulated event to initialize the items array with item names
    window.addEventListener('tablePopulated', (event) => {
        const updatedItems = event.detail.map(item => item.itemName);
        items.length = 0; // Clear the items array
        items.push(...updatedItems); // Add updated items
        console.log('Search suggestions updated:', items); // Debugging log
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
