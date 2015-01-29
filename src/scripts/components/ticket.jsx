'use strict';

var _          = require('lodash');
var React      = require('react');
var Hammer     = require('hammerjs');
var TweenState = require('react-tween-state');

var Stripe           = require('./stripe.jsx');
var TicketColor      = require('../constants/enums').TicketColor;
var TicketActions    = require('../actions/ticket');
var DraggableMixin   = require('../mixins/draggable');
var TicketEditDialog = require('./ticket-edit-dialog.jsx');

var TICKET_WIDTH  = require('../constants').TICKET_WIDTH;
var TICKET_HEIGHT = require('../constants').TICKET_HEIGHT;

/**
 * Simple helper function to snap a position to grid.
 */
function _gridify(position, grid) {
	return {
		x: Math.round(position.x / TICKET_WIDTH)  * TICKET_WIDTH,
		y: Math.round(position.y / TICKET_HEIGHT) * TICKET_HEIGHT,
	}
}

/**
 *
 */
var Ticket = React.createClass({

	mixins: [DraggableMixin, TweenState.Mixin],

	propTypes: {
		/**
		 *
		 */
		snap: React.PropTypes.bool,
		/**
		 *
		 */
		color: React.PropTypes.oneOf(_.values(TicketColor)),

		/**
		 *
		 */
		content: React.PropTypes.string,

		/**
		 *
		 */
		position: React.PropTypes.shape({
			x: React.PropTypes.number.isRequired,
			y: React.PropTypes.number.isRequired,
		}).isRequired,
	},

	getDefaultProps: function() {
		return {
			snap:     false,
			color:    TicketColor.VIOLET,
			content:  '',
			position: { x: 0, y: 0 },
		}
	},

	getInitialState: function() {
		return {
			x:         this.props.position.x,
			y:         this.props.position.y,
			isEditing: false,
		}
	},

	componentDidMount: function() {
		// Setup HammerJS for our custom 'doubletap' event.
		this.hammer = new Hammer.Manager(this.getDOMNode());
		this.hammer.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));

		// Setup a listener for our custom 'doubletap' event, which will toggle
		// the ticket's 'isEditing' state when invoked.
		this.hammer.on('doubletap', function showEditDialog() {
			this.setState({ isEditing: true });
		}.bind(this));

		// Setup a listener for Draggable mixin's 'dragEnd' events, so we can
		// create actions that update the ticket's position.
		this.draggable.on('dragEnd', function() {
			// For some reason, the element 'key' is not directly accessible
			// at 'this.key' as it should?
			var id  = this._currentElement.key;
			var pos = this.draggable.position;

			// Don't do anything if we didn't actually move the ticket.
			if(this.state.x === pos.x && this.state.y === pos.y) {
				return;
			}

			// The position is just an illusion... If we have snap on...
			var endpos = this.props.snap ? _gridify(pos) : pos;

			// If we are snapping the ticket, we 'tween' the position to the
			// end value, else we just set the state directly.
			if(this.props.snap) {
				this._tweenPositionTo(endpos, this.draggable.position, 100);
			}
			else {
				this.setState({ x: endpos.x, y: endpos.y });
			}

			TicketActions.editTicket({
				id: id,
				position: {
					x: this.state.x,
					y: this.state.y,
				}
			});
		}.bind(this));
	},

	componentWillUnmount: function() {
		this.hammer.destroy();
		this.hammer = null;
	},

	componentWillReceiveProps: function (next) {
		if(this.state.isDragging) return;

		// Don't wanna tween if there ain't nothing to tween...
		var curr = { x: this.state.x, y: this.state.y }
		if(curr.x === next.position.x && curr.y === next.position.y) {
			return;
		}

		return this._tweenPositionTo(next.position);
	},

	render: function() {
		var style = {
			top:      this.getTweeningValue('y'),
			left:     this.getTweeningValue('x'),
			position: 'absolute',
		}

		if(this.state.isEditing) {
			var editDialog = (
				<TicketEditDialog id={this._currentElement.key}
					color={this.props.color} content={this.props.content}
					onDismiss={this._dismissEditDialog} />
			);
		}

		return (
			<div className="ticket" style={style}>
				<Stripe color={this.props.color} />
				<div className="content">
					{this.props.content}
				</div>
				{editDialog}
			</div>
		);
	},

	/**
	 * Passed to the Modal as dismissal function.
	 */
	_dismissEditDialog: function() {
		this.setState({ isEditing: false });
	},

	/**
	 * Uses 'tween-state' to tween the current position to the target.
	 */
	_tweenPositionTo: function(to, from, duration) {
		['x', 'y'].map(function(coordinate) {
			var tweeningOpts = {
				duration:   duration || 500,
				endValue:   to[coordinate],
				beginValue: from ? from[coordinate] : null,
			}
			return this.tweenState(coordinate, tweeningOpts);
		}.bind(this));
	},
});

module.exports = Ticket;
