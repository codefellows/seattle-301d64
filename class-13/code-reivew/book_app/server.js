'use strict';

const express = require('express');
const app = express();

require('dotenv').config();
const pg = require('pg');
require('ejs');
const superagent = require('superagent');

// setting the view engine
app.set('view engine', 'ejs');

// global variables
const PORT = process.env.PORT || 3001;

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => {
  console.log('ERROR', error);
});

// middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// routes
app.get('/', renderHomePage);
app.get('/searches/new', renderSearchPage);
app.post('/searches', collectSearchResults);
app.get('/error', handleErrors);
app.get('/books/:id', getOneBook);
app.post('/addbook', addBookToFavorites);


// functions

function renderHomePage(request, response){
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(results => {
      let books = results.rows;
      response.render('pages/index.ejs', {saved: books});
    })
}

function renderSearchPage(request, response){
  response.render('pages/searches/new.ejs')
}

function getOneBook(request, response){
  let id = request.params.id;
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(results => {
      console.log('This is the book I selected:', results.rows);
      let selectedBook = results.rows[0];

      response.render('pages/books/show.ejs', {bookSelection:selectedBook});
    })
}

function collectSearchResults(request, response){
  console.log('this is the form data:', request.body);
  let query = request.body.search[0];
  let category = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(category === 'title'){url += `+intitle:${query}`}
  if(category === 'author'){url += `+inauthor:${category}`}


  superagent.get(url)
    .then(results => {
      let bookArray = results.body.items;

      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      });

      // console.log('this is our final book array:', finalBookArray);
      response.render('pages/searches/show.ejs', {searchResults: finalBookArray})
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry this is broken for a bit!');
      handleErrors(request, response);
    });

}

function handleErrors(request, response){
  response.render('pages/error.ejs')
}

function addBookToFavorites(request, response){
  console.log('this is my form data from my add to favs', request.body);
  // { title: 'The Restaurant at the End of the Universe',
  // author: 'Douglas Adams',
  // description: '“Douglas Adams is a terrific satirist.”—The Washington Post Book World Facing annihilation at the hands of the warlike Vogons? Time for a cup of tea! Join the cosmically displaced Arthur Dent and his uncommon comrades in arms in their desperate search for a place to eat, as they hurtle across space powered by pure improbability. Among Arthur’s motley shipmates are Ford Prefect, a longtime friend and expert contributor to The Hitchhiker’s Guide to the Galaxy; Zaphod Beeblebrox, the three-armed, two-headed ex-president of the galaxy; Tricia McMillan, a fellow Earth refugee who’s gone native (her name is Trillian now); and Marvin, the moody android. Their destination? The ultimate hot spot for an evening of apocalyptic entertainment and fine dining, where the food speaks for itself (literally). “What’s such fun is how amusing the galaxy looks through Adams’s sardonically silly eyes.”—Detroit Free Press',
  // image: 'https://books.google.com/books/content?id=DQ-wif7eBJoC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' }
  let { author, title, image, description } = request.body;

  // take the information from the form
  // add it to the database

  let sql = 'INSERT INTO books (author, title, image_url, description) VALUES ($1, $2, $3, $4) RETURNING id;';

  let safeValues = [author, title, image, description];

  client.query(sql, safeValues)
    .then(results => {
      // redirect to the detail page
      let id = results.rows[0].id;
      response.status(200).redirect(`/books/${id}`);
    })
}


function Book(obj){
  this.title = obj.title ? obj.title : 'no title available';
  this.author = obj.authors ? obj.authors[0] : 'no author available';
  this.description = obj.description ? obj.description : 'no description available';
  this.image = obj.imageLinks ? obj.imageLinks.thumbnail.replace(/^(http:\/\/)/g, 'https://') : 'https://i.imgur.com/J5LVHEL.jpg';
  this.isbn = obj.industryIdentifiers ? obj.industryIdentifiers.type + obj.industryIdentifiers.identifier : 'no ISBN available';
  this.bookshelf = [];
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });

