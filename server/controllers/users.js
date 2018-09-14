/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/
const utilsPassword = require('../utils/password');
const mongoose = require('mongoose');
const config = require('../config');
const axios = require('axios');
const bcrypt = require('bcrypt');
const Web3 = require('web3');
const web3 = new Web3();
const User = require('../models/users');
const Company = require('../models/companies');
const Role = require('../models/roles');
const Invite = require('../models/invites');

/**
 * Create a new user.
 *
 * @name createUser
 * @route {POST} api/users/create
 * @bodyparam user: {email, accessLevel, permissions}, hermes
 * @returns Status code 400 on failure
 * @returns user Object on success with status code 200
 */
exports.create = (req, res, next) => {
  const user = req.body.user || {};
  const { full_name, address, token, password } = user;
  const hermes = req.hermes || req.body.hermes;
  const inviteToken = req.query.token;
  let email = user.email;
  let accessLevel = user.accessLevel || 1;
  let permissions = user.permissions || ['create_entity'];
  let company = '';

  // invite
  if (inviteToken) {
    try {
      const _token = JSON.parse(utilsPassword.decrypt(inviteToken, config.secret));
      email = _token['email'];
      accessLevel = _token['accessLevel'];
      permissions = _token['permissions'];
      company = _token['company'];
    } catch (error) { return res.status(400).json({ message: 'Invite token is invalid' }); }
  }

  if (full_name && email && address && password && hermes) {
    User.find({ $or: [{ email }, { address }] })
      .then((users = []) => {
        if (!users.length) {
          bcrypt.hash(password, 10, (err, hash) => {
            if (!err) {
              const user = new User({
                _id: new mongoose.Types.ObjectId(),
                full_name,
                email,
                address,
                token,
                password: hash
              });

              if (company) { user['company'] = company; }

              user
                .save()
                .then(user => {
                  // Register user in the hermes
                  const headers = {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `AMB_TOKEN ${config.token}`
                  };
                  const body = {
                    address,
                    permissions,
                    accessLevel
                  }
                  axios.post(`${hermes.url}/accounts`, body, { headers })
                    .then(userRegistered => {
                      if (inviteToken) {
                        Invite.findOneAndRemove({ token: inviteToken })
                          .then(inviteDeleted => console.log('Invite deleted'))
                          .catch(error => console.log('Invite delete error: ', error));
                      }

                      req.status = 200;
                      req.user = user;
                      return next();
                    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
                }).catch(error => (console.log(error), res.status(400).json({ message: error })));
            } else { return (console.log(err), res.status(400).json({ message: err })); }
          });
        } else { throw 'Email or address is already in use'; }
      }).catch(error => (console.log(error), res.status(400).json({ message: error })));
  } else if (!full_name) {
    return res.status(400).json({ message: 'User "full_name" is required' });
  } else if (!email) {
    return res.status(400).json({ message: 'User "email" is required' });
  } else if (!address) {
    return res.status(400).json({ message: 'User "address" is required' });
  } else if (!token) {
    return res.status(400).json({ message: 'User "token" is required' });
  } else if (!password) {
    return res.status(400).json({ message: 'User "password" is required' });
  } else if (!password) {
    return res.status(400).json({ message: '"hermes" object is required' });
  }
}

/**
 * Sets company ownership
 *
 * @name setOwnership
 * @route {POST} api/setup
 * @bodyparam user, company
 * @returns Status code 400 on failure
 * @returns Status code 200 on success
 */
exports.setOwnership = (req, res, next) => {
  const user = req.user || req.body.user;
  const company = req.company || req.body.company;

  if (user && company) {
    Company.findById(company._id)
      .then(_company => {
        if (_company) {
          User.findById(user._id)
            .then(_user => {
              if (_user) {
                _company.owner = _user;
                _company.save()
                  .then(saved => {
                    req.status = 200;
                    return next();
                  }).catch(error => (console.log(error), res.status(400).json({ message: error })));
              } else { throw 'No user found'; }
            }).catch(error => (console.log(error), res.status(400).json({ message: error })));
        } else { throw 'No company found'; }
      }).catch(error => (console.log(error), res.status(400).json({ message: error })));
  } else if (!user) {
    return res.status(400).json({ message: '"user" object is required' });
  } else if (!company) {
    return res.status(400).json({ message: '"company" object is required' });
  }
}

/**
 * Get account details based on email address
 *
 * @name getAccount
 * @route {GET} api/users/
 * @returns Status code 400 on failure
 * @returns user Object on success with status code 200
 */
exports.getAccount = (req, res, next) => {
  const email = req.params.email;

  User.findOne({ email })
    .populate({
      path: 'company',
      select: '-active -createdAt -updatedAt -__v -owner',
      populate: {
        path: 'hermes',
        select: '-active -createdAt -updatedAt -__v -public'
      }
    })
    .populate({
      path: 'role',
      select: '-createdAt -updatedAt -__v'
    })
    .select('-active -createdAt -updatedAt -__v')
    .then(user => {
      if (user) {
        console.log(user);
        req.status = 200;
        req.json = user;
        return next();
      } else { throw 'No user found'; }
    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
}

/**
 * Get list of accounts based on the user's company
 *
 * @name getCompanyAccounts
 * @route {GET} api/users/
 * @returns Status code 400 on failure
 * @returns users Object & number of users (count) on success with status code 200
 */
exports.getAccounts = (req, res, next) => {
  const user = req.session.user;

  User.find({ company: user.company })
    .populate({
      path: 'company',
      select: '-active -createdAt -updatedAt -__v -owner',
      populate: {
        path: 'hermes',
        select: '-active -createdAt -updatedAt -__v -public'
      }
    })
    .populate({
      path: 'role',
      select: '-createdAt -updatedAt -__v'
    })
    .select('-password -__v')
    .then(users => {
      if (users) {
        req.status = 200;
        req.json = {
          resultCount: users.length,
          data: users
        };
        return next();
      } else { throw 'No users found'; }
    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
}

/**
 * Get settings of a particular user (query using email address)
 *
 * @name getSettings
 * @route {GET} /settings/:email
 * @queryparam email
 * @returns Status code 400 on failure
 * @returns userSettings (user.settings) Object on success with status code 200
 */
exports.getSettings = (req, res, next) => {
  const email = req.params.email;

  User.findOne({ email })
    .then(user => {
      if (user) {
        req.status = 200;
        req.json = user.settings;
        return next();
      } else { throw 'No accounts found'; }
    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
}

exports.getNotifications = (req, res, next) => {}

/**
 * Update user details using the user email address
 *
 * @name editUserDetails
 * @route {PUT} /users/:email
 * @queryparam email
 * @bodyparam userDetails: any
 * @returns Status code 400 on failure
 * @returns updateResponse Object on success with status code 200
 */
exports.edit = (req, res, next) => {
  const email = req.params.email;
  const query = req.body;

  const update = {}
  const nowAllowedToChange = ['email', 'company', 'address', 'token'];
  for (const key in query) {
    if (nowAllowedToChange.indexOf(key) === -1) {
      update[key] = query[key]
    }
  }

  User.findOneAndUpdate({ email }, update)
    .then(updateResponse => {
      if (updateResponse) {
        req.status = 200;
        req.json = { message: 'Update data success', data: updateResponse };
        return next();
      } else { throw 'Update data error'; }
    }).catch(error => (console.log(error), res.status(400).json({ message: error })));
}

/**
 * Change password of a user using their email address
 *
 * @name changePassword
 * @route {PUT} /users/password
 * @bodyparam email, oldPassword, newPassword
 * @returns Status code 400 on failure
 * @returns Password success message on success with status code 200
 */
exports.changePassword = (req, res, next) => {
  const email = req.body.email;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  if (email && oldPassword && newPassword) {
    User.findOne({ email })
      .then(user => {
        if (user) {
          try {
            const decData = web3.eth.accounts.decrypt(JSON.parse(user.token), oldPassword);
            const encData = web3.eth.accounts.encrypt(decData.privateKey, newPassword);
            user.token = JSON.stringify(encData);
            bcrypt.hash(newPassword, 10, (err, hash) => {
              user.password = hash;
              user.save()
                .then(updateResponse => {
                  if (updateResponse) {
                    req.status = 200;
                    req.json = { message: 'Password reset successful' };
                    return next();
                  } else { throw 'Error in updating password'; }
                }).catch(error => (console.log(error), res.status(400).json({ message: error })));
            });
          } 
          catch(err){
            throw 'Incorrect password';
          }
        } else { throw 'No user found with this email address'; }
      }).catch(error => (console.log(error), res.status(400).json({ message: error })));
  } else if (!email) {
    return res.status(400).json({ message: '"email" is required' });
  } else if (!oldPassword) {
    return res.status(400).json({ message: '"oldPassword" is required' });
  } else if (!newPassword) {
    return res.status(400).json({ message: '"newPassword" is required' });
  }
};

/**
 * Assign roles (role ObjectID) to users using their email address
 *
 * @name assignRole
 * @route {POST} api/users/role
 * @bodyparam email, role (Mongoose objectID)
 * @returns Status code 400 on failure
 * @returns Save success message on success with status code 200
 */
exports.assignRole = (req, res, next) => {
  const email = req.body.email;
  const role = req.body.role;

  if (email && role) {
    User.findOneAndUpdate({ email }, { role })
      .then(updateResponse => {
        if (updateResponse) {
          req.status = 200;
          req.json = { message: 'Role updated successfully', data: updateResponse };
          return next();
        } else { throw 'Update data error'; }
      }).catch(error => (console.log(error), res.status(400).json({ message: error })));
  } else if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  } else if (!role) {
    return res.status(400).json({ message: 'Role ObjectID is required' });
  }

};

/**
 * Allows users to edit existing roles to other users using their email address
 *
 * @name editRole
 * @route {POST} api/users/role
 * @bodyparam email, role (Mongoose objectID)
 * @returns Status code 400 on failure
 * @returns Save success message on success with status code 200
 */
exports.editRole = (req, res, next) => {
  const update = {};
  const email = req.body.email;
  const role = req.body.role;

  if (email && role) {
    update.role = role;
    User.findOne({ email })
      .populate({
        path: 'role',
        select: '-createdAt -updatedAt -__v'
      })
      .then(user => {
        if (user) {
          User.findOneAndUpdate({ email }, update)
            .then(updateResponse => {
              if (updateResponse) {
                req.status = 200;
                req.json = { message: 'Role edited successfully', data: updateResponse }
                return next();
              } else { throw 'Role edit error'; }
            }).catch(error => (console.log(error), res.status(400).json({ message: error })));
        } else { throw 'No user found' };
      }).catch(error => (console.log(error), res.status(400).json({ message: error })));
    } else if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    } else if (!role) {
      return res.status(400).json({ message: 'Role ObjectID is required' });
    }
};