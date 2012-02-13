(function($) {
	"use strict";

	/**
	 * usage: log(msg) | log(msg, topic) | log(msg, level) | log(msg, level, topic);
	 * @function $.log
	 * @param {String} msg message to be logged
	 * @param {String} [topic='$.log.options.defaultTopic'] topic of message
	 * @param {String} [level=$.log.options.defaultLoggingLevel]
	 */
	$.log = function(msg, level, topic) {
		if (!msg)
			return;

		if (arguments.length == 1) {
			level = $.log.options.defaultLoggingLevel;
			topic = $.log.options.defaultTopic;
		}

		if (arguments.length == 2) {
			if ($.inArray(level, $.log.options.loggingLevels) !== -1) {
				topic = $.log.options.defaultTopic;
			} else {
				topic = level;
				level = $.log.options.defaultLoggingLevel;
			}
		}

		// Default type if not set
		if ($.inArray(level, $.log.options.loggingLevels) === -1) {
			level = $.log.options.defaultLoggingLevel;
		}

		for (var key in viewers) {
			if (viewers.hasOwnProperty(key)) {
				if (_filterTopic(topic, viewers[key].options.topicFilter) &&
					_filterLevel(level, viewers[key].options.levelFilter)) {

					viewers[key].view.output(msg, level, topic);
				}
			}
		}
	};


	$.log.views = {
		console: function() {
			this.output = function(msg, level, topic) {
				if (!console)
					return;

				if (!$.isFunction(console[level])) {
					level = 'log'
				}

				if (topic != $.log.options.defaultTopic) {
					msg = topic + ': ' + msg;
				}

				console[level].call(null, msg);
			}
		},
		pageTopics: function(options) {
			if (!options.block || !options.block.size())
				throw new Error('Cannot create instance of Page Viewer: wrapper block is not specified');

			var _pageTopics = {};
			var _pageBlock = options.block.addClass('logger');

			_addHandlers();

			function _getBlock(topic) {
				if (_pageTopics[topic])
					return _pageTopics[topic];

				var title = $('<p class="logger_title"></p>').text(topic),
					content = $('<div class="logger_content"></div>'),
					wrap = $('<div class="logger_topic"></div>').append(title).append(content);
				_pageBlock.append(wrap);

				_pageTopics[topic] = content;
				return content;
			}

			function _addHandlers() {
				_pageBlock.delegate('p.logger_title', 'click', function() {
					$(this).next('.logger_content').toggle();
				})
			}

			this.output = function(msg, level, topic) {
				_getBlock(topic).append(
					$('<p class="' + level + '"></p>').text(msg)
				);
			};
		},
		pageList: function(options) {

			if (!options.block || !options.block.size())
				throw new Error('Cannot create instance of PageList Viewer: wrapper block is not specified');

			var _pageTopics = {};
			var _pageBlock = options.block.addClass('logger');
			var _topicCounter = 0;

			_addFilters();

			function _addFilters() {
				_pageBlock.append(
					'<select class="logger_level_filter">' + _createSelector($.log.options.loggingLevels) + '</select>' +
					'<select class="logger_topic_filter">' + _createSelector(_pageTopics) + '</select>'
				);

				_pageBlock.find('.logger_level_filter, .logger_topic_filter').change(function() {

					var level = _pageBlock.find('.logger_level_filter').val(),
						topic = _pageBlock.find('.logger_topic_filter').val(),
						list = _pageBlock.find('p');

					list.show();
					if (level != 'all') {
						list.filter(':not(.' + level + ')').hide();
					}

					if (topic != 'all') {
						list.filter(':not([data-topic="' + topic + '"])').hide();
					}
				});
			}

			function _createSelector(list) {
				var html = '<option value="all">all</option>',
					i;
				for (i in list) if (list.hasOwnProperty(i)) {
					html += '<option value="' + list[i] + '">' + ($.isNumeric(i) ? list[i] : i) + '</option>';
				}
				return html;
			}

			function _getTopicId(topic) {
				if (!_pageTopics[topic]) {
					_pageTopics[topic] = ++_topicCounter;

					_pageBlock.find('.logger_topic_filter').html(_createSelector(_pageTopics));
				}
				return _pageTopics[topic];
			}

			this.output = function(msg, level, topic) {
				_pageBlock.append(
					$('<p class="' + level + '" data-topic="' + _getTopicId(topic) + '"></p>').text(msg)
				);
			}
		},
		window: function(options) {

			if (!$.log.views[options.blockViewer])
				throw new Error('Cannot create windowTopics viewer: incorrect name of blockViewer');

			var _win = null;
			var _pageViewer = null;

			/**
			 * Lazy initialization of window
			 */
			function _initWindow() {
				if (_win)
					return;

				_win = window.open('', 'loggerWindow', 'menubar=no,location=no,toolbar=no,resizable=yes,scrollbars=yes,status=no');

				$(_win.document.body).html('');
				_pageViewer = new $.log.views[options.blockViewer]($.extend(options, {block: $(_win.document.body)}));

				if (options.cssFile) {
					$(_win.document.head).append(
						$('<link rel="stylesheet" type="text/css" href="' + options.cssFile + '">')
					);
				}
			}

			this.output = function(msg, level, topic) {
				if (!_win) {
					_initWindow();
				}
				_pageViewer.output(msg, level, topic);
			}
		}
	};

	$.log.views.pageList.prototype = $.log.views.pageTopics;

	/**
	 * Default plugin settings
	 * @public
	 * @field {String[]} [options.loggingLevels = ['debug', 'info', 'warn', 'error']] List of available logging levels;
	 * you can change this like any other options, but if you want to get proper aliases for logging levels,
	 * you must use $.log.setLoggingLevels() instead. Note also, that you'll need to recreate pageList and windowList
	 * viewers is they were created before changing logging levels, because they initialize filters depending on actual
	 * value of logging levels
	 * @field {String} [defaultLoggingLevel='info'] If you use $.log() function without specifying logging level,
	 * this.value will be used as default
	 * @field {String} [defaultLevelFilter='info'] Default level filter for any new viewer
	 * @field {String[]} [defaultTopicFilter=['*']] Default topic filter for any new viewer
 	 */
	$.log.options = {
		/**
		 * Array of available logging levels;
		 */
		loggingLevels: ['debug', 'info', 'warn', 'error'],
		defaultLoggingLevel: 'info',
		defaultTopic: 'raw',
		defaultLevelFilter: 'info',
		defaultTopicFilter: ['*']
	};


	$.extend($.log, {
		/**
		 * Function sets new array of logging levels and properly adds alias functions for them
		 * @param {String[]} levels new list of logging levels
		 */
		setLoggingLevels: function(levels) {
			if (!$.isArray(levels))
				throw new Error('Logging levels parameter must be array of strings!');

			_manageAliases($.log.options.loggingLevels, false);
			$.log.options.loggingLevels = levels;
			_manageAliases(levels, true);
		},

		/**
		 * Add new viewer to existing viewers
		 *
		 * @param {Object} options options for viewer instance, can vary depending on viewer type
		 * Available options:
		 * @param {String} options.type type of viewer, all available viewer types are keys of $.log.viewers
		 * @param {jQuery} options.block for 'page' viewer represents wrapper block
		 * @param {String} options.cssFile for 'window' filter contains absolute path for logger.css file
		 * @param {String} [options.blockViewer='pageList'] for 'window' filter contains name of existing page view within the window
		 * @param {String[]} [options.topicFilter=$.log.options.defaultTopicFilter] Filter for topics
		 * @param {String} [options.levelFilter=$.log.options.defaultLevelFilter] Filter for logging level
		 *
		 * @param [viewerId = new Date().getTime()] id of new viewer, to delete it later if needed
		 * @return viewerId
		 */
		addView: function(options, viewerId) {
			viewerId = viewerId || new Date().getTime();

			if (!options.type || !$.log.views[options.type])
				throw new Error('Incorrect viewer type!');

			options = $.extend({
				topicFilter: $.log.options.defaultTopicFilter,
				levelFilter: $.log.options.defaultLevelFilter,
				blockViewer: 'pageList'
			}, options);

			viewers[viewerId] = {
				options: options,
				view: new $.log.views[options.type](options)
			};
			return viewerId;
		},

		/**
		 * Delete viewer by its id from list of viewers
		 * @param viewerId
		 */
		deleteView: function(viewerId) {
			delete viewers[viewerId];
		}
	});

	/**
	 * Returns true if given topic satisfies current output topic filter
	 * @private
	 * @param {String} topic
	 * @param {String[]} filter filter for topics
	 * @return {Boolean}
	 */
	function _filterTopic(topic, filter) {
		if ($.inArray('*', filter) !== -1)
			return true;

		var struct = topic.split('.'),
			i;

		for (i=0; i<struct.length; i++) {
			if ($.inArray(struct[i], filter) !== -1)
				return true;
		}

		return false;
	}

	/**
	 * Returns true if given level equals or exceeds current output level
	 * @private
	 * @param {String} level level of message
	 * @param {String} filter allowed level of messages
	 * @return {Boolean}
	 */
	function _filterLevel(level, filter) {

		var index = $.inArray(level, $.log.options.loggingLevels);
		var allowedIndex = $.inArray(filter, $.log.options.loggingLevels);

		return index >= allowedIndex;
	}

	/**
	 * @private
	 * Create or drop alias functions for convenient logging of every log level
	 * @example if we have debug, info, warn, error levels it will add four alias functions
	 *   $.log.debug(msg, topic)
	 *   $.log.info(msg, topic)
	 *   $.log.warn(msg, topic)
	 *   $.log.error(msg, topic)
	 *
	 * @param {String[]} levels array of level ids
	 * @param {Boolean} add whether to add or drop aliases
	 */
	function _manageAliases(levels, add) {
		var i;

		function addAlias(level) {
			$.log[level] = function(msg, topic) {
				$.log(msg, level, topic || $.log.options.defaultTopic);
			};
		}

		for (i=0; i < levels.length; i++) {
			if (add) {
				addAlias(levels[i]);
			} else {
				delete $.log[levels[i]]
			}
		}
	}

	$.log.setLoggingLevels($.log.options.loggingLevels);
	var viewers = {};

})(jQuery);