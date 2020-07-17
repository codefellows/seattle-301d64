'use strict';

// Libraries

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');

// Libary Setups

const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

// Middleware

app.use(cors());

// Global Variables

const PORT = process.env.PORT || 3001;

app.get('/location', handleLocation);

function handleLocation (request, response){
  let city = request.query.city;
  let url = `https://us1.locationiq.com/v1/search.php`; // TODO: where do I find this online/in documentation?
  let queryParams = {
    key: process.env.GEO_DATA_API_KEY,
    q: city,
    format: 'json',
    limit: 1
  };

  // when a user searches for a city, we want to first check to see if that city is in the database

  let sql = 'SELECT * FROM location WHERE search_query=$1;';
  let safeValues = [city];

  client.query(sql, safeValues)
    .then(resultsFromPostgress => {
      // console.log(resultsFromPostgress);
      if(resultsFromPostgress.rowCount){
        console.log('found location object in the database!');
        // this means that the city is in the database and I need to return the location object from here
        let locationObject = resultsFromPostgress.rows[0];
        response.status(200).send(locationObject);

      } else {
        console.log('did not find location object in the database -- going to locationIQ to get it');
        // this means that the city is NOT in the database and I need to go to LocationIQ to get the data
        superagent.get(url)
          .query(queryParams)
          .then(resultsFromSuperAgent => {
          // console.log('these are SuperAgent results: ', resultsFromSuperAgent.body);
          let geoData = resultsFromSuperAgent.body;
          const obj = new Location(city, geoData);
          // and save it to the database

          let sql = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';

          let safeValues = [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude];

          client.query(sql, safeValues);

          response.send(obj);
        }).catch((error) => {
          console.log('ERROR: ', error);
          response.status(500).send('another one bites the dust');
        });
      }
    })
};

app.get('/weather', (request, response) => {
  // console.log(request.query.latitude);
  let url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  let queryParams = {
    key: process.env.WEATHER_API_KEY,
    lat: request.query.latitude,
    lon: request.query.longitude,
    days: 8
  };
  superagent.get(url)
    .query(queryParams)
    .then(resultsFromSuperAgent => {
      // console.log('these are the SA results for weather', resultsFromSuperAgent.body);
      let weatherData = resultsFromSuperAgent.body;
      let weatherDayArray = weatherData.data.map(day => {
        return new WeatherReport(day);
      });
      response.status(200).send(weatherDayArray);
    }).catch((error) => {
      console.log('Weather Error: ', error);
      response.status(500).send('mightn\'nt be rainy \'round these parts.');
    });
});

app.get('/trails', (request, response) => {
  let url = 'https://www.hikingproject.com/data/get-trails';
  let queryParams = {
    key: process.env.TRAIL_API_KEY,
    lat: request.query.latitude,
    lon: request.query.longitude,
    maxResults: 10
  };
  superagent.get(url)
    .query(queryParams)
    .then(resultsFromSuperAgent => {
      // console.log('this is the return from Trails Project: ', resultsFromSuperAgent.body.trails);
      let trailsFromTrails = resultsFromSuperAgent.body.trails;
      let trailsArray = trailsFromTrails.map(trail => {
        return new AreaTrail(trail);
      });
      response.status(200).send(trailsArray);
    }).catch((error) =>{
      console.log('Bad Trails be here', error);
      response.status(500).send('watch out for the mud!');
    });
});

app.get('/potato', (request, response) => {
  console.log('the data flows');
  response.status(200).send('Flow, data! Flow.');
});

app.get('*', (request, response) => {
  response.status(404).send(`<h1>You have arrived!</h1>`);
});

// === FUNCTIONS ===

function Location (location, geoData) {
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function WeatherReport (weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = new Date(weatherData.datetime).toDateString();
}

function AreaTrail (trailsData) {
  this.name = trailsData.name;
  this.location = trailsData.location;
  this.length = trailsData.length;
  this.stars = trailsData.stars;
  this.star_votes = trailsData.starVotes;
  this.summary = trailsData.summary;
  this.trail_url = trailsData.url;
  this.conditions = trailsData.conditionStatus;
  this.condition_date = trailsData.conditionDate.slice(0,10); // TODO: get the date
  this.condition_time = trailsData.conditionDate.slice(11); // TODO: get the time
}

// Turn on the server=====================||
client.connect()
  .then(() => {
    app.listen(PORT, () =>{ //                ||
      console.log(`listening on ${PORT}.`); //||
    }); //                                    ||
  })
// =======================================||