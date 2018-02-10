let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      const theMap = document.getElementById('map');
      
      self.map.addListener('tilesloaded', function () {
        theMap.querySelectorAll('img').forEach(value => value.alt = "Google Maps Image Tile");
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get restaurant reviews from page URL.
 */
const fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // review already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No review id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        fillReviewsHTML(null);
        return;
      }
      fillReviewsHTML();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favoriteIcon = document.createElement('span');
  favoriteIcon.className = 'restaurant-fav';

  const favoriteIconImg = document.createElement('img');
  if (restaurant.is_favorite === "true") {
    favoriteIconImg.alt = 'Favorited ' + restaurant.name;
    favoriteIconImg.setAttribute("data-src", './img/ico-fav.png');
    favoriteIconImg.className = 'restaurant-fav-icon fav';
  } else {
    favoriteIconImg.setAttribute("data-src", './img/ico-fav-o.png');
    favoriteIconImg.className = 'restaurant-fav-icon fav-not';
  }

  favoriteIconImg.addEventListener('click', () => {
    const src = favoriteIconImg.src;
    if (src.includes('img/ico-fav-o.png')) {
      DBHelper.addRestaurantToFavorites(restaurant.id, true, (err, res) => {
        favoriteIconImg.src = './img/ico-fav.png';
      });
    } else {
      DBHelper.addRestaurantToFavorites(restaurant.id, false, (err, res) => {
        favoriteIconImg.src = './img/ico-fav-o.png';
      });
    }
  })

  favoriteIcon.append(favoriteIconImg);
  name.prepend(favoriteIcon);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = restaurant.name + ' Restaurant Image';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // Lazyloads the images
  new LazyLoad();

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromURL();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 4;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.tabIndex = 4;
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');

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
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = moment(review.createdAt).format('ddd, MMM Do YYYY');
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
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const reviewRestaurant = (restaurant = self.restaurant) => {
  let id = restaurant.id;
  let name = document.getElementById("review-name").value;
  let rating = document.getElementById("review-rating").value;
  let message = document.getElementById("review-comment").value;

  if (name != "" && message != "") {
    let review = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: message,
    }

    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'post',
      body: JSON.stringify(review)
    })
    .then(res => res.json())
    .catch(error => {
      console.log('Something went wrong submitting your review');
    });

    window.location.reload();
  }

  return false;
}
