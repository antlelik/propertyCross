// Code goes here
(function() {
  var searchBtn = $('.btn-send');
  var page = 1;
  var place = 'leeds';

  searchBtn.on('click', function(e) {
    e.preventDefault();
    sendData(page, place)
  });



  function sendData(page, place) {
    $.ajax({
        method: "GET",
        url: "https://api.nestoria.co.uk/api",
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
      .done(function(response) {
        console.log(response)
      })
      .fail(function(error) {

      })
  }
}())
