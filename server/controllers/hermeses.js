/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/
const mongoose = require('mongoose');

const Hermes = require('../models/hermeses');

/**
 * Register a hermese node
 *
 * @name createHermeses
 * @route {POST} api/setup/
 * @bodyparam hermes: { title, url }
 * @returns Status code 400 on failure
 * @returns hermes Object on success with status code 200
 */
exports.create = (req, res, next) => {
  const title = req.body.hermes ? req.body.hermes.title : null;
  const url = req.body.hermes ? req.body.hermes.url : null;

  const hermes = new Hermes({
    title,
    url
  });
  hermes
    .save()
    .then(hermes => {
      req.status = 200;
      req.hermes = hermes;
      return next();
    }).catch(error => {
      if (error.code === 11000) { res.status(400).json({ message: 'Hermes URL already exists' }); }
      else { console.log(error), res.status(400).json({ message: error }); }
    });
};

/**
 * Get all hermeses
 *
 * @name getAllHermeses
 * @route {GET} api/hermeses/
 * @returns Status code 400 on failure
 * @returns array of hermeses & number of hermeses (length) on success with status code 200
 */
exports.getAll = (req, res, next) => {
  Hermes.find({ public: true })
    .then(results => {
      req.status = 200;
      req.json = {
        resultCount: results.length,
        data: results
      };
      return next();
    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
};
