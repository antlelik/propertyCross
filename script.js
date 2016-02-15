$(document).ready(function () {
    propertyCross.init();
});

var propertyCross = {
    init: function () {
        this.searchBtn          = $('.btn-send');
        this.locationBtn        = $('.btn-location');
        this.page               = 1;
        this.locationItemsList  = $('.location-items');
        this.locationPagination = $('.location-pagination');
        this.searchInputField   = $('#search');
        this.errorHolder        = $('.search-problem');
        this.errorMessageField  = this.errorHolder.find('.error-message');
        this.resultHolder       = $('.result-container');
        this.resultListField    = $('.recent-list');
        this.locationHolder     = $('.locations');
        this.locationListField  = $('.location-list');
        this.overlay            = $('.overlay');
        this.modalHolder        = $('.modal-holder');
        this.itemsPerPage       = 20;

        this.bindEvents();
    },
    bindEvents: function () {
        this.searchBtn.on('click', function (e) {
            e.preventDefault();
            this.setInitialStatesToSearch();
            this.sendSearchData(this.page, this.searchInputField.val());
        }.bind(this));

        this.locationBtn.on('click', function (e) {
            e.preventDefault();
            this.setInitialStatesToSearch();
            this.sendSearchData(this.page, this.locationBtn.data('name'));
        }.bind(this));
    },
    getLocation: function (page, place) {
        console.log(place)
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
    },
    sendSearchData: function (page, place) {
        var self = this;
        this.getLocation(page, place)
            .success(function (response) {
                var resp             = response.response,
                    statusCode       = parseInt(resp.status_code),
                    appRespCode      = parseInt(resp.application_response_code),
                    locationItemsArr = resp.locations || [],
                    locationItemsTotalResults,
                    responseText     = resp.application_response_text;

                if (appRespCode < 200) {
                    locationItemsTotalResults = resp.total_results || 0;
                    self.createLocationList(locationItemsArr, locationItemsTotalResults)
                }

                if (statusCode >= 200 && (appRespCode >= 200 && appRespCode <= 202)) {
                    self.createSelectLocationList(locationItemsArr, responseText);
                }

                if (statusCode >= 300 || appRespCode > 202) {
                    self.showErrorMessage(responseText);
                    self.errorHolder.removeClass('hidden');
                }

                console.log(response);
                self.cleanField(self.searchInputField);
                self.hideBlock(self.overlay);
            })
            .fail(function (error) {
                console.log(error);
            });
    },
    createLocationList: function (locationItemsArr, locationItemsTotalResults) {
        var place        = locationItemsArr[0]['long_title'],
            locationItem = $('<li><span data-name="' + place + '">' + place + ' (' + locationItemsTotalResults + ')</span></li>'),
            equalItems;

        equalItems = this.resultListField.find('li span').filter(function (ind, el) {
            return $(el).text().indexOf(locationItemsArr[0]['long_title']) > -1
        });
        if (!equalItems.length) {
            this.resultListField.prepend(locationItem);
            locationItem.on('click', 'span', function () {
                this.showLocationItems(place);
            }.bind(this));
        }
        this.showBlock(this.resultHolder);
    },
    showLocationItems: function (place, page) {
        var page = page || 1,
            self = this;

        this.getLocation(page, place)
            .success(function (response) {
                var response = response.response,
                    itemsArr = response.listings,
                    location;
                if (response.locations && response.locations.length) {
                    location = response.locations[0]["long_title"]
                }
                console.log(response);
                self.showBlock(self.overlay);
                self.removeLocations();
                self.removePagination();
                self.addPagination(response.page, response.total_pages, location);
                self.cleanBlock(self.modalHolder);
                self.addLocations(itemsArr, response.page);
                self.showBlock(self.locationItemsList);
                self.showBlock(self.locationPagination);
                self.hideBlock(self.overlay);
            })
            .fail(function (error) {
                console.log(error);
            });
    },
    addPagination: function (currentPage, totalPages, placeName) {
        var current = parseInt(currentPage),
            paging,
            pagingStructure;

        if (!totalPages) {
            return;
        }
        if (totalPages > 50) {
            totalPages = 50;
        }

        if (totalPages <= 5) {
            pagingStructure = this.generatePaginationItems(1, totalPages, current);
            paging = this.createPaginationStructure(pagingStructure);
        } else {
            if (current < 5) {
                pagingStructure = '' +
                    this.generatePaginationItems(1, 5, current) +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    '<li><a href="#">' + totalPages + '</a></li>';
            } else if (current > parseInt(totalPages) - 5) {
                pagingStructure = '<li><a href="#">1</a></li>' +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    this.generatePaginationItems(totalPages - 5, totalPages, current) +
                    '';
            } else {
                pagingStructure = '<li><a href="#">1</a></li>' +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    this.generatePaginationItems(current - 2, current - 1) +
                    '<li class="active"><a href="#">' + currentPage + '</a></li>' +
                    this.generatePaginationItems(current + 1, current + 2) +
                    '<li class="disabled"><a href="#">...</a></li>' +
                    '<li><a href="#">' + totalPages + '</a></li>';
            }
        }

        paging = this.createPaginationStructure(pagingStructure);
        this.addPaginationEvents(paging, placeName);
        this.locationPagination.html(paging);
    },
    createPaginationStructure: function (pagingStructure) {
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
    },
    addPaginationEvents: function (paging, placeName) {
        var self = this;
        paging.on('click', 'a', function (e) {
            e.preventDefault();
            var activeNum = parseInt(self.locationPagination.find('.active').find('a').text());
            var lastNum   = parseInt(self.locationPagination.find('li').eq(-2).find('a').text());
            var pageNum   = parseInt($(this).text());
            if ($(this).hasClass('prev') && activeNum !== 1) {
                self.showLocationItems(placeName, activeNum - 1)
            }

            if ($(this).hasClass('next') && activeNum !== lastNum) {
                self.showLocationItems(placeName, activeNum + 1)
            }

            if (pageNum > 0) {
                self.showLocationItems(placeName, pageNum);
            }

        });
    },
    generatePaginationItems: function (min, max, current) {
        var pagingRepeat = '';
        for (var i = min; i <= max; i++) {
            if (current && current === i) {
                pagingRepeat += '<li class="active"><a href="#">' + i + '</a></li>'
            } else {
                pagingRepeat += '<li><a href="#">' + i + '</a></li>'
            }
        }
        return pagingRepeat;
    },
    removePagination: function () {
        this.locationPagination.html('');
    },
    addLocations: function (itemsArr, currentPage) {
        var current = parseInt(currentPage),
            self    = this;
        if (!itemsArr || !itemsArr.length) {
            return;
        }
        itemsArr.forEach(function (el, ind) {
            var currentInd = (self.itemsPerPage * (current - 1)) + ind + 1,
                item;

            item = '<div class="location-item media">' +
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
                '<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-' + currentInd + '">Show Info</button>' +
                '</div>' +
                '</div>';

            self.locationItemsList.append(item);
            self.modalHolder.append(self.createModal(el, currentInd));
        });
    },
    removeLocations: function () {
        this.locationItemsList.html('');
    },
    createSelectLocationList: function (locationItemsArr, responseText) {
        var self = this;
        if (!locationItemsArr.length) {
            this.showErrorMessage(responseText);
            this.showBlock(this.errorHolder);
            return;
        }

        locationItemsArr.forEach(function (el) {
            this.locationListField.append('<li><span data-name="' + el['place_name'] + '">' + el['long_title'] + '</span></li>');
        }.bind(this));

        this.locationListField.off('click', 'span', function() {
            self.getLocationsFromSeveral(this);
        });
        this.locationListField.on('click', 'span', function() {
            self.getLocationsFromSeveral(this);
        });
        this.showBlock(this.locationHolder);
    },
    getLocationsFromSeveral: function (elem) {
        this.searchInputField.val($(elem).data('name'));
        this.hideBlock(this.locationHolder);
        this.cleanBlock(this.locationListField);
        this.searchBtn.click();
    },
    cleanField: function ($field) {
        $field.val('');
    },
    cleanBlock: function ($block) {
        $block.html('');
    },
    hideBlock: function hideBlock($block) {
        $block.addClass('hidden');
    },
    showBlock: function ($block) {
        $block.removeClass('hidden');
    },
    showErrorMessage: function (responseText) {
        var text = ' "Empty search field"';
        if (this.searchInputField.val().length) {
            text = ' "' + this.searchInputField.val() + '"'
        }
        this.errorMessageField.text(responseText + text);
    },
    setInitialStatesToSearch: function () {
        this.hideBlock(this.errorHolder);
        this.hideBlock(this.resultHolder);
        this.hideBlock(this.locationHolder);
        this.showBlock(this.overlay);
        this.cleanBlock(this.locationItemsList);
        this.cleanBlock(this.locationPagination);
    },
    createModal: function (itemsData, ind) {
        return '<div class="modal fade" id="modal-' + ind + '" tabindex="-1" role="dialog" aria-labelledby="modal-label-' + ind + '">' +
            '<div class="modal-dialog" role="document">' +
            '  <div class="modal-content">' +
            '    <div class="modal-header">' +
            '      <button type="button" class="close" data-dismiss="modal" data-backdrop="false" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '      <h3 class="modal-title" id="modal-label-' + ind + '">' + itemsData.title + '</h3>' +
            '      <h4><span class="price label label-primary">' + itemsData.price_formatted + '</span></h4>' +
            '      <span class="property-type glyphicon glyphicon-home" aria-hidden="true"> ' + itemsData.property_type + '</span>' +
            '    </div>' +
            '    <div class="modal-body">' +
            '      <img class="modal-visual" src="' + itemsData.img_url + '" />' +
            '      <ul class="properties">' +
            '      ' + this.createModalProperty(itemsData.bathroom_number, 'Bathroom') +
            '      ' + this.createModalProperty(itemsData.bedroom_number, 'Bedroom') +
            '      ' + this.createModalProperty(itemsData.car_spaces, 'Car space') +
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
    },
    createModalProperty: function (prop, propName) {
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
};