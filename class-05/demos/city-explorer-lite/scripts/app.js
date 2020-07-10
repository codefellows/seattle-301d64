// GOAL: get the fake data and display it on the page
  // get the city information that the user is entering (right now - we are not doing anything with this information)
  // display the map
  // display the title
  // display restaurants

// make event handler
function fetchCityData(event){
  event.preventDefault();
  $('#map').empty();
  $('#title').empty();
  // $('#restaurants').html().empty();

  let searchQuery = $('#input-search').val().toLowerCase();

  const ajaxSettings = {
    method:'GET', 
    dataType: 'JSON', 
    data: { city: searchQuery }
  }

  $.ajax('/fake-data/location.json', ajaxSettings)
    .then(dataThatIgetBackFromMyLocationJson => {
      showTitle(dataThatIgetBackFromMyLocationJson);
      showMap(dataThatIgetBackFromMyLocationJson);
      showRestaurants(dataThatIgetBackFromMyLocationJson);
    })
}

function showTitle(locationObject){
  let template = $('#title-template').html();
  let html = Mustache.render(template, locationObject);
  $('#title').append(html);
}

function showMap(locationObject){
  let template = $('#image-template').html();
  let html = Mustache.render(template, locationObject);
  $('#map').append(html);
}

function showRestaurants(locationObject){
  const ajaxSettings = {
    method: "GET",
    dataType: "JSON",
    data: locationObject
  }

  $.ajax('/fake-data/restaurants.json', ajaxSettings)
    .then(resultsFromRestaurants => {
      let template = $('#restaurant-results-template').html();

      resultsFromRestaurants.forEach(restaurant => {
        let html = Mustache.render(template, restaurant);
        $('#restaurant-results').append(html);
      })

    })
}

// make an event listener
function setEventListener(){
  $('#search-form').on('submit', fetchCityData);
}

// this waits until the DOM is completely loaded to run code
$('document').ready(function(){
  setEventListener();
})

