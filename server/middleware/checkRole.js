/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/
const User = require('../models/users');

module.exports = (roleId) => {
  return (req, res, next) => {
    try {
      const userId = req.session.user._id

      User.findById(userId)
        .populate('role')
        .then(user => {
          if (user) {
            if (user.role.id !== roleId) { throw 'Unauthorized'; }

            return next();
          } else { throw 'No user found' }
        }).catch(error => (console.log(error), res.status(401).json({ message: error })));
    } catch (error) { return res.status(401).json({ message: error }); }
  }
};