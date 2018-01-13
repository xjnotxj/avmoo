const mongoose = require('mongoose');
const moment = require('moment');

const searchSchema = mongoose.Schema({
    keyword: {
        type: String,
        required: true
    },
    finish: {
        type: Boolean,
        required: true,
        default: false
    },
    remark: {
        type: String,
        default: ""
    },
}, {collection: 'search', timestamps: true});

searchSchema.index({keyword: 1}, {unique: true});

const Search = mongoose.model('Search', searchSchema);

module.exports = Search;
