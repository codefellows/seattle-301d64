'use strict';

const express = require('express');
const app = express();

require('dotenv').config();
require('ejs');
const superagent = require('superagent');

// set the view engine
app.set('view engine', 'ejs');

// global variables
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

app.get('/', renderHomePage);
app.get('/newsearch', renderSearchPage);
app.post('/searches', collectSearchResults);

// functions
function renderHomePage(request, response){
  response.render('pages/index');
}

function renderSearchPage(request, response){
  response.render('pages/searches/new.ejs');
}

function collectSearchResults(request, response){
  console.log('this is the form data:', request.body);
  // { search: [ 'pride and predjuice', 'title' ] }
  // { search: [ 'jeff noon', 'author' ] }
  let query = request.body.search[0];
  let category = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // if the category === title, add the title they searched for to the url. if the category === author, add the author's name to the url
  if(category === 'title'){url += `+intitle:${query}`};
  if(category === 'author'){url += `+inauthor:${query}`};
  // category === 'title' ? url += `+intitle:${query}` : url += `+inauthor:${query}`

  superagent.get(url)
    .then(results => {
      let bookArray = results.body.items;
      
      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      });

      response.render('pages/show.ejs', {searchResults: finalBookArray})
    })

}

function Book(obj){
  this.title = obj.title ? obj.title : 'no title available';
}

// turn on the server
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});