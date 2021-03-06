'use strict';

var _       = require('lodash');
var io      = require('socket.io-client');
var Promise = require('promise');

var config     = require('../config');
var Action     = require('../constants/actions');
var Dispatcher = require('../dispatcher');

var AuthStore   = require('../stores/auth');
var BoardStore  = require('../stores/board');
var TicketStore = require('../stores/ticket');

/**
 * Public interface.
 */
module.exports = {
	connect:    connect,
	disconnect: disconnect,
}

/**
 * Keeping track of boards we have joined.
 */
var _rooms = [ ];

/**
 * Reference to our socket instance.
 */
var _socket = null;

/**
 * We declare the possible events here as 'constants'.
 */
var JOIN_EVENT = 'board:join';
var DATA_EVENT = 'board:event';

/**
 * Creates a new 'socket.io' connection. Doesn't do anything if a connection is
 * already present.
 *
 * Note that this also attaches the event handlers for listening to changes, so
 * don't worry about them. We also keep track of the boards currently in store,
 * so we can join their respective rooms.
 *
 * @param {object} opts        Options for the connection.
 * @param {string} opts.token  Handshake token sent as a query parameter.
 *
 * @returns {Promise}  Resolved when a connection is established. Rejected if
 *                     an error occurs with the connection.
 */
function connect(opts) {
	var options = {
		'query': 'access-token=' + opts.token + '',
		// For socket.io to actually force new connections to the same host, we
		// need to tell it to do so explicitly...
		'multiplex':            false,
		'force new connection': true,
	}
	return new Promise(function(resolve, reject) {
		if(_socket && _socket.connected) {
			return resolve();
		}
		return (_socket = io(config.io, options))
			.on('error',   onConnectionFailure)
			.on('connect', onConnectionSuccess);

		/**
		 *
		 */
		function onConnectionSuccess() {
			// Store a reference to the connected socket and attach a listener
			// to receive any data. Note we only have a single event, see the
			// implementation of 'teamboard-api' for reasons.
			_socket.on(DATA_EVENT, _onData);

			// Join the boards we currently have in store. Attach a listener
			// for listening to changes in BoardStore.
			_joinBoards();
			BoardStore.addChangeListener(_joinBoards);

			return resolve();
		}

		/**
		 *
		 */
		function onConnectionFailure(err) {
			// TODO For some reason the 'err' received here is actually a JSON
			//      string for now... Gotta make sure to parse it...
			var error     = JSON.parse(err);
			var errorType = error.statusCode === 401 ?
				Action.AUTHENTICATION_FAILURE : Action.FAILURE;

			Dispatcher.dispatch({
				payload: { error: error }, type: errorType,
			});
			return reject(err);
		}
	});
}

/**
 *
 */
function disconnect() {
	return new Promise(function(resolve) {
		if(_socket && _socket.connected) {
			_socket.disconnect();
		}

		_rooms  = [ ];
		_socket = null;

		BoardStore.removeChangeListener(_joinBoards);

		return resolve();
	});
}

/**
 * Joins rooms (or boards) at socket level, based on BoardStore.
 *
 * TODO We should really define the 'dirty' here as a constant at application
 *      level, so it doesn't get lost in the jungle of code and stuff.
 */
function _joinBoards() {
	if(!_socket || !_socket.connected) {
		return null;
	}

	var dirty    = 'dirty';
	var boardIDs = _.pluck(BoardStore.getBoards(), 'id');

	_.difference(boardIDs, _rooms).forEach(function(id) {
		// If the board is 'dirty', not yet server approved, we don't join it.
		if(id.substring(0, dirty.length) === dirty) {
			return null;
		}
		// Attempt to join the room, back out if an error occurs.
		_rooms.push(id);
		_socket.emit(JOIN_EVENT, { board: id }, function(err) {
			if(err) {
				return (_rooms = _.without(_rooms, id));
			}
		});
	});
}

/**
 *
 * TODO Move 'type' to constants.
 */
function _onData(data) {
	switch(data.type) {
		case 'BOARD_EDIT':
			break;
		case 'BOARD_REMOVE':
			break;
		case 'TICKET_CREATE':
			if(!TicketStore.getTicket(data.board, data.data.id)) {
				Dispatcher.dispatch({
					payload: {
						ticket:  data.data,
						boardID: data.board,
					},
					type: Action.ADD_TICKET,
				});
			}
			break;
		case 'TICKET_EDIT':
			Dispatcher.dispatch({
				payload: {
					ticket:   data.data.newAttributes,
					boardID:  data.board,
					ticketID: data.data.id,
				},
				type: Action.EDIT_TICKET,
			});
			break;
		case 'TICKET_REMOVE':
			Dispatcher.dispatch({
				payload: {
					boardID:  data.board,
					ticketID: data.data.id,
				},
				type: Action.REMOVE_TICKET,
			});
			break;
	}
}
