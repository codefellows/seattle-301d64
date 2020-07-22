'use strict'

// Environment variables
require('dotenv').config();

// Application Dependencies
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override'); // lets us change the method in html

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// Static Routes
app.use(express.static('public'));

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
app.get('/', getTasks);
app.get('/tasks/:task_id', getOneTask);
app.get('/add', showForm);
app.post('/add', addTask);
app.put('/update/:id', updateTask);

// Failsafe Routes
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


// HELPER FUNCTIONS

function getTasks(request, response) {
  let SQL = 'SELECT * from tasks;';

  return client.query(SQL)
    .then(results => response.render('index', { results: results.rows }))
}

function getOneTask(request, response) {
  let SQL = 'SELECT * FROM tasks WHERE id=$1;';
  let values = [request.params.task_id];

  return client.query(SQL, values)
    .then(result => {
      // console.log('single', result.rows[0]);
      return response.render('pages/detail-view', { task: result.rows[0] });
    })

}

function showForm(request, response) {
  response.render('pages/add-view');
}

function addTask(request, response) {
  // console.log(request.body);
  let { title, description, category, contact, status } = request.body;

  let SQL = 'INSERT INTO tasks(title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, description, category, contact, status];

  return client.query(SQL, values)
    .then(response.redirect('/'))
}

function updateTask(request, response){
  console.log('this is my form data:', request.body);
  console.log('these are my params: ', request.params);
  let id = request.params.id;
  // { title: 'eat food',
  // description: 'eat all the fooz',
  // category: 'nutrition',
  // contact: 'amber',
  // status: 'done' }

  let { title, description, category, contact, status } = request.body;

  // put into the database
  let sql = 'UPDATE tasks SET title=$1, description=$2, category=$3, contact=$4, status=$5 WHERE id=$6;';
  let safeValues = [title, description, category, contact, status, id];

  client.query(sql, safeValues)
    .then(res => {
      // redirect to the home page
      response.status(200).redirect('/');
    })

}

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  });
