'use strict';

var Action      = require('../constants/actions');
var createStore = require('../utils/create-store');

/**
 * @module stores/auth
 *
 * @description
 * Holds the current user's state. Listens to actions and updates the store's
 * state accordingly.
 *
 * @listens event:LOGIN_SUCCESS
 * @listens event:LOGOUT_SUCCESS
 * @listens event:LOAD_USER_SUCCESS
 * @listens event:LOGIN_GUEST_SUCCESS
 * @listens event:AUTHENTICATION_FAILURE
 */
var AuthStoreAPI = {
	getUser:  getUser,
	getToken: getToken,
}

module.exports = createStore(AuthStoreAPI, function(action) {
	switch(action.type) {
		case Action.LOGIN_SUCCESS:
		case Action.LOGIN_GUEST_SUCCESS:
			_setUser(action.payload.user);
			_setToken(action.payload.token);
			this.emitChange();
			break;

		case Action.LOAD_USER_SUCCESS:
			_setUser(action.payload.user);
			this.emitChange();
			break;

		case Action.LOGOUT_SUCCESS:
			_clear();
			this.emitChange();
			break;

		case Action.AUTHENTICATION_FAILURE:
			_clear();
			this.emitChange();
			break;
	}
});

/**
 * Returns the currently logged in user.
 *
 * @alias module:stores/auth.getUser
 *
 * @returns {object?} The current user.
 */
function getUser() {
	if(localStorage.getItem('user')) {
		return JSON.parse(localStorage.getItem('user'));
	}
	return null;
}

/**
 * Returns the currently logged in user's access token.
 *
 * @alias module:stores/auth.getToken
 *
 * @returns {string?} The access token.
 */
function getToken() {
	return localStorage.getItem('token');
}

/**
 * Set the current user.
 *
 * @alias module:stores/auth._setUser
 * @private
 *
 * @param {object} user  The object to set as the user.
 */
function _setUser(user) {
	localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Set the current access token.
 *
 * @alias module:stores/auth._setToken
 * @private
 *
 * @param {string} token  The string to set as the access token.
 */
function _setToken(token) {
	localStorage.setItem('token', token);
}

/**
 * Clears the current credentials, effectively logging out the user.
 *
 * @alias module:stores/auth._clear
 * @private
 */
function _clear() {
	localStorage.removeItem('user');
	localStorage.removeItem('token');
}
