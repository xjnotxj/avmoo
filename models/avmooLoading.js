const mongoose = require('mongoose');
const moment = require('moment');

const avmooLoadingSchema = mongoose.Schema({
    content: {
        type: Object,
        required: true
    }
}, {collection: 'avmooLoading', timestamps: true});

const AvmooLoading = mongoose.model('AvmooLoading', avmooLoadingSchema);

module.exports = AvmooLoading;
