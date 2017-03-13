'use strict';

/**
 * Cloud Data Services Tracker Collector main module
 * 
 *   Collect client tracking data
 * 
 * @author Arnab Laik
 */

var express = require('express');
var path = require('path');
var http = require('http');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var randomstring = require('randomstring');
var _ = require('lodash');
//var cloudant = require('./lib/storage');
//var misc = require('./lib/misc');

var dbName = process.env.CLOUDANT_DB_NAME || "tracker_db_new";
// References for Azure DocDB
var DocumentDBClient = require('documentdb').DocumentClient;
var docdbConfig = require('./lib/docdbConfig');
var url = require('url');


var type_pageView = "pageView";
var type_search = "search";
var type_link = "link";
//Create and configure the express app
var app = express();
app.use(express.static(path.join(__dirname, 'js')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler({ dumpExceptions: true, showStack: true }));

// Create the doc db connection
var client = new DocumentDBClient(docdbConfig.host, { "masterKey": docdbConfig.authKey });
// Fetch the databaseID and Collection
var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${docdbConfig.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${docdbConfig.collection.id}`;
// Get the reference to the docDB database

// Utility function to fetch the database reference
function getDatabase() {
	console.log(`Getting database:\n${docdbConfig.database.id}\n`);

	return new Promise((resolve, reject) => {
		client.readDatabase(databaseUrl, (err, result) => {
			if (err) {
				if (err.code == HttpStatusCodes.NOTFOUND) {
					client.createDatabase(docdbConfig.database, (err, created) => {
						if (err) reject(err)
						else resolve(created);
					});
				} else {
					reject(err);
				}
			} else {
				resolve(result);
			}
		});
	});
};

function exit(message) {
	console.log(message);
	console.log('Press any key to exit');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
};

// Create a collection..WARNING!! This step has pricing implications. Do not create more than one collection

// Utility function to get the reference to a collection
function getCollection() {
	console.log(`Getting collection:\n${docdbConfig.collection.id}\nThis step has pricing implications!! Do not create more than one collection`);

	return new Promise((resolve, reject) => {
		client.readCollection(collectionUrl, (err, result) => {
			if (err) {
				if (err.code == HttpStatusCodes.NOTFOUND) {
					client.createCollection(databaseUrl, docdbConfig.collection, { offerThroughput: 400 }, (err, created) => {
						if (err) reject(err)
						else resolve(created);
					});
				} else {
					reject(err);
				}
			} else {
				resolve(result);
			}
		});
	});
};

// Get or store a document in the collection
function getClickstreamDocument(document) {
	document.id = document.action_name + document.h + document.m + document.s + document.ip;
	console.log(document.id);
	let documentUrl = `${collectionUrl}/docs/${document.id}`;
	console.log(`Getting document:\n${document.id}\n`);

	return new Promise((resolve, reject) => {
		client.readDocument(documentUrl, (err, result) => {
			if (err) {
				if (err.code == HttpStatusCodes.NOTFOUND) {
					client.createDocument(collectionUrl, document, (err, created) => {
						if (err) reject(err)
						else resolve(created);
					});
				} else {
					reject(err);
				}
			} else {
				resolve(result);
			}
		});
	});
};

// Initialize the DOCDB instance
getDatabase()
		.then(() => getCollection())
		.then(() => { exit(`Completed successfully`);})

app.get("/tracker", function (req, res) {
	//console.log(req.query);
	// Get the json payload
	var type = null;
	var pid = null;
	var jsonPayload = _.chain(req.query)
		.mapValues(function (value) {
			try {
				return JSON.parse(value);

			} catch (e) {
				return value;
			};
		}).mapKeys(function (value, key) {
			if (key === "action_name") {
				type = type_pageView;
			} else if (key === "link") {
				type = type_link;
			} else if (key === "search") {
				type = type_search;
			}
			if (_.startsWith(key, '_')) {
				//Cloudant doesn't authorize key starting with _
				return "lyl" + key;
			}
			return key;
		}).value();

	if (type) {
		jsonPayload.type = type;
	}

	//Capture the IP address
	var ip = req.headers['x-client-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (ip) {
		jsonPayload.ip = ip;
	}

	["rec", "r", "send_image", "pdf", "qt", "realp", "wma", "dir", "fla", "java", "gears", "ag", "uap", "uag"].forEach(e => delete jsonPayload[e]);

	var jsonPayloadMod = [];
	jsonPayload.type = jsonPayload.cvar["1"][1];
	jsonPayload.platform = jsonPayload.cvar["6"][1];
	jsonPayload.agent = jsonPayload.cvar["7"][1];


	if (jsonPayload.cvar["1"][1] === "detail") {
		jsonPayload.pid = jsonPayload.cvar["3"][1];
		jsonPayload.price = jsonPayload.cvar["2"][1];
		jsonPayload.description = jsonPayload.cvar["4"][1];
		jsonPayload.category = jsonPayload.cvar["5"][1];
		delete jsonPayload.cvar;
		jsonPayloadMod.push(jsonPayload);
	}
	else if (jsonPayload.cvar["1"][1] === "add" || jsonPayload.cvar["1"][1] === "remove") {
		jsonPayload.pid = jsonPayload.ec_items[0][0];
		jsonPayload.price = jsonPayload.ec_items[0][3];
		jsonPayload.description = jsonPayload.ec_items[0][1];
		jsonPayload.category = jsonPayload.ec_items[0][2];
		jsonPayload.quantity = jsonPayload.ec_items[0][4];
		delete jsonPayload.cvar;
		delete jsonPayload.ec_items;
		delete jsonPayload.revenue;
		delete jsonPayload.idgoal;
		jsonPayloadMod.push(jsonPayload);
	}
	else if (jsonPayload.cvar["1"][1] === "purchase" && jsonPayload["ec_items"]) {
		for (var i = 0; i < jsonPayload["ec_items"].length; i++) {
			var temp = _.cloneDeep(jsonPayload);
			temp.pid = temp["ec_items"][i][0];
			temp.price = temp["ec_items"][i][3];
			temp.description = temp["ec_items"][i][1];
			temp.category = temp["ec_items"][i][2];
			temp.quantity = temp["ec_items"][i][4];
			jsonPayloadMod.push(temp);
			delete jsonPayloadMod[i]["cvar"];
			delete jsonPayloadMod[i]["ec_items"];

		}
	}

	else if (jsonPayload.cvar["1"][1] === "checkout") {
		delete jsonPayload.cvar;
		jsonPayloadMod.push(jsonPayload);
	}

	else if (jsonPayload.cvar["1"][1] === "view") {
		delete jsonPayload.cvar;
		jsonPayloadMod.push(jsonPayload);
	}


	console.log(JSON.stringify(jsonPayloadMod));
	for (let i = 0; i < jsonPayloadMod.length; i++) {
		//Insert payload in db

		getClickstreamDocument(jsonPayloadMod[i])
			.then(() => { jsonPayloadMod = jsonPayloadMod.splice(jsonPayloadMod.indexOf(jsonPayloadMod[i], 1)); console.log('Completed Successfully'); res.send('Done: Success');})
			.catch((error) => { /*exit(`Completed with error ${JSON.stringify(error)}`)*/ console.log('Completed with error' +  JSON.stringify(error)); res.send('Done: Error');});
	}

});

app.get("*", function (request, response) {
	console.log("GET request url %s : headers: %j", request.url, request.headers);

	response.status(500).send('<h1>Invalid Request</h1><p>Simple Metrics Collector captures web metrics data and stores it in <a href="https://cloudant.com">Cloudant</a>. There are no web pages here. This is middleware.</p><p>For more information check out <a href="https://github.com/ibm-cds-labs/metrics-collector/">the GitHub repo</a></p>');
});

//If Cloud Foundry
var port = process.env.VCAP_APP_PORT || 8085;
var connected = function () {
	console.log("MEtrics Collector started on port %s : %s", port, Date(Date.now()));
};

if (process.env.VCAP_APP_HOST) {
	http.createServer(app).listen(process.env.VCAP_APP_PORT,
		process.env.VCAP_APP_HOST,
		connected);
} else {
	http.createServer(app).listen(port, connected);
}
