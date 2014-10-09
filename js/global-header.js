/*
 * Global Header JS
 *
 * @author Dexter Lee
 *
 * Core events, actions and animations for the responsive global header navigation menu.
 *
 * Hooks
 * *****************************
 * @name: hook_description
 * 	- @arg: value_description
 * *****************************
 * globalNav_menu: various menu states
 *  - type: the type of menu
 * 		dropdown: the main menu
 * 		subMenu: the sub menu
 * 	- action: the action being performed on the menu
 * 		open: menu is opening
 * 		close: menu is closing
 * 		resize: menu is being resized
 * 	- obj: the jQuery object to be modified on post hook callback
 *
 * globalNav_full: the nav is in full size mode (tablet plus)
 *
 * globalNav_compact: the nav is in compact size mode (phablet minus)
 *
 *
 * Global Functions
 * *****************************
 * @name: function_description
 * 	- @arg: value_description
 * *****************************
 * dlee.GlobalNav.init: initialize the global nav
 * 	- options: object containing all the customizable parameters for the nav *
 * 		nav: the nav wrapper class
 * 		dropdownMenu: the main menu drawer
 * 		showsMenu: the shows menu drawer
 * 		panelContainer: the main dropdown panel container
 * 		navListing: the links within the subnav
 * 		searchForm: the HTML form for search
 * 		dropdownTrigger: the button that toggles the dropdown menu
 * 		showsTrigger: the button that toggles the shows menu
 * 		shadowTrigger: shadow trigger links
 * 		showsShadowTrigger: shadow shows menu trigger link
 * 		wrapper: the container for the entire site content
 * 		hookPrepend: the value to be prepended to all hook names
 * 		hasHoverMenu: boolean to determine whether or not to display dropdown menu on hover (default is click)
 * 		currBp: the current breakpoint
 */
var dlee = dlee || {};

