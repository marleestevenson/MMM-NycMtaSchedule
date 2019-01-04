/* Magic Mirror
 * Module: MMM-NycMtaSchedule
 *
 * By Marlee Stevenson
 */

Module.register("MMM-NycMtaSchedule", {

	defaults: {
		mtaAPIKey: "",
		trainStops: [
			{
				feed_id: "",
				line: "",
				station: ""
			}
		],
		animationSpeed: 1000,
		refreshInterval: 1000 * 10, //refresh every 10 sec
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

		if (this.config.trainStops === []) {
			wrapper.innerHTML = "Please set your desired <i>train stops</i> in the config for module: " + this.name + ".";
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
				divAlert.innerHTML = cD.lineLabel + " Train: " + cD.first_eta + " minutes, " + cD.second_eta + " minutes, " + cD.third_eta + " minutes";
				wrapper.appendChild(divAlert);
			}
		}

		return wrapper;
	},

	getHeader: function () {
		return this.data.header;
	},

	processDepartures: function (dataArray) {

		this.departures = [];
		var trainStops = this.config.trainStops;

		for (var i = 0; i < trainStops.length; i++) {
			var data = dataArray[i]["feed"];
			var line = dataArray[i]["line"];
			var station = dataArray[i]["station"];
			if (!data["entity"]) {
				// Did not receive usable new data.
				return;
			}
			var realtimeData = data["entity"];

			var collectedTimes = [];
			realtimeData.forEach(function (trains) {
				if (trains["trip_update"]) {
					var uniqueTrainSchedule = trains["trip_update"];
					var trainName = uniqueTrainSchedule["trip"]["route_id"];
					var uniqueArrivalTimes = uniqueTrainSchedule["stop_time_update"];
					uniqueArrivalTimes.forEach(function (scheduledArrivals) {
						if (scheduledArrivals["stop_id"] === station) {
							var timeData = scheduledArrivals["arrival"];
							var uniqueTime = timeData["time"];
							if (uniqueTime) {
								if (trainName === line) {
									collectedTimes.push(uniqueTime["low"])
								}
							}
						}
					})
				}
			});
			collectedTimes.sort();

			var nearestArrivalTime = collectedTimes[0];
			var secondNearestArrivalTime = collectedTimes[1];
			var thirdNearestArrivalTime = collectedTimes[2];
			var time = parseInt(Date.now() / 1000);
			var timeUntilFirst = parseInt((nearestArrivalTime - time) / 60);
			var timeUntilSecond = parseInt((secondNearestArrivalTime - time) / 60);
			var timeUntilThird = parseInt((thirdNearestArrivalTime - time) / 60);

			this.departures.push({
				first_eta: timeUntilFirst,
				second_eta: timeUntilSecond,
				third_eta: timeUntilThird,
				lineLabel: line
			});

			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
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
