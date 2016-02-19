$(document).ready(function () {
    propertyCross();
});

var propertyCross = (function () {
    var countryList         = {
            'UK': {
                country: 'uk',
                url: 'http://api.nestoria.co.uk/api',
                myLocation: 'Wolverhampton'
            },
            'Deutschland': {
                country: 'de',
                url: 'http://api.nestoria.de/api',
                myLocation: 'Köln'
            },
            'Italia': {
                country: 'it',
                url: 'http://api.nestoria.it/api',
                myLocation: 'Genova'
            },
            'España': {
                country: 'es',
                url: 'http://api.nestoria.es/api',
                myLocation: 'Valencia'
            },
            'France': {
                country: 'fr',
                url: 'http://api.nestoria.fr/api',
                myLocation: 'Lion'
            },
            'India': {
                country: 'in',
                url: 'http://api.nestoria.in/api',
                myLocation: 'Surat'
            },
            'México': {
                country: 'mx',
                url: 'http://api.nestoria.mx/api',
                myLocation: 'León'
            },
            'Brasil': {
                country: 'br',
                url: 'http://api.nestoria.com.br/api',
                myLocation: 'Manaus'
            }
        },
        body                = $('body'),
        searchBtn           = $('.btn-send'),
        locationBtn         = $('.btn-location'),
        page                = 1,
        locationItemsList   = $('.location-items'),
        countrySelect       = $('#country-location'),
        locationPagination  = $('.location-pagination'),
        searchInputField    = $('#search'),
        errorHolder         = $('.search-problem'),
        errorMessageField   = errorHolder.find('.error-message'),
        resultHolder        = $('.result-container'),
        resultListField     = $('.recent-list'),
        locationHolder      = $('.locations'),
        locationListField   = $('.location-list'),
        overlay             = $('.overlay'),
        modalHolder         = $('.modal-holder'),
        favouritesModal     = $('#favourites'),
        showFavourites      = $('.btn-show-favourites'),
        favouritesBtn       = '.btn-favourites',
        removeFavouritesBtn = '.btn-remove',
        recentLocations     = [],
        itemsPerPage        = 20;

    function bindEvents() {
        searchBtn.on('click', function (e) {
            e.preventDefault();
            setInitialStatesToSearch();
            sendSearchData(page, {name: searchInputField.val()});
        });

        locationBtn.on('click', function (e) {
            e.preventDefault();
            setInitialStatesToSearch();
            getCurrentLocation()
        });

        body.on('click', favouritesBtn, function (e) {
            e.preventDefault();
            var holder = $(this).parents('.location-item'),
                id     = holder.data('id'),
                name   = holder.data('name'),
                img    = holder.data('img'),
                price  = holder.data('price'),
                list   = JSON.parse(localStorage.getItem('favourites')) || [];

            $(this).find('.glyphicon').toggleClass('glyphicon-heart glyphicon-heart-empty');

            if (!list.length || !hasLocalStorageId(list, id)) {
                addLocalStorageId(list, id, name, img, price);
            } else {
                removeLocalStorageId(list, id)
            }
        });

        showFavourites.on('click', function (e) {
            e.preventDefault();
            if (localStorage.favourites && JSON.parse(localStorage.getItem('favourites')).length) {
                createFavouritesList();
            } else {
                resetFavouritesList();
            }
        });

        body.on('click', removeFavouritesBtn, function () {
            var parentHolder = $(this).parents('.favourite-item'),
                id           = parentHolder.data('id'),
                list         = JSON.parse(localStorage.getItem('favourites')) || [];
            removeLocalStorageId(list, id);
            parentHolder.remove();
            $('[data-id=' + id + ']').find('.glyphicon').toggleClass('glyphicon-heart glyphicon-heart-empty');

            if (!JSON.parse(localStorage.getItem('favourites')).length) {
                favouritesModal.find('.close').click();
            }
        });
    }

    function getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
        function successFunction(position) {
            var currentLocation = {};
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            sendSearchData(page, {position: '?centre_point=' + currentLocation.lat + ',' + currentLocation.lng + ',' + '10km'});
        }

        function errorFunction() {
            errorMessageField.text('Couldn\'t get your current position');
        }
    }

    function getLocationByName(page, place) {
        var countryItem = countrySelect.val(),
            country     = countryList[countryItem].country,
            url         = countryList[countryItem].url;

        return $.ajax({
            method: "GET",
            url: url,
            data: {
                country: country,
                pretty: 1,
                action: 'search_listings',
                encoding: 'json',
                listing_type: 'buy',
                page: page,
                place_name: place
            }
        });
    }

    function getLocationByMap(page, position) {
        var countryItem = countrySelect.val(),
            url         = countryList[countryItem].url;

        url += position;
        return $.ajax({
            method: "GET",
            url: url,
            data: {
                pretty: 1,
                action: 'search_listings',
                encoding: 'json',
                listing_type: 'buy',
                page: page
            }
        });
    }

    function sendSearchData(page, data) {
        var getLocation;
        if (data.position) {
            getLocation = getLocationByMap(page, data.position);
        } else {
            getLocation = getLocationByName(page, data.name);
        }
        getLocation
            .success(function (response) {
                var resp             = response.response,
                    statusCode       = parseInt(resp.status_code),
                    appRespCode      = parseInt(resp.application_response_code),
                    locationItemsArr = resp.locations || [],
                    responseText     = resp.application_response_text,
                    totalResults,
                    place;

                if (appRespCode < 200) {
                    totalResults = resp.total_results || 0;
                    place        = locationItemsArr[0]['place_name'];
                    if (recentLocations.indexOf(place) === -1) {
                        recentLocations.push(place);
                    }
                    createLocationList(place, totalResults)
                }

                if (statusCode >= 200 && (appRespCode >= 200 && appRespCode <= 202)) {
                    createSelectLocationList(locationItemsArr, responseText);
                }

                if (statusCode === 200 && appRespCode === 210) {
                    showErrorMessage('Sorry, no available items in your location');
                    errorHolder.removeClass('hidden');
                }

                if (statusCode >= 300 || appRespCode > 210) {
                    showErrorMessage();
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

    function createLocationList(place, locationItemsTotalResults) {
        var locationList;

        locationList = recentLocations.reduceRight(function (list, el) {
            return list += '<li><span data-name="' + el + '">' + el + ' (' + locationItemsTotalResults + ')</span></li>'
        }, '');

        locationList = $(locationList);
        locationList.on('click', 'span', function () {
            showBlock(overlay);
            showLocationItems(place);
        });

        resultListField.html(locationList);
        showBlock(resultHolder);
    }

    function showLocationItems(place, page) {
        var page = page || 1;

        getLocationByName(page, place)
            .success(function (response) {
                var response = response.response,
                    location;
                if (response.locations && response.locations.length) {
                    location = response.locations[0]["place_name"]
                }
                console.log(response);
                removeLocations();
                pagination(parseInt(response.page), response.total_pages, location, showLocationItems);
                cleanBlock(modalHolder);
                addLocations(response, location);
                showBlock(locationItemsList);
                hideBlock(overlay);
            })
            .fail(function (error) {
                console.log(error);
            });
    }

    function addLocations(response, currentLocation) {
        var current  = parseInt(response.page),
            itemsArr = response.listings;

        if (!itemsArr || !itemsArr.length) {
            return;
        }
        itemsArr.forEach(function (el, ind) {
            var currentInd = (itemsPerPage * (current - 1)) + ind + 1,
                storageId  = currentLocation + '-' + currentInd,
                item;

            item = '<div class="location-item media" data-id="' + storageId + '" data-name="' + el.title + '" data-img="' + el.img_url + '" data-price="' + el.price_formatted + '">' +
                '<div class="media-left">' +
                '<span class="item-number label label-info">' + currentInd + '</span>' +
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
                '<button type="button" class="btn btn-sm btn-primary" data-toggle="modal" data-target="#modal-' + currentInd + '">Show Info</button>' +
                '<button type="button" class="btn btn-sm btn-primary btn-favourites"><i class="glyphicon ' + createFavouriteBtnClass(storageId) + '"></i></button>' +
                '</div>' +
                '</div>';

            locationItemsList.append(item);
            modalHolder.append(createModal(el, currentInd));
        });
    }

    function createFavouriteBtnClass(id) {
        var list      = JSON.parse(localStorage.getItem('favourites')),
            className = 'glyphicon-heart-empty';
        if (list) {
            list.forEach(function (el) {
                if (el.item.id === id) {
                    className = 'glyphicon-heart';
                }
            });
        }
        return className;
    }

    function removeLocations() {
        locationItemsList.html('');
    }

    function createSelectLocationList(locationItemsArr) {
        if (!locationItemsArr.length) {
            showErrorMessage();
            showBlock(errorHolder);
            return;
        }

        locationItemsArr.forEach(function (el) {
            locationListField.append('<li><span data-name="' + el['place_name'] + '">' + el['place_name'] + '</span></li>');
        });

        locationListField.off('click', 'span', function () {
            getLocationsFromSeveral(this);
        });
        locationListField.on('click', 'span', function () {
            getLocationsFromSeveral(this);
        });
        showBlock(locationHolder);
    }

    function getLocationsFromSeveral(elem) {
        searchInputField.val($(elem).data('name'));
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

    function showErrorMessage(messageText) {
        var text = 'Please type correct city or zip code';
        if (messageText) {
            text = messageText;
        }

        errorMessageField.text(text);
    }

    function setInitialStatesToSearch() {
        hideBlock(errorHolder);
        hideBlock(resultHolder);
        hideBlock(locationHolder);
        showBlock(overlay);
        cleanBlock(locationItemsList);
        cleanBlock(locationPagination);
    }

    function createModal(itemsData, ind) {
        return '<div class="modal fade" id="modal-' + ind + '" tabindex="-1" role="dialog" aria-labelledby="modal-label-' + ind + '">' +
            '<div class="modal-dialog" role="document">' +
            '  <div class="modal-content">' +
            '    <div class="modal-header">' +
            '      <button type="button" class="close" data-dismiss="modal" data-backdrop="false" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '      <h3 class="modal-title" id="modal-label-' + ind + '">' + itemsData.title + '</h3>' +
            '      <h4><span class="price label label-primary">' + itemsData.price_formatted + '</span></h4>' +
            '      ' + showPropertyType(itemsData.property_type) +
            '    </div>' +
            '    <div class="modal-body">' +
            '      <img class="modal-visual" src="' + itemsData.img_url + '" />' +
            '      <ul class="properties">' +
            '      ' + createModalProperty(itemsData.bathroom_number, 'Bathroom') +
            '      ' + createModalProperty(itemsData.bedroom_number, 'Bedroom') +
            '      ' + createModalProperty(itemsData.car_spaces, 'Car space') +
            '      </ul>' +
            '      <p><strong>Summary:</strong> ' + itemsData.summary + '</p>' +
            '      <p><strong>Updated:</strong> ' + itemsData.updated_in_days_formatted + '</p>' +
            '    </div>' +
            '    <div class="modal-footer">' +
            '      <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>' +
            '    </div>' +
            '  </div>' +
            '</div>' +
            '</div>';
    }

    function showPropertyType(property) {
        if (property) {
            return  '<span class="property-type glyphicon glyphicon-home" aria-hidden="true"> ' + property + '</span>'
        }
        return '';
    }

    function createModalProperty(prop, propName) {
        var propStr = '';
        if (prop) {
            var count = parseInt(prop);
            if (count > 1) {
                propName = propName + 's';
            }
            propStr = '<li>' +
                count + ' ' + propName +
                '</li>';
        }
        return propStr;
    }

    function hasLocalStorageId(list, id) {
        return list.some(function (el) {
            return el.item.id === id
        });
    }

    function removeLocalStorageId(list, id) {
        list = list.filter(function (el) {
            return el.item.id !== id
        });
        localStorage.setItem('favourites', JSON.stringify(list));
    }

    function addLocalStorageId(list, id, name, img, price) {
        var currentItemObj = {item: {id: id, name: name, img: img, price: price}};
        list.push(currentItemObj);
        localStorage.setItem('favourites', JSON.stringify(list));
    }

    function createFavouritesList() {
        var modalBody = favouritesModal.find('.modal-body'),
            storageArr,
            template  = '';

        if (!localStorage.favourites) {
            return;
        }
        storageArr = JSON.parse(localStorage.favourites);

        storageArr.forEach(function (el) {
            template += '<div class="media favourite-item" data-id="' + el.item.id + '">' +
                '<div class="media-left">' +
                '<img src="' + el.item.img + '" />' +
                '</div>' +
                '<div class="media-body">' +
                '<h4 class="media-heading">' + el.item.name + '</h4>' +
                '<span class="label label-info">' + el.item.price + '</span>' +
                '<span class="glyphicon glyphicon-remove btn-remove text-danger"></span>' +
                '</div>' +
                '</div>';
        });
        modalBody.html('<div class="favourites-list">' + template + '</div>');
    }

    function resetFavouritesList() {
        var modalBody = favouritesModal.find('.modal-body');
        modalBody.html('<p>You have not added any properties to your favourites</p>');
    }

    bindEvents();
});

function pagination(currentPage, totalPages, placeName, showLocationItems) {
    var locationPagination = $('.location-pagination');

    locationPagination.html('');
    locationPagination.removeClass('hidden');

    function addPagination(currentPage, totalPages, placeName) {
        var paging,
            pagingStructure;

        if (!totalPages) {
            return;
        }
        if (totalPages > 50) {
            totalPages = 50;
        }

        if (totalPages <= 7) {
            pagingStructure = generatePaginationItems(1, totalPages, currentPage);
            paging          = createPaginationStructure(pagingStructure);
        } else {
            if (currentPage < 5) {
                pagingStructure = '' +
                    generatePaginationItems(1, 5, currentPage) +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    '<li><a href="#">' + totalPages + '</a></li>';
            } else if (currentPage > parseInt(totalPages) - 5) {
                pagingStructure = '<li><a href="#">1</a></li>' +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    generatePaginationItems(totalPages - 5, totalPages, currentPage) +
                    '';
            } else {
                pagingStructure = '<li><a href="#">1</a></li>' +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    generatePaginationItems(currentPage - 2, currentPage - 1) +
                    '<li class="active"><a href="#">' + currentPage + '</a></li>' +
                    generatePaginationItems(currentPage + 1, currentPage + 2) +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    '<li><a href="#">' + totalPages + '</a></li>';
            }
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
            var pageNum = parseInt($(this).text());

            if (($(this).hasClass('prev') && currentPage === 1) || ($(this).hasClass('next') && currentPage === totalPages)) {
                return;
            }
            $('.overlay').removeClass('hidden');

            if ($(this).hasClass('prev') && currentPage !== 1) {
                showLocationItems(placeName, currentPage - 1)
            }

            if ($(this).hasClass('next') && currentPage !== totalPages) {
                showLocationItems(placeName, currentPage + 1)
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

    addPagination(currentPage, totalPages, placeName);
}