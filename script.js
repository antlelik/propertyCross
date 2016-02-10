$(document).ready(function () {
    var searchBtn         = $('.btn-send'),
        page              = 1,
        searchInputField  = $('#search'),
        errorHolder       = $('.search-problem'),
        errorMessageField = errorHolder.find('.error-message'),
        resultHolder      = $('.result-container'),
        resultListField   = $('.recent-list'),
        locationHolder    = $('.locations'),
        locationListField = $('.location-list'),
        overlay           = $('.overlay');

    searchBtn.on('click', function (e) {
        e.preventDefault();

        hideBlock(errorHolder);
        hideBlock(resultHolder);
        hideBlock(locationHolder);
        showBlock(overlay);
        sendData(page, searchInputField.val());
    });

    function sendData(page, place) {
        $.ajax({
            method: "GET",
            url: "http://api.nestoria.co.uk/api",
            data: {
                country: 'uk',
                pretty: 1,
                action: 'search_listings',
                encoding: 'json',
                listing_type: 'buy',
                page: page,
                place_name: place
            }
        })
            .success(function (response) {
                var resp             = response.response,
                    statusCode       = parseInt(resp.status_code),
                    appRespCode      = parseInt(resp.application_response_code),
                    locationItemsArr = resp.locations || [],
                    locationItemsTotalResults,
                    responseText = resp.application_response_text;

                if (appRespCode < 200) {
                    locationItemsTotalResults = resp.total_results || 0;
                    showBlock(resultHolder);
                    resultListField.prepend('<li>' + locationItemsArr[0]['long_title'] + ' (' + locationItemsTotalResults + ')</li>');
                }

                if (statusCode >= 200 && (appRespCode >= 200 && appRespCode <= 202)) {
                    createLocationsList(locationItemsArr, responseText);
                }

                if (statusCode >= 300 || appRespCode > 202) {
                    showErrorMessage(responseText);
                    errorHolder.removeClass('hidden');
                }

                console.log(response);
                cleanField(searchInputField);
                hideBlock(overlay);
            })
            .fail(function (error) {
                console.log(error);
            });
    }

    function createLocationsList(locationItemsArr, responseText) {
        if (!locationItemsArr.length) {
            showErrorMessage(responseText);
            showBlock(errorHolder);
            return;
        }

        locationItemsArr.forEach(function (el) {
            locationListField.append('<li><span data-name="' + el['place_name'] + '">' + el['long_title'] + '</span></li>');
        });

        locationListField.off('click', 'span', getLocationsFromSeveral);
        locationListField.on('click', 'span', getLocationsFromSeveral);
        showBlock(locationHolder);
    }

    function getLocationsFromSeveral() {
        searchInputField.val($(this).data('name'));
        hideBlock(locationHolder);
        cleanBlock(locationListField);
        searchBtn.click();
    }

    function cleanField($field) {
        $field.val('');
    }

    function cleanBlock($block) {
        $block.html('');
    }

    function hideBlock($block) {
        $block.addClass('hidden');
    }

    function showBlock($block) {
        $block.removeClass('hidden');
    }

    function showErrorMessage(responseText) {
        var text = ' "Empty search field"';
        if (searchInputField.val().length) {
            text = ' "' + searchInputField.val() + '"'
        }
        errorMessageField.text(responseText + text);
    }
});