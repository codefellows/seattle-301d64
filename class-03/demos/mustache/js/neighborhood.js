// GOAL: render our neighborhoods to the page

'use strict';

// run our dataSet through a constructor to normalize the data
let allHoods = [];

function Hood(obj){
  this.name = obj.name;
  this.city = obj.city;
  this.population = obj.population;
  this.founded = obj.founded;
  this.body = obj.body;

  allHoods.push(this);
}

neighborhoodDataSet.forEach(objectInMyneighborhoodDataSet => {
  new Hood(objectInMyneighborhoodDataSet);
})

// put the data through the magic mustache library machine
Hood.prototype.createHtml = function(){
  //1. get template from the html
  let template = $('#neighborhood-template').html();

  //2. use Mustache to "create" new html by merging the template with the object instance that I have
  let html = Mustache.render(template, this);

  //3. return the "html" from this method
  return html;
}

allHoods.forEach(hood => {
  
  // append it to the DOM
  $('main').append(hood.createHtml());

})
