var config = {}

config.host = process.env.HOST || "https://basicxx-clickstream-test.documents.azure.com:443/";
config.authKey = process.env.AUTH_KEY || "DxFzCQjRl9lrhAeSVP2jAsfVvgH1RIckGLUOi4ZBaiJMO1ai3MDhSGiZW81toFSTi4ETx2S2ZWJxsRihCbrTLg==";

config.database = {
    "id": "ClickstreamDB"
};

config.collection = {
    "id": "ClickstreamColl"
};


config.documents = {
    "Andersen": {
        "id": "Anderson.1",
        "lastName": "Andersen",
        "parents": [{
            "firstName": "Thomas"
        }, {
            "firstName": "Mary Kay"
        }],
        "children": [{
            "firstName": "Henriette Thaulow",
            "gender": "female",
            "grade": 5,
            "pets": [{
                "givenName": "Fluffy"
            }]
        }],
        "address": {
            "state": "WA",
            "county": "King",
            "city": "Seattle"
        }
    },
    "Wakefield": {
        "id": "Wakefield.7",
        "parents": [{
            "familyName": "Wakefield",
            "firstName": "Robin"
        }, {
            "familyName": "Miller",
            "firstName": "Ben"
        }],
        "children": [{
            "familyName": "Merriam",
            "firstName": "Jesse",
            "gender": "female",
            "grade": 8,
            "pets": [{
                "givenName": "Goofy"
            }, {
                "givenName": "Shadow"
            }]
        }, {
            "familyName": "Miller",
            "firstName": "Lisa",
            "gender": "female",
            "grade": 1
        }],
        "address": {
            "state": "NY",
            "county": "Manhattan",
            "city": "NY"
        },
        "isRegistered": false
    }
};

module.exports = config;