(function ($) {
	// set default global nav options
	dlee.GlobalNav.options = {
		nav: '.globalNav',
		getNavContents: function() {
			this.dropdownMenu = this.nav + ' .dropdownMenu';
			this.showsMenu = this.dropdownMenu + ' .showsListing';
			this.panelContainer = this.dropdownMenu + ' .panelContainer';
			this.navListing = this.panelContainer + ' .navListing';
			this.searchTrigger = '.searchTrigger';
			this.searchForm = '.searchBox';
			this.searchShadowTrigger = 'li.shadow span.search';
			this.dropdownTrigger = this.nav + ' a.dropdownTrigger';
			this.showsTrigger = this.nav + ' a.showsTrigger';
			this.shadowTrigger = this.nav + ' li.shadow span:not(.shows)';
			this.showsShadowTrigger = this.nav + ' li.shadow span.shows';
			return this;
		},
		wrapper: '#wrapper',
		hookPrepend: 'globalNav_',
		defaultEvent: 'tap',
		hasHoverMenu: false,
		currBp: null
	};
	// determine transition name to use with CSS transition callbacks
	var transitionEndNames = {
			'WebkitTransition': 'webkitTransitionEnd',
			'MozTransition': 'transitionend',
			'OTransition': 'oTransitionEnd',
			'msTransition': 'MSTransitionEnd',
			'transition': 'transitionend'
		},
		transitionEnd = transitionEndNames[Modernizr.prefixed('transition')],
		options = dlee.GlobalNav.options,
		hPrepend = options.hookPrepend,
		$nav,
		$dMenu,
		$sMenu,
		$pContainer,
		$dTrigger,
		$sTrigger,
		$ssTrigger,
		$searchBox,
		$searchTrigger,
		$searchShadowTrigger,
		attachEvents = function() {},
		detachEvents = function() {},
		adjustColumns = function() {},
		buildList = function() {},
		animateMenu = function() {};

	/*
	 * Bind events to the nav elements
	 */
	attachEvents = function() {
		var menuEvent = options.defaultEvent;

		if (options.hasHoverMenu) {
			menuEvent = 'hover';
		}
		// toggle display of the dropdown and/or sub menu
		$(options.wrapper).on(
			[options.dropdownTrigger, options.showsTrigger, options.searchTrigger].join(', '),
			menuEvent,
			function(e, c) {
				var type = 'dropdown',
					action = 'open',
					obj = $dMenu;

				if ($(this).hasClass('showsTrigger')) {
					type = 'shows';
					obj = $sMenu;
				}

				if ($(this).hasClass('searchTrigger')) {
					type = 'search';
					obj = $searchBox;
				}

				if (!$(this).hasClass('selected') && !c) {
					if (!options.hasHoverMenu || (options.hasHoverMenu && e.type === 'mouseenter')) {
						$(this).addClass('selected');

						if (type === 'dropdown') {
							$dMenu.addClass('active');
							$ssTrigger.removeClass('selected');
							$searchShadowTrigger.removeClass('selected');
						} else if(type === 'shows'){
							$sMenu.addClass('active');
							$ssTrigger.addClass('selected');

							if (!$nav.hasClass('compact')) {
								$dTrigger.removeClass('selected');
								$searchShadowTrigger.removeClass('selected');
							}
						} else if(type === 'search'){
							$searchBox.addClass('active');
							$searchShadowTrigger.addClass('selected');

							$ssTrigger.removeClass('selected');
							$sTrigger.removeClass('selected');

							if (!$nav.hasClass('compact')) {
								$dTrigger.removeClass('selected');
							}
						}
					}
				} else if (!options.hasHoverMenu || (options.hasHoverMenu && e.type !== 'mouseenter')) {
					$(this).removeClass('selected');
					$sTrigger.removeClass('selected');
					$ssTrigger.removeClass('selected');
					$searchTrigger.removeClass('selected');
					$searchShadowTrigger.removeClass('selected');
					action = 'close';
				}
				dlee.Hook(hPrepend + 'menu', { 'args':
					{
						'type': type,
						'action': action,
						'obj': obj
					}
				});
				if (!options.hasHoverMenu) {
					return false;
				}
		// toggle display of the search form
		}).on(options.dropdownMenu, menuEvent, function(e) {
			e.stopPropagation();
		// hide dropdown menu when transition animation is complete
		}).on(options.dropdownMenu, transitionEnd, function() {
			var $activeMenus;

			if (!$dMenu.hasClass('open')) {
				$dMenu.removeClass('active');

				$activeMenus = $dMenu.find('.showsListing.active, .searchBox.active');

				if ($activeMenus.length) {
					$activeMenus.removeClass('active');
					$pContainer.removeClass('openShows openSearch complete');
				}
			}
		// hide dropdown menu contents when transition animation is complete
		}).on(options.panelContainer, transitionEnd, function() {
			var $this = $(this);

			if ($this.is('.openShows, .openSearch') && !$this.hasClass('reverse')) {
				$this.addClass('complete');

				if ($this.hasClass('openSearch')) {
					$searchBox.find('#searchInput').focus();
				}

			} else if ($(this).is('.openShows, .openSearch, .complete, .reverse')) {
				$(this).removeClass('openShows openSearch complete reverse');
			}
		// clicking shadow link triggers real link
		}).on(options.shadowTrigger, menuEvent, function(e) {
			var $this = $(this),
				shadowClass = $this.attr('class'),
				href;

			if (shadowClass === 'search') {
				shadowClass += 'Trigger';
			}

			href =  $dMenu.find('a.' + shadowClass).attr('href');

			if (href && href.indexOf('#') < 0){
				e.stopPropagation();
				window.location = href;
			}
		// clicking shadow shows link triggers real shows link
		}).on(options.showsShadowTrigger, menuEvent, function(e) {
			e.stopPropagation();
			$sTrigger.trigger(menuEvent);
		}).on(
			options.searchShadowTrigger,
			menuEvent,
			function(e) {
				e.stopPropagation();
				$searchTrigger.trigger(menuEvent);
		}).on(
			'.searchForm .removeButton',
			menuEvent,
			function(ev){
				ev.preventDefault();
//				if (Modernizr.csstransitions) {
//					$pContainer.addClass('reverse');
//				} else {
					$pContainer.removeClass('openSearch complete');
					$searchBox.removeClass('active');
					$searchTrigger.removeClass('selected');
					$searchShadowTrigger.removeClass('selected');
//				}
		});

		// hide an open menu if the outside of the menu is clicked
		$('html').on('*', menuEvent, function(e) {
			if ($dMenu.hasClass('active')) {
				$dTrigger.trigger(menuEvent, [e, true]);
			}
		});
	};

	/*
	 * Unbind events from the nav elements
	 */
	detachEvents = function() {
		if (options.hasHoverMenu) {
			$(options.wrapper).off(
				options.dropdownTrigger,
				options.showsTrigger,
				options.showsShadowTrigger,
				'hover'
			);
		} else {
			$(options.wrapper).off(
				options.dropdownTrigger,
				options.showsTrigger,
				options.showsShadowTrigger,
				menuEvent
			);
		}
		$(options.wrapper).off(
			options.dropdownMenu,
			options.shadowTrigger,
			menuEvent
		);
		$(options.wrapper).off(
			options.dropdownMenu,
			options.content,
			transitionEnd
		);
		$('html').off();
	};

	/*
	 * Animation effects for various menu states using CSS3 transitions
	 * with a JS fallback for each one
	 *
	 * @param type The type of menu
	 * @param action The menu action
	 * @param obj The DOM element
	 */
	animateMenu = function(type, action, obj) {
		switch (type) {
			case 'dropdown':
				// perform open dropdown menu animation
				if (action === 'open') {
					adjustColumns();
					obj.addClass('open');

					// close shows menu if it is open
					if ($sMenu.hasClass('active') || $searchBox.hasClass('active')) {
						$sMenu.removeClass('active');
						$sTrigger.removeClass('selected');
						$searchBox.removeClass('active');
						$searchTrigger.removeClass('selected');

						if (Modernizr.csstransitions) {
							$pContainer.addClass('reverse');
						} else {
							$pContainer.removeClass('openShows openSearch complete');
						}
					}
				// perform close dropdown menu animation
				} else {
					obj.removeClass('open');

					if (!Modernizr.csstransitions) {
						obj.removeClass('active');
					}
				}
				break;
			case 'shows':
				// perform open shows menu animation
				if (action === 'open') {
					adjustColumns();
					$pContainer.removeClass('openSearch').addClass('openShows');

					if ($searchBox.hasClass('active')) {
						$searchBox.removeClass('active');
						$searchTrigger.removeClass('selected');
					}

					// open dropdown menu if not already open
					if (!$dMenu.hasClass('active')) {
						$dMenu.addClass('active open');
						adjustColumns();
						$pContainer.addClass('complete');
					} else if (!Modernizr.csstransitions) {
						$pContainer.addClass('complete');
					}
				// perform close shows menu animation
				}
				else {
					// close dropdown menu if in full site mode
					if (!$nav.hasClass('compact')) {
						$dMenu.removeClass('open');

						if (!Modernizr.csstransitions) {
							$dMenu.removeClass('active');
						}
					} else {
						obj.removeClass('active');
						$pContainer.removeClass('openShows complete');
					}
				}
				break;
			case 'search':
				if (action === 'open') { // perform open shows menu animation
					$pContainer.removeClass('openShows complete').addClass('openSearch');

					if ($sMenu.hasClass('active')) {
						$sMenu.removeClass('active');
						$sTrigger.removeClass('selected');
					}

					if (!$dMenu.hasClass('active')) {
						$dMenu.addClass('active open');
						$pContainer.addClass('complete');
					} else if (!Modernizr.csstransitions) {
						$pContainer.addClass('complete');
						$searchBox.find('#searchInput').focus();
					}

				} else { // perform close shows menu animation
					if (!$nav.hasClass('compact')) { // close dropdown menu if in full site mode
						$dMenu.removeClass('open');

						if (!Modernizr.csstransitions) {
							$dMenu.removeClass('active');
						}
					} else {
						obj.removeClass('active');
						$pContainer.removeClass('openSearch complete');
					}
				}
				break;
		}
	};

	/*
	 * Adjust the number of columns in the listings and other
	 * elements inside them
	 */
	adjustColumns = function() {
		var navCols = 2,
            showsCols = 3;

		// only adjust columns if web or tablet viewport and menu is active
		if ($dMenu.hasClass('active') && !$nav.hasClass('compact')) {
			// load in replaceable image only in web view
			if (options.currBp === 'web') {
				dlee.Utils.fnImageInit($('img.replaceable', $dMenu));
			}
			// if there is no CSS column support, build columns using JS
			if (!Modernizr.csscolumns) {
                // if tablet breakpoint, only display 2 columns for shows listing
                if (options.currBp === 'tablet') {
                    showsCols = 2;
                }
				// if non-shows page, build nav list
				if (!$nav.hasClass('show')) {
					$('.listing', $(options.navListing)).html(buildList($('.listing li', $(options.navListing)), navCols));
				}
				// build shows list
				$('.listing', $sMenu).html(buildList($('.listing li', $sMenu), showsCols));
			}
		}
	};

	/*
	 * Build the listing to match the number of columns to display
	 *
	 * @param container The listing container element
	 * @param cols The number of columns to display
	 */
	buildList = function(container, cols) {
		var list = container.map(
				function() {
					var $links = $(this).children('a'),
						opt = {};

					if ($links.length) {
						opt.link = $links.attr('href');
						opt.title = $links.text();
						opt.className = $links.attr('class');
					}
					return opt;
				}
			).get(),
			splitNum = Math.ceil(list.length / cols),
			content = '<ul class="multiCol">',
			count = 0,
			classVal = '';

		// cycle through the entire listing and generate list columns
		// based on the max number of columns
        $.each(list, function(i) {
			if (count / splitNum === 1) {
                count = 0;
				content += '</ul><ul class="multiCol">';
			}
			if (list[i].className) {
				classVal = ' class="' + list[i].className + '"';
			}
			content += '<li><a' + classVal + ' href="' + list[i].link + '">' + list[i].title + '</a></li>';
            count++;
		});
		content += '</ul>';

		return content;
	};

	/*
	 * Initialize the nav
	 *
	 * @param options Object with options overrides
	 * @param reinit Boolean to determine if this is being
	 * reinitialized or not.
	 */
	dlee.GlobalNav.init = function(options, reinit) {
		if (options) {
			if (reinit) {
				detachEvents();
			}
			this.options = $.extend(
				{},
				this.options,
				options
			);
		}
		this.options.getNavContents();
		$nav = $(this.options.nav);
		$dMenu = $(this.options.dropdownMenu);
		$sMenu = $(this.options.showsMenu);
		$pContainer = $(this.options.panelContainer);
		$dTrigger = $(this.options.dropdownTrigger);
		$sTrigger = $(this.options.showsTrigger);
		$ssTrigger = $(this.options.showsShadowTrigger);
		$searchBox = $nav.find(this.options.searchForm);
		$searchTrigger = $nav.find(this.options.searchTrigger);
		$searchShadowTrigger = $nav.find(this.options.searchShadowTrigger);
		hPrepend = this.options.hookPrepend;
		dlee.GlobalNav.options = this.options;

        if (dlee.isMobile) {
            $nav.addClass('compact');
        }
        if (dlee.isLegacySite) {
            this.options.defaultEvent = 'click';
        }
		attachEvents();
	};

	// DOM ready functionality
	$(document).ready(function() {
		// call global nav init
		dlee.GlobalNav.init();

		// breakpoint shift hook
		dlee.Hook('breakPoint', {
			'hook': function(args) {
				options.currBp = args.breakpoint;

				if (options.currBp === 'mobile' || options.currBp === 'phablet') {
					if (!$nav.hasClass('compact')) {
						$nav.addClass('compact');
						dlee.Hook(hPrepend + 'compact');

						if ($sMenu.hasClass('active')) {
							$dTrigger.addClass('selected');
						}
					}
				} else {
					if ($nav.hasClass('compact')) {
						$nav.removeClass('compact');
						dlee.Hook(hPrepend + 'full');

						if ($sMenu.hasClass('active')) {
							$dTrigger.removeClass('selected');
						}
					}
					adjustColumns();
				}
			},
			'runIfRan': true
		});

		// menu animations hook
		dlee.Hook(hPrepend + 'menu',
			function(args) {
				animateMenu(args.type, args.action, args.obj);
			}
		);
	});
})(jQuery);