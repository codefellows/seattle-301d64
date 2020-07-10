'use strict';

// async code
$('li').on('click', function(){
  $(this).fadeOut(750);
  console.log('this is our this:', this);
  // 'this' is the event.target
});

$('#form').submit((event) => {
  event.preventDefault();
	console.log('form submitted');
})

// non-ansync code needs to go in here to wait for the page to be ready before it can run
$().ready(
  console.log( "ready!" )
);