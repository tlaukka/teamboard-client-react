'use strict';

var React   = require('react/addons');
var IScroll = require('iscroll');

/**
 * Scrollable is a wrapper element which makes the child element scrollable in
 * both X and Y dimensions.
 */
var Scrollable = React.createClass({

	propTypes: {
		/**
		 * The 'children' property must be a single child element, which will
		 * become the 'scroller' element.
		 */
		children: React.PropTypes.element.isRequired,

		/**
		 * The 'size' property determines the width and height of the element
		 * which Scrollable wraps.
		 */
		size: React.PropTypes.shape({
			width:  React.PropTypes.number,
			height: React.PropTypes.number,
		}).isRequired,
	},

	componentDidMount: function() {
		this.scroller = new IScroll(this.refs.wrapper.getDOMNode(), {
			scrollX:    true,
			scrollY:    true,
			freeScroll: true,
			indicators: {
				el:          this.refs.minimap.getDOMNode(),
				shrink:      false,
				resize:      false,
				interactive: true,
			},
		});

		this.resizeCursor();
	},

	componentWillUnmount: function() {
		this.scroller.destroy();
		this.scroller = null;
	},

	render: function() {
		var style =  {
			height:   '100%',
			overflow: 'hidden',
			position: 'relative',
		}
		return (
			<div className="scrollable">
				<div ref="wrapper" className="wrapper" style={style}>
					{this.props.children}
				</div>
				<div ref="minimap" className="minimap">
					<div ref="cursor" className="cursor" />
				</div>
			</div>
		);
	},

	/**
	 * Calculates the width and height for the 'cursor' element so that it
	 * matches the window size and orientation.
	 */
	resizeCursor: function() {
		var $cursor  = this.refs.cursor.getDOMNode();
		var $wrapper = this.refs.wrapper.getDOMNode();
		var $minimap = this.refs.minimap.getDOMNode();

		var scaleX = $wrapper.clientWidth  / this.props.size.width;
		var scaleY = $wrapper.clientHeight / this.props.size.height;

		$cursor.style.width  = Math.round(scaleX * $minimap.clientWidth);
		$cursor.style.height = Math.round(scaleY * $minimap.clientHeight);

		this.scroller.refresh();
	},
});

module.exports = Scrollable;
