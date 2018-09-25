/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/
const mongoose = require('mongoose');

const companiesSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  title: {
    type: String,
    required: [(value) => !value, 'Title field is required' ],
    index: { unique: true },
    minLength: 4
  },
  hermes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hermeses'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  active: {
    type: Boolean,
    default: true
  },
  branding: {
    dasboard: String,
    ambto: String
  },
  settings: String,
  timeZone: String,
  createdAt: {
    type: Date,
    default: +new Date()
  },
  updatedAt: {
    type: Date,
    default: +new Date()
  }
});

companiesSchema.pre('update', function (next) {
  this.updatedAt = +new Date();
  next();
});

companiesSchema.pre('save', function (next) {
  this.createdAt = +new Date();
  next();
});

module.exports = mongoose.model('Companies', companiesSchema);
