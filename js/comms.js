var rumble = rumble || {};

rumble.comms = {
	

	/**
	 * Make an HTTP GET request.
	 * @param {string} url to which to send request.
	 * @param {Function} success Success callback.
	 * @param {Function} error Error callback.
	 */
	get: function rumble_comms_get (url, success, error) {
		var xhr = new XMLHttpRequest();

		xhr.onload = function (e) {
			var data;

			if (this.status == 200) {

				if (success) {
					try {
						data = JSON.parse(this.response);
					} catch (e) {
						data = this.response;
					}
					success(data);
				}

			} else {
				if (error) error({ message: this.status });
			}
		};

		xhr.open('GET', url, true);
		xhr.send({});
	},
	
	
	
	
	/**
	 * Requests city data from Yahoo API.
	 * @param {string} city City search criteria.
	 * @param {Function} success Success callback.
	 * @param {Function} error Error callback.
	 */
	getCityData: function rumble_comms_getCityData (city, success, error) {
		var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20city%2C%20country%2C%20woeid%20from%20geo.placefinder%20where%20text%3D%22' + encodeURIComponent(city) + '%22&format=json';
		
		this.get(url, function (data) {
			var results = data.query.results;
			
			if (!results || !results.Result) {
				success({});
			} else {
				success(results.Result);
			}
		}, error);
	},
	
	
	
	
	/**
	 * Requests weather data from Yahoo API.
	 * @param {number} woeid City woeid.
	 * @param {string} [id] City id.
	 * @param {Function} success Success callback.
	 * @param {Function} error Error callback.
	 */
	getWeatherData: function rumble_comms_getWeatherData (woeid, id, success, error) {
		var me = this;

		function getWeatherById (id) {
			var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%3D%22http%3A%2F%2Fxml.weather.yahoo.com%2Fforecastrss%2F' + id + '_c.xml%22&format=json';

			me.get(url, function (data) {
				var results = data.query.results;

				if (!results || !results.item) {
					error({ message: 'No item found in response' });

				} else {
					var result = {
						current: results.item.condition,
						forecast: results.item.forecast
					};

					// Convert deg F
					result.current.temp_f = Math.round((result.current.temp_c = result.current.temp) * (9/5) + 32);

					for (i = 0; i < result.forecast.length; i++) {
						result.forecast[i].low_f = Math.round((result.forecast[i].low_c = result.forecast[i].low) * (9/5) + 32);
						result.forecast[i].high_f = Math.round((result.forecast[i].high_c = result.forecast[i].high) * (9/5) + 32);
					}

					success(result, id);
				}
			});
		}


		// Prefer to use id over woeid as it is more specific.
		if (id) {
			getWeatherById(id);
		
		} else {
			var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%3D%22http%3A%2F%2Fweather.yahooapis.com%2Fforecastrss%3Fw%3D' + woeid + '%22&format=json';

			this.get(url, function (data) {
				var results = data.query.results,
					link;

				if (!results || !results.item || !(link = results.item.link)) {
					error({ message: 'No link found in response' });

				} else {
					if (!(match = link.match(/forecast\/(.*?)_/))) {
					error({ message: 'No id found in response' });
					} else {
						getWeatherById(match[1]);
					}
				}
			}, error);
		}

	}
	
	
};