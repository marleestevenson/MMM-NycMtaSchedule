# Module: MMM-NycMtaSchedule
The `MMM-NycMtaSchedule` module lists a countdown for a train for a given train station. Shows in realtime. 

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
        module: "MMM-NycMtaSchedule",
        position: "top_left",
        header: "Subway Times",
        config: {
            mtaAPIKey: "", // API key
            trainStops: [
                {
                    feed_id: "", // feed ID
                    line: "", // train line
                    station: "" // station ID
                }
            ]
        }
    }
]
````