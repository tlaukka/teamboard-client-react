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

/**
 *
 */
var Ticket = React.createClass({

	mixins: [DraggableMixin, TweenState.Mixin],

	propTypes: {
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
			this.setState({
				x: this.draggable.position.x,
				y: this.draggable.position.y,
			});

			TicketActions.moveTicket({
				id: this._currentElement.key,
				position: {
					x: this.draggable.position.x,
					y: this.draggable.position.y,
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

		this.tweenState('x', {
			duration: 500,
			endValue: next.position.x,
		});
		this.tweenState('y', {
			duration: 500,
			endValue: next.position.y,
		});
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
					onDismiss={this.dismissEditDialog} />
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
	dismissEditDialog: function() {
		this.setState({ isEditing: false });
	},
});

module.exports = Ticket;
