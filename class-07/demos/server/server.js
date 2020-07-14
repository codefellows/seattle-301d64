'use strict';

// libraries
const express = require('express'); // server
const cors = require('cors'); // bad bouncer
const superagent = require('superagent'); // gets stuff from API
const { json } = require('express');
require('dotenv').config(); // allows access to .env

// tell express to use the libaries
const app = express();
app.use(cors());

// global variables
const PORT = process.env.PORT || 3001;

// routes
// app.get('/bananas', (request, response) => {
//   console.log('this is bananas');
//   response.status(200).send('this is bananas');
// })

app.get('/location', handleLocation);

function handleLocation(request, response){
  
    let city = request.query.city;
    // let geoData = require('./data/location.json');
    let url = `https://us1.locationiq.com/v1/search.php`;

    let queryParams = {
      key: process.env.GEO_DATA_API_KEY,
      q: city, // refers back to line 27
      format: 'json',
      limit: 1
    }

    // superagent is taking the query params and smashing them into the end of the url on line 29
    // the then get the results of the entire url
    superagent.get(url)
      .query(queryParams)
      .then(resultsFromSuperagent => {
        console.log('these are my results from superagent:', resultsFromSuperagent.body);
        let geoData = resultsFromSuperagent.body;
        const obj = new Location(city, geoData);
        response.send(obj);
      }).catch((error) => {
        console.log('ERROR', error);
        response.status(500).send('we messed up-sorry');
      });

    // replace search string with the city as a template literal
    // process.env.GEO_DATA_API_KEY says go into the .env and find that var

    // anytime you have a .then() make sure you have a .catch()
  
  
    // let obj = {
    //   search_query: city,
    //   formatted_query: geoData[0].display_name,
    //   latitude: geoData[0].lat,
    //   longitude: geoData[0].lon
    // }

};

function Location(location, geoData){
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}



// turn it on
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})