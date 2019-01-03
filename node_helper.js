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

		// var allFeeds = [];
		var trainStops = this.config.trainStops;

		for(var i=0; i<trainStops.length; i++){
			var myUrl = this.config.apiBase + "?key=" + this.config.mtaAPIKey + "&feed_id=" + trainStops[i].feed_id;
			var trainStopsI = trainStops[i]

			request({
				url: myUrl,
				method: "GET",
				encoding: null
			}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
					var outputFeed = {
						feed: feed,
						station: trainStopsI.station,
						line: trainStopsI.line
					};
					// console.log("~~~~~~~~~~~~~~TESTING")
					self.sendSocketNotification("DATA", outputFeed);
				}
			});

			setTimeout(function () {
				self.getData();
			}, this.config.refreshInterval);
		}
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;
		if (notification === "CONFIG" && self.started == false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
			self.started = true;
		}
	}
});
