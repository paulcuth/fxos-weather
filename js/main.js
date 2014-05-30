var rumble = rumble || {};

(function () {


	var cities,
		views = [],
		days = [],
		mainElement = document.getElementsByTagName('main')[0],
		cityContainer = document.getElementById('cities'),
		scale,
			
		listTemplate,
		cityTemplate,// = document.getElementById('city-template').innerHTML,
		scrolling = false,
		touchdown = false,

		ONE_DAY = 86400000,
		DAY_NAME = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
	



	/***************************************
	* General app functions
	***************************************/


	/**
	 * Initialises the app.
	 */
	function init () {
		if ('localStorage' in window) {
			cities = JSON.parse(localStorage.getItem('cityData') || '[]');
			updateScale(localStorage.getItem('scale') || 'c');
		} else {
			cities = [];
			updateScale('c');
		}

		reset();
		createViews();
		initUi();
		refresh();
	}




	/**
	 * Initialises the event handlers on the UI.
	 */
	function initUi () {
		// Snap scrolling listeners
		mainElement.addEventListener('touchstart', handleTouchStart);
		mainElement.addEventListener('touchend', handleTouchEnd);
		mainElement.addEventListener('scroll', handleScroll);
		window.addEventListener('orientationchange', handleScrollEnd);
		window.addEventListener('resize', handleScrollEnd);
		document.getElementById('prefs').addEventListener('click', handlePrefsClick);


		// Setting form listeners
		var form = document.querySelector('#add form');
		form.addEventListener('submit', handleSearchSubmit, true);
		updateSettings();
	}




	/**
	 * Reset the app.
	 */
	function reset () {
		days.length = 0;
		views.length = 0;

		setListTemplate();
	}




	/**
	 * Update scale.
	 */
	function updateScale (s) {
		scale = s;
		document.querySelector('main').className = 'deg-' + scale;
		
		cityTemplate = document.getElementById('city-template').innerHTML.replace('_CF', '_' + s);
		setListTemplate();

		if ('localStorage' in window) {
			localStorage.setItem('scale', s);
		}
	}




	/**
	 * Saves the current city data to local storage.
	 */
	function saveCities () {
		if ('localStorage' in window) {
			localStorage.setItem('cityData', JSON.stringify(cities));
		}
	}




	/**
	 * Starts a refresh on all the cities' data.
	 */
	function refresh () {
		for (var i in cities) loadWeather(cities[i], views[i]);
	}	
	

	
	
	/***************************************
	* City view functions
	***************************************/


	/**
	 * Create a template for each city view that contains the next few days.
	 */
	function setListTemplate () {
		var now = Date.now(),
			today = now - now % ONE_DAY,
			template = document.getElementById('list-template').innerHTML,
			day,
			i;

		listTemplate = '';

		for (i = 0; i < 5; i++) {
			day = days[i] = today + ONE_DAY * i;
			listTemplate += template.replace('{{name}}', DAY_NAME[(day % (ONE_DAY * 7)) / ONE_DAY]).replace(/day_X/g, 'day_' + day).replace(/_CF/g, '_' + scale);
		}
	}
	
	
	

	/**
	 * Creates views for all the current cities.
	 */
	function createViews () {
		for (var i in cities) views[i] = createView(cities[i]);
	}




	/**
	 * Create the HTML for a city view.
	 * @param {Object} city City data object.
	 * @returns {HTMLSectionElement} HTML element for the view.
	 */
	function createView (city) {
		var view = document.createElement('section');

		view.className = 'city';
		cityContainer.appendChild(view);

		updateView(view, city);
		return view;
	}




	/**
	 * Updates views for all the current cities.
	 */
	function updateViews () {
		for (var i in cities) updateView(views[i], cities[i]);
	}




	/**
	 * Updates the temperatures and conditions in a city view.
	 * @param {HTMLElement} view The view element.
	 * @param {Object} city City data.
	 */
	function updateView (view, city) {
		var template = cityTemplate.replace('{{days}}', listTemplate);
		view.innerHTML = Mustache.render(template, city);
	}




	/***************************************
	* Weather data functions
	***************************************/


	/**
	 * Refreshes the weather data for a particular city.
	 * @param {Object} city City object.
	 * @param {HTMLElement} view View element.
	 */
	function loadWeather (city, view) {
		rumble.comms.getWeatherData(city.woeid, city.id, function (data, id) { handleWeather (data, city, view, id); }, handleWeatherError);
	}




	/**
	 * Handles an error while getting city data.
	 * @param {Object} e Event data.
	 */
	function handleWeatherError (e) {
		console.warn('Failed to load weather: ' + e.message);
	}




	/**
	 * Handles the reciept of weather data for a city.
	 * @param {Object} data Weather data.
	 * @param {Object} city City data.
	 * @param {HTMLElement} view View element.
	 * @param {string} id City ID.
	 */
	function handleWeather (data, city, view, id) {
		if (!city.id && id) city.id = id;

		city.current = data.current;
		for (var i in data.forecast) city['day_' + days[i]] = data.forecast[i];
	
		updateView(view, city);
		saveCities();
	}




	/***************************************
	* General settings functions
	***************************************/


	/**
	 * Updates the existing city list on the settings page.
	 */
	function updateSettings () {
		var ul = document.querySelector('#manage ul'),
			city, i;

		ul.textContent = '';

		if (!cities.length) {
			document.getElementById('manage').className = 'empty';
			return;
		} else {
			document.getElementById('manage').className = '';
		}

		for (i = 0; city = cities[i]; i++) {
			remove = document.createElement('button');
			remove.textContent = 'x';
			remove.index = i;
			remove.addEventListener('click', removeCity, true);
			remove.addEventListener('touchstart', removeCity, true);

			moveUp = document.createElement('button');
			moveUp.innerHTML = '&#10132;';
			moveUp.index = i;
			moveUp.delta = -1;
			moveUp.addEventListener('click', moveCity, true);
			moveUp.addEventListener('touchstart', moveCity, true);

			moveDown = document.createElement('button');
			moveDown.innerHTML = '&#10132;';
			moveDown.index = i;
			moveDown.delta = 1;
			moveDown.addEventListener('click', moveCity, true);
			moveDown.addEventListener('touchstart', moveCity, true);


			span = document.createElement('span');
			span.textContent = city.name;
			
			
			li = document.createElement('li');
			li.appendChild(remove);
			li.appendChild(moveUp);
			li.appendChild(moveDown);
			li.appendChild(span);

			li.addEventListener('click', highlightItem, true);
			li.addEventListener('touchstart', highlightItem, true);


			ul.appendChild(li);
		}
	}




	/**
	 * Handles a list item click by highlighting the item.
	 */
	function highlightItem () {
		var items = this.parentNode.querySelectorAll('.selected'),
			item, i;

		for (i = 0; item = items[i]; i++) item.className = '';
		this.className = 'selected';
	}




	/***************************************
	* Add city functions
	***************************************/


	/**
	 * Handles the city search UI event.
	 * @param {Object} e Event data.
	 */
	function handleSearchSubmit (e) {
		e.preventDefault();
		document.querySelector('#add').className = 'loading';
		document.querySelector('#settings ul').innerHTML = '';

		var text = document.querySelector('#settings input[name=cityName]');
		findCity(text.value);
	}




	/**
	 * Starts a search for a city.
	 * @param {String} name City name.
	 */
	function findCity (name) {
		rumble.comms.getCityData(name, handleNewCityData, handleNewCityError);
	}

	
	
	
	/**
	 * Handles an error while searching for a city.
	 * @param {Object} e Event data.
	 */
	function handleNewCityError (e) {
		document.querySelector('#add').className = '';
		window.alert('Failed to find city: ' + e.message);
	}

	
	
	
	/**
	 * Handles new city search results.
	 * @param {Object} data Matching cities.
	 */
	function handleNewCityData (data) {
		var ul = document.querySelector('#add ul'),
			record, li, i, button;

		document.querySelector('#add').className = '';

		if (!(data instanceof Array)) data = [data];

		for (i in data) {
			record = data[i];

			if (record.city) {
				button = document.createElement('button');
				button.textContent = '+';

				button.obj = {
					woeid: record.woeid,
					name: record.city
				};
				
				button.addEventListener('click', addCity, true);
				button.addEventListener('touchstart', addCity, true);


				span = document.createElement('span');
				span.textContent = record.city + (record.country? ', ' + record.country : '');
				
				
				li = document.createElement('li');
				li.appendChild(button);
				li.appendChild(span);

				li.addEventListener('click', highlightItem, true);
				li.addEventListener('touchstart', highlightItem, true);


				ul.appendChild(li);
			}
		}
	}




	/**
	 * Handles the UI request to add a new city.
	 * @param {Object} e Event data.
	 */
	function addCity (e) {
		var city = e.target.obj,
			view = createView(city);
		
		loadWeather(city, view);
		view.scrollIntoView();

		cities.push(city);
		views.push(view);
		saveCities();

		document.querySelector('#add ul').innerHTML = '';
		document.getElementById('city-name').value = '';

		updateSettings();
	}




	/***************************************
	* Manage city functions
	***************************************/


	/**
	 * Handles the UI event to remove a city.
	 * @param {Object} e Event data.
	 */
	function removeCity (e) {
		cities.splice(e.target.index, 1);
		saveCities();

		var view = views.splice(e.target.index, 1);
		cityContainer.removeChild(view[0]);

		updateSettings();
		e.preventDefault();
	}




	/**
	 * Handles the UI event to move a city.
	 * @param {Object} e Event data.
	 */
	function moveCity (e) {
		var index = e.target.index,
			delta = e.target.delta,
			city = cities.splice(index, 1)[0],
			view = views.splice(index, 1)[0],
			insertBefore = views[index + delta];

		cities.splice(index + delta, 0, city);
		views.splice(index + delta, 0, view);
		view.parentNode.insertBefore(view, insertBefore);

		saveCities();
		updateSettings();

		document.querySelector('#manage ul').childNodes[index + delta].className = 'selected';
		e.preventDefault();
	}




	/***************************************
	* Manage preference functions
	***************************************/


	function handlePrefsClick (e) {
		var s = e.target.getAttribute('data-scale');
		if (s) updateScale(s);
		updateViews();
	}



	/***************************************
	* Snap scrolling functions
	***************************************/


	/**
	 * Handles touch start event to snap scrolling.
	 */
	function handleTouchStart () {
		touchdown = true;
	}




	/**
	 * Handles touch end event to snap scrolling.
	 */
	function handleTouchEnd () {
		touchdown = false;
		if (!scrolling) handleScrollEnd();
	}




	/**
	 * Handles scroll event to snap scrolling.
	 */
	function handleScroll (e) {
		scrolling = true;

		window.clearTimeout(handleScroll.timeout);
		
		handleScroll.timeout = window.setTimeout(function () {
			scrolling = false;
			if (!touchdown) handleScrollEnd();
		}, 300);
	}




	/**
	 * Handles the end of a momentum scroll to snap scrolling.
	 */
	function handleScrollEnd () {
		var width = document.body.clientWidth,
			scrollLeft = mainElement.scrollLeft,
			offset = scrollLeft % width,
			pos, i;


		if (offset < width / 2) {
			// Scroll back
			pos = [scrollLeft - offset * .25, scrollLeft - offset * .5, scrollLeft - offset * .75, scrollLeft - offset];
		} else {
			// Scroll forward
			offset = width - offset;
			pos = [scrollLeft + offset * .25, scrollLeft + offset * .5, scrollLeft + offset * .75, scrollLeft + offset];
		}

 		i = window.setInterval(function () {
 			mainElement.scrollLeft = pos.shift();
 			if (!pos.length) window.clearInterval(i);
 		}, 20);

		mainElement.scrollLeft = pos.shift();
	}




	init();
		
})();
