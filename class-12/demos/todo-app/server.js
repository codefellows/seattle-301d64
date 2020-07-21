'use strict';

const express = require('express');
const app = express();
require('ejs');

require('dotenv').config();
const pg = require('pg');

const PORT = process.env.PORT || 3001;

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => {
  console.log('ERROR', error);
});

// middleware
app.use(express.static('./public'));  // where our static front end is going to live
app.use(express.urlencoded({extended: true})); // decodes our response.body - body parser
app.set('view engine', 'ejs'); // use ejs to parse our template

// routes
app.get('/', getAllTasksFromDataBase);
app.get('/tasks/:task_id', getOneTask);
app.get('/add', showForm);
app.post('/add', addTask);

function getAllTasksFromDataBase(request, response){
  // go into the database
  // get all the tasks
  let sql = 'SELECT * FROM tasks;';
  client.query(sql)
    .then(results => {
      // display them on the index.ejs
      let tasks = results.rows;
      response.render('index.ejs', {banana: tasks});
    })
}

function getOneTask(request, response){
  // use the id that we got in the params to go the database and find the one task
  let id = request.params.task_id;

  let sql = 'SELECT * FROM tasks WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(results => {
      console.log('this should be the task that I selected:', results.rows);
      let selectedTask = results.rows[0];

      // display that one task on the detail page
      response.render('pages/detail-view', { task:selectedTask });
    })
}

function showForm(request, response){
  // display the add task form
  response.render('pages/add-view.ejs');
}

function addTask(request, response){
  // collect the information from the form
  let formData = request.body;
  // console.log('this is our form data:', formData);
  // { title: 'edit photos',
  // description: 'edit all the photos',
  // category: 'work',
  // contact: 'paul',
  // status: 'not done' }
  let {title, description, category, contact, status} = request.body;

  // save it to the database
  let sql = 'INSERT INTO tasks (title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
  let safeValues = [title, description, category, contact, status];

  client.query(sql, safeValues)
    .then(results => {
      // redirect to the detail page of that task
      let id = results.rows[0].id;
      console.log('this should be an id:', id);

      response.status(200).redirect(`/tasks/${id}`);

    }).catch(err => {
      response.status(500).render('pages/error-view', {error:err});
    })
}


client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })