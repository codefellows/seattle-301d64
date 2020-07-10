// GOAL: get the information from the data.json file, fill the template and display to the page

// use ajax to get the information from data.json file
$.ajax('assets/data.json', {method: "GET", dataType: "JSON"})
  .then(data => {
    // console.log('what we got back from ajax', data);
    // run the information through a constructor function in order to normalize the data

    data.forEach(objectInDataArray => {
      console.log('this my dog from my forEach', objectInDataArray);
      new Dog(objectInDataArray).dogBuilder();
    })
  })

function Dog(obj){
  this.name = obj.name;
  this.image = obj.image_url;
  this.hobby = obj.hobbies;
}

Dog.prototype.dogBuilder = function(){
  // make a function prototype that is going to 
  // get template from the html and 
  // fill that template with each dog info
  // append it to the DOM

  // select all the html in the template
  const myTemplate = $('#dog-template').html();

  // create a new section to hold my new template
  const $newSection = $(`<section>${myTemplate}</section>`);

  // find the h2 tag and fill it with the name of the dog
  $newSection.find('h2').text(this.name);

  // find the p tag and fill it with the hobbies
  $newSection.find('p').text(this.hobby);

  // find the img and put in the imgage url
  $newSection.find('img').attr('src', this.image);

  // find the img and add in the alt
  $newSection.find('img').attr('alt', this.name);

  $('main').append($newSection);
}

