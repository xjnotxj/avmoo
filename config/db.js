const mongoose = require('mongoose');
const config = require('../config');

mongoose.Promise = global.Promise;
mongoose.set('debug', true);

let uri = `mongodb://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.dbname}`;
if (!config.db.username) {
    uri = `mongodb://${config.db.host}:${config.db.port}/${config.db.dbname}`;
}

const promise = mongoose.connect(uri, {
    useMongoClient: true,
});
promise.then(function (db) {
    db.on('error', console.error.bind(console, 'Connection error.'));
    db.once('open', function callback() {
        console.log("Connection succeeded.");
    });
});

module.exports = promise;