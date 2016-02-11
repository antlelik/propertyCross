$(document).ready(function () {
    var searchBtn         = $('.btn-send'),
        locationBtn       = $('.btn-location'),
        page              = 1,
        locationItemsList = $('.location-items'),
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
        setInitialStatesToSearch();
        sendSearchData(page, searchInputField.val());
    });

    locationBtn.on('click', function (e) {
        e.preventDefault();
        setInitialStatesToSearch();
        sendSearchData(page, locationBtn.data('name'));
    });

    function getLocation(page, place) {
        return $.ajax({
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
        });
    }

    function sendSearchData(page, place) {
        getLocation(page, place)
            .success(function (response) {
                var resp             = response.response,
                    statusCode       = parseInt(resp.status_code),
                    appRespCode      = parseInt(resp.application_response_code),
                    locationItemsArr = resp.locations || [],
                    locationItemsTotalResults,
                    responseText     = resp.application_response_text;

                if (appRespCode < 200) {
                    locationItemsTotalResults = resp.total_results || 0;
                    createLocationList(locationItemsArr, locationItemsTotalResults)
                }

                if (statusCode >= 200 && (appRespCode >= 200 && appRespCode <= 202)) {
                    createSelectLocationList(locationItemsArr, responseText);
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

    function createLocationList(locationItemsArr, locationItemsTotalResults) {
        var locationItem = $('<li><span data-name="' + locationItemsArr[0]['long_title'] + '">' +
            locationItemsArr[0]['long_title'] +
            ' (' + locationItemsTotalResults + ')</span></li>');
        showBlock(resultHolder);
        resultListField.prepend(locationItem);
        locationItem.on('click', showLocationItems);

        function showLocationItems() {
            var place = $(this).find('span').data('name');

            getLocation(page, place)
                .success(function (response) {
                    var response = response.response;
                    var itemsArr = response.listings;
                    console.log(response);
                    removeLocations();
                    locationItemsList.append('<p>Pages ' + response.total_pages + '</p>');
                    addLocations(itemsArr);
                    showBlock(locationItemsList);
                })
                .fail(function (error) {
                    console.log(error);
                });
        }
    }

    function addLocations(itemsArr) {
        itemsArr.forEach(function (el, ind) {
            var item = '<div class="location-item media">' +
                '<div class="media-left">' +
                '<span class="item-number label label-info">' + (ind + 1) + '</span>' +
                '<img class="img-preview" src="' + el.img_url + '" />' +
                '</div>' +
                '<div class="media-body">' +
                '<h2>' +
                '<a href="' + el.lister_url + '" target="_blank">' + el.title + '</a> ' +
                '</h2>' +
                '<p><strong>' + el.price_formatted + '</strong></p>' +
                '<p>Summary: ' + el.summary + '</p>' +
                '<p>Keywords: ' + el.keywords + '</p>' +
                '<p>Updated: ' + el.updated_in_days_formatted + '</p>' +
                '</div>' +
                '</div>';

            locationItemsList.append(item);
        });
    }

    function removeLocations() {
        locationItemsList.html('');
    }

    function createSelectLocationList(locationItemsArr, responseText) {
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

    function setInitialStatesToSearch() {
        hideBlock(errorHolder);
        hideBlock(resultHolder);
        hideBlock(locationHolder);
        showBlock(overlay);
    }
});