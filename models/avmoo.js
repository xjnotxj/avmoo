const mongoose = require('mongoose');
const moment = require('moment');

const avmooSchema = mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    mark: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    actor: [{
        name: {
            type: String,
        },
    }],
    label: [{
        name: {
            type: String,
        },
    }],
    like: {
        type: Boolean,
        default: false
    },
    pity: {
        type: Boolean,
        default: false
    },
    remark: {
        type: String,
        default: ""
    },
}, {collection: 'avmoo', timestamps: true});

avmooSchema.index({number: 1}, {unique: true});
avmooSchema.index({mark: 1}, {unique: true});

const Avmoo = mongoose.model('Avmoo', avmooSchema);

module.exports = Avmoo;
