$(document).ready(function () {
    var searchBtn = $('.btn-send'),
        page = 1,
        searchIteration = 0,
        errorField = $('.search-problem'),
        resultField = $('.result-container');


    searchBtn.on('click', function (e) {

        e.preventDefault();
        errorField.addClass('hidden');
        resultField.addClass('hidden');
        sendData(page, $('#search').val());
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
                var resp = response.response;
                var statusCode = parseInt(resp.status_code);
                var respCode = parseInt(resp.application_response_code);
                var locationItems;

                if (respCode < 200) {
                    searchIteration++;
                    resultField.removeClass('hidden');
                    locationItems = resp.total_results;
                    resultField.append('<p>Search#' + searchIteration + ' (' + locationItems + ')</p>');
                }
                if (respCode === 201 || respCode === 202) {

                }
                if (statusCode >= 300 || respCode > 202) {
                    errorField.removeClass('hidden');
                }
                console.log(response)
            })
            .fail(function (error) {
                console.log(error);
            });
    }
});