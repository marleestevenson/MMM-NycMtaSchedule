/* Magic Mirror
 * Module: MMM-NycMtaSchedule
 *
 * By Marlee Stevenson
 */

Module.register("MMM-NycMtaSchedule", {

	defaults: {
		mtaAPIKey: "",
		feed_id: "",
		line: "",
		station: "",
		animationSpeed: 1000,
		refreshInterval: 1000 * 30, //refresh every minute
		apiBase: "http://datamine.mta.info/mta_esi.php",
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required styles
	getStyles: function () {
		return ["font-awesome.css", "MMM-NycMtaSchedule.css"];
	},

	start: function () {
		Log.info("Starting module: " + this.name);

		this.loaded = false;
		this.sendSocketNotification("CONFIG", this.config);
	},

	getDom: function () {
		var wrapper = document.createElement("div");

		if (this.config.mtaAPIKey === "") {
			wrapper.innerHTML = "Please set the correct <i>API KEY</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.feed_id === "") {
			wrapper.innerHTML = "Please set the <i>feed_id</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.departures.length) {
			for (var i in this.departures) {
				var cD = this.departures[i];
				var divAlert = document.createElement("div");
				divAlert.className = "small thin light";
				divAlert.innerHTML = cD.lineLabel + " Train: " + cD.first_eta + " minutes, " + cD.second_eta + " minutes";
				wrapper.appendChild(divAlert);
			}
		}

		return wrapper;
	},

	getHeader: function () {
		return this.data.header;
	},

	processDepartures: function (data) {

		if (!data["entity"]) {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.departures = [];

		var realtimeData = data["entity"]
		var station = this.config.station
		var line = this.config.line

		var collected_times = []
		realtimeData.forEach(function (trains) {
			if (trains.trip_update) {
				var uniqueTrainSchedule = trains["trip_update"]
				var trainName = uniqueTrainSchedule["trip"]["route_id"]
				var uniqueArrivalTimes = uniqueTrainSchedule["stop_time_update"]
				uniqueArrivalTimes.forEach(function (scheduledArrivals) {
					if (scheduledArrivals.stop_id === station) {
						var timeData = scheduledArrivals["arrival"]
						var uniqueTime = timeData["time"]
						if (uniqueTime) {
							if (trainName === line) {
								collected_times.push(uniqueTime["low"])
							}
						}
					}
				})
			}
		})
		collected_times.sort()

		var nearestArrivalTime = collected_times[0]
		var secondNearestArrivalTime = collected_times[1]
		var time = parseInt(Date.now() / 1000)
		var timeUntilFirst = parseInt((nearestArrivalTime - time) / 60)
		var timeUntilSecond = parseInt((secondNearestArrivalTime - time) / 60)

		this.departures.push({
			first_eta: timeUntilFirst,
			second_eta: timeUntilSecond,
			lineLabel: line
		});

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "STARTED") {
			this.updateDom();
		} else if (notification === "DATA") {
			this.loaded = true;
			this.processDepartures(payload);
			this.updateDom();
		}
	},
});
