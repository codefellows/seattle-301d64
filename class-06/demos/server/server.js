'use strict';

// bring in the express library
// make sure to do an 'npm install -S express' in the terminal
const express = require('express');

// initalize the express library and save it in a variable to use
const app = express();

// library that lets me access my secrets
// make sure to do an 'npm install -S dotenv' in the terminal
require('dotenv').config();

// lets the clients get data from our server
// make sure to an 'npm install -S cors' in the terminal
const cors = require('cors');

// tell cors which clients to allow to hit our server
  // all of the clients can hit our server
app.use(cors());

// global variable to store the port that I get from the .env
const PORT = process.env.PORT || 3001;

// routes
// app.get('/bananas', (request, response) => {
//   response.send('this process is bananas!');
// });

app.get('/location', (request, response) => {
  // console.log('this is the city, right????!!!', request.query.city);
  try{
    let city = request.query.city;
    let geoData = require('./data/location.json');
  
    const obj = new Location(city, geoData);
  
    // let obj = {
    //   search_query: city,
    //   formatted_query: geoData[0].display_name,
    //   latitude: geoData[0].lat,
    //   longitude: geoData[0].lon
    // }
  
    response.send(obj);
  } catch(error){
    console.log('ERROR', error);
    response.status(500).send('we messed up-sorry');
  }

});

app.get('/restaurants', (request, response) => {

  let restaurants = require('./data/restaurants.json');

  let restaurantArray = [];

  restaurants['nearby_restaurants'].forEach(eatery => {
    restaurantArray.push(new Restaurant(eatery));
  })

  // console.log('this is my resaurant array', restaurantArray);
  response.status(200).send(restaurantArray);

  // <div>{{restaurant}}</div>
  // <div>{{locality}}</div>
  // <div>{{cuisines}}</div>


  // { search_query: 'tacoma',
  // formatted_query: 'Lynnwood, Snohomish County, Washington, USA',
  // latitude: '47.8278656',
  // longitude: '-122.3053932' }
});

app.get('*', (request, response) => {
  response.status(404).send('page not found');
});

function Restaurant(obj){
  this.restaurant = obj.restaurant.name;
  this.locality = obj.restaurant.location.locality;
  this.cuisines = obj.restaurant.cuisines;
}

function Location(location, geoData){
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

// turn on the server
// to turn on server:
  // npm start
  // node server.js
  // nodemon
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})

