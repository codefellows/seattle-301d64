'use strict';

// libraries

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

// set up my libaries

const app = express();

// middleware

app.use(cors());

// set up pg

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

// global variables

const PORT = process.env.PORT || 3001;

app.get('/bananas', (request, response) => {
  response.send('we are alive');
});

app.get('/location', handleLocation);
app.get('/restaurants', handleRestaurants);

function handleRestaurants(request, response){
  console.log('this is what the front end is sending us:', request.query);
  // { id: '2',
  // search_query: 'happy',
  // formatted_query: 'Happy, Swisher County, Texas, USA',
  // latitude: '34.7409157',
  // longitude: '-101.8572040',
  // page: '1' }

  const numPerPage = 2;
  const page = request.query.page || 1;
  const start = ((page - 1) *  numPerPage + 1);

  const url = 'https://developers.zomato.com/api/v2.1/search';

  const queryParams = {
    lat: request.query.latitude,
    lon: request.query.longitude,
    start: start,
    count: numPerPage
  }

  superagent.get(url)
    .set('user-key', process.env.ZOMATO_API_KEY)
    .query(queryParams)
    .then(results => {
      const resultsArray = results.body.restaurants;
      console.log('this is what our restaurant results look like', resultsArray);
      const restaurantData = resultsArray.map(eatery => new Restaurant(eatery));
      response.status(200).send(restaurantData);
    })

}

function handleLocation(request, response){
  let city = request.query.city;
  
  let sql = 'SELECT * FROM location WHERE search_query=$1;';
  let safeValues = [city];

  client.query(sql, safeValues)
    .then(results => {
      if(results.rowCount){
        console.log('found the location in the DB');
        response.status(200).send(results.rows[0]);
      } else {
        console.log('going to loctionIQ to get the location');
        let url = `https://us1.locationiq.com/v1/search.php`; 
        let queryParams = {
          key: process.env.GEO_DATA_API_KEY,
          q: city,
          format: 'json',
          limit: 1
        };

        superagent.get(url)
          .query(queryParams)
          .then(resultsFromSuper => {
            let mapData = resultsFromSuper.body;
            const obj = new Location(city, mapData);
            
            let sql = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);'

            let safeValues = [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude];

            client.query(sql, safeValues);

            response.status(200).send(obj);
          }).catch((error) => {
            console.log('ERROR', error);
            response.status(500).send('sorry - you broke it');
          })
      }
    })
}


function Location (location, geoData) {
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Restaurant(entry) {
  this.restaurant = entry.restaurant.name;
  this.cuisines = entry.restaurant.cuisines;
  this.locality = entry.restaurant.location.locality;
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })