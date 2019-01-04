"use strict";

/* Magic Mirror
 * Module: MMM-MMM-NycMtaSchedule
 *
 * By Marlee Stevenson
 */

const NodeHelper = require("node_helper");
var request = require("request");
var GtfsRealtimeBindings = require("gtfs-realtime-bindings");

module.exports = NodeHelper.create({

	start: function () {
		this.started = false;
		this.config = null;
	},

	getData: function () {
		var self = this;
		var trainsOfInterest = this.config.trainStops;
		console.log(trainsOfInterest);
		var responses = [];
		var completedRequests = 0;

		for (var i = 0; i < trainsOfInterest.length; i++) {
			var promise = new Promise(resolve => {
				var myUrl = this.config.apiBase + "?key=" + this.config.mtaAPIKey + "&feed_id=" + trainsOfInterest[i].feed_id;
				var line = trainsOfInterest[i].line;
				var station = trainsOfInterest[i].station;
				request({
					url: myUrl,
					method: "GET",
					encoding: null
				}, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						resolve([body, line, station, myUrl])
					}
				})
			}).then(values => {

				var feed = GtfsRealtimeBindings.FeedMessage.decode(values[0]);
				var feedFormatted = {feed: feed, line: values[1], station: values[2], url: values[3]}
				responses.push(feedFormatted);
				completedRequests++;
				if (completedRequests === trainsOfInterest.length) {
					self.sendSocketNotification("DATA", responses);
				}
			})
		}


		setTimeout(function () {
			self.getData();
		}, this.config.refreshInterval);
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;
		if (notification === "CONFIG" && self.started === false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
			self.started = true;
		}
	}
});
