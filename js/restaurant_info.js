let restaurant;
var map;

window.addEventListener('DOMContentLoaded', (event) => {
	if (navigator.serviceWorker) {
	navigator.serviceWorker.register('serviceworker.js')
		.then(reg => console.log(`sw registered, scope: ${reg.scope}`))
.catch(err => console.error(`ERROR_REGISTERING_SW: ${err}`));
}
if (!navigator.onLine) {
	DBHelper.fetchRestaurantById(DBHelper.getParameterByName('id'))
		.then(restaurant => initMap(restaurant));
}
})

window.addEventListener('load', (event) => {
	connectionStatusHandler = (event) => {
		const statusBox = document.getElementById('offline-status-box');
		if (!navigator.onLine) {
			statusBox.style.display = 'block';
			document.getElementById('offline-status').innerHTML = 'Offline';
		} else {
			statusBox.style.display = 'none';
			document.getElementById('offline-status').innerHTML = 'Online';
			DBHelper.postCachedReviews();
		}
	}

	window.addEventListener('online', connectionStatusHandler);
	window.addEventListener('offline', connectionStatusHandler);
});

/**
 * Initialize Google map, called from HTML.
 */
initMap = (restaurant) => {
	self.restaurant = restaurant;
	if (navigator.onLine) {
		self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 16,
			center: self.restaurant.latlng,
			scrollwheel: false
		});
		DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
	}
	fillBreadcrumb();
	fillRestaurantHTML();
}

window.renderPage = () => {
	if (self.restaurant) {
		return;
	}
	DBHelper.fetchRestaurantById(DBHelper.getParameterByName('id'))
		.then(restaurant => initMap(restaurant));
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'An image from the restaurant ' + restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id).then(reviews => setReviews(reviews));
}

setReviews = (reviews) => {
	self.restaurant.reviews = reviews;
	fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Add new review
 */
addReviewHTML = (review, reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const ul = document.getElementById('reviews-list');
	ul.prepend(createReviewHTML(review));
	container.append(ul);
}

/**
 * review form submit handler
 */
reviewFormHandler = (restaurant = self.restaurant) => {
	const review = {
		name: document.getElementById('username').value,
		rating: parseInt(document.getElementById('rating').value),
		comments: document.getElementById('comment').value,
		createdAt: +new Date(),
		updatedAt: +new Date(),
		restaurant_id: restaurant.id
	};
	addReviewHTML(review);
	if (navigator.onLine) {
		DBHelper.postReview(review)
			.then(resp => {
			if (!resp) {
			document.getElementById('form-legend').innerHTML = 'An Unexpected Error Occured, Please Try Again Later.';
		} else {
			document.getElementById('form-legend').innerHTML = 'Your Review Has Been Saved, Thank You For Sharing Your Thoughts.';
			document.getElementById('reviews-form').reset();
		}
	})
	.catch(err => console.error(`ERROR_SAVING_REVIEW: ${err}`));
	} else {
		DBHelper.cacheObject(review, DBHelper.REVIEWS_OFFLINE_IDB_NAME, DBHelper.REVIEWS_OFFLINE_STORE_NAME);
	}
}