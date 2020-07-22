'use strict';

// libraries

const express = require('express');

// set up your library

const app = express();

// middleware

app.use(express.static('./public')); // express - serve files from the public directory
app.use(express.urlencoded({extended: true})); // body parser - customs agent - helping you declare what you are bringing in

// global variables

const PORT = 3000;

// routes

app.post('/contact', handleContact);

// functions

function handleContact(request, response){
  console.log('this is what we got back from the form', request.body);
  // { firstname: 'Megan',
  // lastname: 'Domeck',
  // message: 'Have a great day',
  // phone: '555-867-5309',
  // contact: 'phone' }
  let {firstname, lastname, message, phone, contact} = request.body;

  response.sendFile('./thanks.html', { root: './public' });
}

// turn on the server

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

