'use strict';

// libraries

const express = require('express');
require('ejs');

// set up library

const app = express();

// set up my view engine

app.set('view engine', 'ejs'); // tells express to look for a 'views' directory to find our templates

// Array of groceries for /list route
let list = ['apples', 'celery', 'butter', 'milk', 'eggs'];

// global variables

const PORT = 3000;

// routes
app.get('/', renderHomePage);
app.get('/list', renderShoppingList);

// functions
function renderHomePage(request, response){
  response.render('index');
}

function renderShoppingList(request, response){
  // send a shopping list to the ejs page to be rendered on the front end
  response.render('list.ejs', {myShoppingList: list});
}

// turn on server

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})