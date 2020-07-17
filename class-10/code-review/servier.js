'use strict';

// Libraries

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();

// Libary Setups

const app = express();

// MIDDLEWARE

app.use(cors());

// setup pg

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

// Global Variables

const PORT = process.env.PORT || 3001;

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/movies', handleMovies);
app.get('/yelp', handleYelp);

app.get('/potato', (request, response) => {
  console.log('the data flows');
  response.status(200).send('Flow, data! Flow.');
});

// === FUNCTIONS ===

function handleMovies (request, response) {
  let url = 'https://api.themoviedb.org/3/search/movie/'

  let movieQueryParams = {
    api_key: process.env.MOVIE_API_KEY,
    query: request.query.search_query
  }

  superagent.get(url)
    .query(movieQueryParams)
    .then(movieResults => {
      let movieArray = movieResults.body.results.map(obj => {
        return new Movie(obj);
      })
      response.status(200).send(movieArray);
    }).catch((error) => {
      console.log('ERROR', error)
      response.status(500).send('ah the spool came off, we\'re getting it!');
    })
}

function Movie(film) {
  this.title = film.original_title;
  this.overview = film.overview;
  this.average_votes = film.vote_average;
  this.total_votes = film.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w500' + film.poster_path; // TODO: what is w500? It's needed in the url but returns a 404 in browser network.
  this.popularity = film.popularity;
  this.released_on = film.release_date;
}

function handleYelp (request, response) {

  const numPerPage = 5;
  const page = request.query.page || 1;
  const start = ((page - 1) * numPerPage + 1);

  let url = 'https://api.yelp.com/v3/businesses/search';

  let restaurantQueryParams = {
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    offset: start,
    limit: numPerPage
  }

  superagent.get(url)
    .set({'Authorization': 'Bearer ' + process.env.YELP_API_KEY})
    .query(restaurantQueryParams)
    .then(resultsFromSuperAgent => {
      let restaurantArray = resultsFromSuperAgent.body.businesses.map(obj => {
        return new Restaurant(obj);
      })
      console.log(request.query);
      response.status(200).send(restaurantArray);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('all the restaurants are closed!? There\'s an error or COVID19.');
    });
}

function handleTrails(request, response) {
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
}

function handleWeather(request, response) {
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
}

function handleLocation(request, response){
  let city = request.query.city;

  let sql = 'SELECT * FROM location WHERE search_query=$1;';
  let safeValues = [city];

  client.query(sql, safeValues)
    .then(results => {
      if(results.rowCount){
        // console.log('are we here?');
        response.status(200).send(results.rows[0]);
      } else {
        let url = 'https://us1.locationiq.com/v1/search.php';
        let queryParams = {
          key: process.env.GEO_DATA_API_KEY,
          q: city,
          format: 'json',
          limit: 1
        };
        superagent.get(url)
          .query(queryParams)
          .then(resultsFromSuperAgent => {
            // console.log('these are SuperAgent results: ', resultsFromSuperAgent.body);
            let geoData = resultsFromSuperAgent.body;
            const obj = new Location(city, geoData);

            let sql = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValues = [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude];

            client.query(sql, safeValues);

            response.status(200).send(obj);
          }).catch((error) => {
            console.log('ERROR: ', error);
            response.status(500).send('another one bites the dust');
          });
      }

    });
}

function Restaurant (obj) {
  this.name = obj.name ? obj.name : 'no name available';
  this.image_url = obj.image_url ? obj.image_url : 'http://placeholder.io/100';
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

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
  this.condition_date = trailsData.conditionDate.slice(0,10);
  this.condition_time = trailsData.conditionDate.slice(11);
}

app.get('*', (request, response) => {
  response.status(404).send(`<h1>YOU ARE LOST</h1>`);
});

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  }).catch(err => console.log('ERROR', err));

// // Turn on the server=====================||
// app.listen(PORT, () =>{ //                ||
//   console.log(`listening on ${PORT}.`); //||
// }); //                                    ||
// // =======================================||
