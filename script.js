$(document).ready(function () {
    var searchBtn          = $('.btn-send'),
        locationBtn        = $('.btn-location'),
        page               = 1,
        locationItemsList  = $('.location-items'),
        locationPagination = $('.location-pagination'),
        searchInputField   = $('#search'),
        errorHolder        = $('.search-problem'),
        errorMessageField  = errorHolder.find('.error-message'),
        resultHolder       = $('.result-container'),
        resultListField    = $('.recent-list'),
        locationHolder     = $('.locations'),
        locationListField  = $('.location-list'),
        overlay            = $('.overlay'),
        itemsPerPage       = 20;

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
        var place        = locationItemsArr[0]['long_title'],
            locationItem = $('<li><span data-name="' + place + '">' +
                place +
                ' (' + locationItemsTotalResults + ')</span></li>');
        showBlock(resultHolder);
        resultListField.prepend(locationItem);
        locationItem.on('click', 'span', function () {
            showLocationItems(place);
        });
    }

    function showLocationItems(place, page) {
        var page = page || 1;

        getLocation(page, place)
            .success(function (response) {
                var response = response.response,
                    itemsArr = response.listings,
                    location;
                if (response.locations && response.locations.length) {
                    location = response.locations[0]["long_title"]
                }
                console.log(response);
                showBlock(overlay);
                removeLocations();
                removePagination();
                addPagination(response.page, response.total_pages, location);
                addLocations(itemsArr, response.page);
                showBlock(locationItemsList);
                showBlock(locationPagination);
                hideBlock(overlay);
            })
            .fail(function (error) {
                console.log(error);
            });
    }

    function addPagination(currentPage, totalPages, placeName) {
        var current = parseInt(currentPage),
            paging,
            pagingStructure;

        if (!totalPages) {
            return;
        }
        if (totalPages > 50) {
            totalPages = 50;
        }

        if (current < 5) {
            pagingStructure = '' +
                generatePaginationItems(1, 5, current) +
                '<li class="disabled"><a href="#">...</a></li>' +
                '<li><a href="#">' + totalPages + '</a></li>';
        } else if (current > parseInt(totalPages) - 5) {
            pagingStructure = '<li><a href="#">1</a></li>' +
                '<li class="disabled"><a href="#">...</a></li>' +
                generatePaginationItems(totalPages - 5, totalPages, current) +
                '';
        } else {
            pagingStructure = '<li><a href="#">1</a></li>' +
                '<li class="disabled"><a href="#">...</a></li>' +
                generatePaginationItems(current - 2, current - 1) +
                '<li class="active"><a href="#">' + currentPage + '</a></li>' +
                generatePaginationItems(current + 1, current + 2) +
                '<li class="disabled"><a href="#">...</a></li>' +
                '<li><a href="#">' + totalPages + '</a></li>';
        }

        paging = createPaginationStructure(pagingStructure);
        addPaginationEvents(paging, placeName);
        locationPagination.html(paging);
    }

    function createPaginationStructure(pagingStructure) {
        return $('<ul class="pagination">' +
            '<li>' +
            '<a class="prev" href="#" aria-label="Previous">' +
            '<span aria-hidden="true">&laquo;</span>' +
            '</a>' +
            '</li>' +
            pagingStructure +
            '<li>' +
            '<a class="next" href="#" aria-label="Next">' +
            '<span aria-hidden="true">&raquo;</span>' +
            '</a>' +
            '</li>' +
            '</ul>')
    }

    function addPaginationEvents(paging, placeName) {
        paging.on('click', 'a', function (e) {
            e.preventDefault();
            var activeNum = parseInt(locationPagination.find('.active').find('a').text());
            var lastNum   = parseInt(locationPagination.find('li').eq(-2).find('a').text());
            var pageNum   = parseInt($(this).text());
            if ($(this).hasClass('prev') && activeNum !== 1) {
                showLocationItems(placeName, activeNum - 1)
            }

            if ($(this).hasClass('next') && activeNum !== lastNum) {
                showLocationItems(placeName, activeNum + 1)
            }

            if (pageNum > 0) {
                showLocationItems(placeName, pageNum);
            }

        });
    }

    function generatePaginationItems(min, max, current) {
        var pagingRepeat = '';
        for (var i = min; i <= max; i++) {
            if (current && current === i) {
                pagingRepeat += '<li class="active"><a href="#">' + i + '</a></li>'
            } else {
                pagingRepeat += '<li><a href="#">' + i + '</a></li>'
            }
        }
        return pagingRepeat;
    }

    function removePagination() {
        locationPagination.html('');
    }

    function addLocations(itemsArr, currentPage) {
        var current = parseInt(currentPage);
        if (!itemsArr || !itemsArr.length) {
            return;
        }
        itemsArr.forEach(function (el, ind) {
            var item = '<div class="location-item media">' +
                '<div class="media-left">' +
                '<span class="item-number label label-info">' + ((itemsPerPage * (current - 1)) + ind + 1)  + '</span>' +
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