$(document).ready(function () {
    var searchBtn         = $('.btn-send'),
        page              = 1,
        searchInputField  = $('#search'),
        errorHolder       = $('.search-problem'),
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
                    locationItemsTotalResults;

                if (appRespCode < 200) {
                    locationItemsTotalResults = resp.total_results || 0;
                    showBlock(resultHolder);
                    resultListField.prepend('<p>' + locationItemsArr[0]['long_title'] + ' (' + locationItemsTotalResults + ')</p>');
                }

                if (statusCode >= 200 && (appRespCode >= 200 && appRespCode <= 202)) {
                    createLocationsList(locationItemsArr);
                }

                if (statusCode >= 300 || appRespCode > 202) {
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

    function createLocationsList(locationItemsArr) {
        if (!locationItemsArr.length) {
            showBlock(errorHolder);
            return;
        }

        locationItemsArr.forEach(function (el) {
            locationListField.append('<p><span data-name="' + el['place_name'] + '">' + el['long_title'] + '</span></p>');
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
});