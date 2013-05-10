var rumble = rumble || {};


(function () {


	var cities,
		views = [],
		days = [],
		cityContainer = document.getElementById('cities'),
			
		listTemplate,
		cityTemplate = document.getElementById('city-template').innerHTML,

		ONE_DAY = 86400000,
		DAY_NAME = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
	



	function reset () {
		days.length = 0;
		views.length = 0;

		setListTemplate();
	}




	function setListTemplate () {
		var now = Date.now(),
			today = now - now % ONE_DAY,
			template = document.getElementById('list-template').innerHTML,
			day,
			i;

		listTemplate = '';

		for (i = 0; i < 5; i++) {
			day = days[i] = today + ONE_DAY * i;
			listTemplate += template.replace('{{name}}', DAY_NAME[(day % (ONE_DAY * 7)) / ONE_DAY]).replace(/day_X/g, 'day_' + day);
		}
	}
	
	
	
	function createView (city) {
		var view = document.createElement('section');

		view.className = 'city';
		cityContainer.appendChild(view);

		updateView(view, city);
		return view;
	}




	function updateView (view, city) {
		var template = cityTemplate.replace('{{days}}', listTemplate);
		view.innerHTML = Mustache.render(template, city);
	}




	function createViews () {
		for (var i in cities) views[i] = createView(cities[i]);
	}




	function initUi () {
		var form = document.querySelector('#add-city form');
		form.addEventListener('submit', handleSearchSubmit, true);
	}

	


	function handleSearchSubmit (e) {
		e.preventDefault();

		document.querySelector('#add-city ul').innerHTML = '';

		var text = document.querySelector('#add-city input[name=cityName]');
		findCity(text.value);
	}




	function findCity (name) {
		rumble.comms.getCityData(name, handleNewCityData, handleNewCityError);
	}

	
	
	
	function handleNewCityError (e) {
		window.alert('Failed to find city: ' + e.message);
	}

	
	
	
	function handleNewCityData (data) {
		var ul = document.querySelector('#add-city ul'),
			record, li, i;

		if (data instanceof Array) {

			for (i in data) {
				record = data[i];

				if (record.city) {
					li = document.createElement('li');
					li.innerHTML = record.city + (record.country? ', ' + record.country : '');
					
					li.obj = {
						woeid: record.woeid,
						name: record.city
					};
					
					li.addEventListener('click', addCity, true);
					li.addEventListener('touchstart', addCity, true);

					ul.appendChild(li);
				}
			}

		} else {
			addCity({
				target: {
					obj: {
						woeid: data.woeid,
						name: data.city
					}
				}
			})
		}
	}

	


	function addCity (e) {
		var city = e.target.obj,
			view = createView(city);
		
		loadWeather(city, view);
		view.scrollIntoView();

		cities.push(city);
		saveCities();

		document.querySelector('#add-city ul').innerHTML = '';
		document.getElementById('city-name').value = '';
	}




	function saveCities () {
		if ('localStorage' in window) {
			localStorage.setItem('cityData', JSON.stringify(cities));
		}
	}




	function refresh () {
		for (var i in cities) loadWeather(cities[i], views[i]);
	}	
	

	
	
	function loadWeather (city, view) {
		rumble.comms.getWeatherData(city.woeid, city.id, function (data, id) { handleWeather (data, city, view, id); }, handleWeatherError);
	}




	function handleWeatherError (e) {
		console.warn('Failed to load weather: ' + e.message);
	}




	function handleWeather (data, city, view, id) {
		if (!city.id && id) city.id = id;

		city.current = data.current;
		for (var i in data.forecast) city['day_' + days[i]] = data.forecast[i];
	
		updateView(view, city);
		saveCities();
	}




	function init () {
		if ('localStorage' in window) {
			cities = JSON.parse(localStorage.getItem('cityData') || '[]');
		} else {
			cities = [];
		}

		reset();
		createViews();
		initUi();
		refresh();
	}




	init();
	
	
})();
