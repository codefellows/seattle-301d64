'use strict';

// libraries
const express = require('express'); // server library
const cors = require('cors'); // really bad body guard who lets anyone talk to our server
require('dotenv').config(); // library lets us access our .env - chamber of secrets

// use the libraries
const app = express(); // lets us use the express libraries
app.use(cors()); // allows ALL clients into our server

// global variables
const PORT = process.env.PORT || 3001; // gets the PORT var from our env
const weatherArray = []; // we have a global weather Array

app.get('/location', (request, response) => { // backend event listener on the /location route
  try{                                        // if something goes wrong in the try, our code won't crash

    let city = request.query.city;            // the front end, sends us the city that the user typed 
                                              // in in the request object, in the query property
    let locData = require('./data/location.json'); // brings in the json file
    const obj = new Location(city, locData);  // make a new object instance

    response.status(200).send(obj);           // send the location object to the front end

  }catch(error)                               // if something goes wrong in the try, we end up here
  {
    console.log('ERROR:', error);             // this will end up in the terminal
    response.status(500).send('There has been an error.. RUN!!!'); // this will end up on the front end
  }
})

app.get('/weather', (request, response) => {

  let weatherData = require('./data/weather.json');

  weatherData.data.forEach(day => {
    new Weather(day);
  });
  response.send(weatherArray);
});

function Weather(weatherInfo){
  this.forecast = weatherInfo.weather.description;
  this.time = new Date(weatherInfo.valid_date).toDateString();
  weatherArray.push(this);
}

function Location(input, locData){
  this.search_query = input;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}

app.get('*', (request, response) => {

  response.status(404).send('Page not Found');
});

app.listen(PORT, () => {
  console.log(`listening 0n ${PORT}`);
});
