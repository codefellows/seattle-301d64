'use strict';

// GOAL:
  // build a server to connect us to the database - check
  // put information into the database
  // select information from the basebase

const express = require('express');
const app = express();
const pg = require('pg');

require('dotenv').config();

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

const PORT = process.env.PORT || 3001;

// route
app.get('/add', addName);
app.get('/show', showAllNames);

function addName(request, response){
  console.log('first name:', request.query.firstName, 'last name:', request.query.lastName);
  let firstName = request.query.firstName;
  let lastName = request.query.lastName;

  let sql = 'INSERT INTO people (first_name, last_name) VALUES ($1, $2) RETURNING id;';
  let safeValues = [firstName, lastName];

  client.query(sql, safeValues)
    .then(resultsFromPostgres => {
      let id = resultsFromPostgres.rows;
      console.log('id', id)
    })
}

function showAllNames(request, response){
  // get everything from the table and send it to the front end
  let sql = 'SELECT * FROM people;';
  client.query(sql)
    .then(resultsFromPostgres => {
      let names = resultsFromPostgres.rows;
      response.send(names);
    }).catch(err => console.log(err));

}

// once you have connected us to the database, THEN you can turn on the server
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  }).catch(err => console.log('ERROR', err));