<?php
/**
 * Global Header Module
 * 
 * @author Dexter Lee
 */
class Module_GlobalheaderController extends Zend_Controller_Action {

	/*
	 * Constants
	 */
	const MAX_ITEMS = 1;
	const MAX_SUBNAV = 10;
	const MAX_SHOWS = 15;
	const ALL_SHOWS_TEXT = 'all shows';	

	/*
	 * API data
	 * @var Object
	 */
	private $_data;

	/*
	 * App config
	 * @var array
	 */
	private $_config;

	/*
	 * @var String
	 */
	private $_bu;

	/*
	 * Global site name for current BU
	 * @var String
	 */
	private $_globalSiteSettings;

	/*
	 * Current show name
	 * @var String
	 */
	private $_showName;

	/*
	 * Cache
	 * @var Zend_Cache
	 */
	private $_cache;

	/*
	 * Cache label
	 * @var String
	 */
	private $_cacheLabel;

	/*
	 * Set up references
	 *
	 * @return void
	 */
	public function init() {
		$this->_config = Zend_Registry::isRegistered('appConfig') ?
			Zend_Registry::get('appConfig')->toArray() : array();
		$this->_bu = Zend_Registry::get('businessunit');
		$this->_globalSiteSettings = $this->_config[$this->_bu]['sitesettings'];
		$this->_cache = new Zend_Cache();
		$this->_showName = 'global';

		parent::init();		
	}

	/*
	 * Index action
	 *
	 * @return void
	 */
	public function indexAction() {
		$this->_showName = $this->_site->getTitle();
		$this->_cacheLabel = md5($this->_bu . '_' . $this->_showName . '_');
		$data = array();

		// get the global nav links from global site settings object
		$options = array(
			'filters' => array(
				'type' => 'site',
				'show' => $this->_globalSiteSettings,
				'shownavigation' => 1,
				'limit' => array('items' => self::MAX_ITEMS)
			)
		);
		$this->_data = $this->_cache->retrieve(
			$this->_cacheLabel . 'globalMenu',
			function($api, $opt) {
				return $api->find($opt);
			},
			array($this->_api(), $options)
		);		

		if ($this->_data) {
			foreach ($this->_data as $navItems) {
				$navigation = $navItems->navigation;
				$data['nav'] = array();
				$data['secondaryNav'] = array();
				$data['tertiaryNav'] = array();

				if (isset($navigation)) {
					foreach ($navigation as $item) {

						$content = array();
						$content['title'] = $item['title'];
						// replace all non-alphanumeric characters with dashes and lowercase title
						$content['titleClass'] = strtolower(preg_replace('![^a-z0-9]+!i', '-', $item['title']));
						$content['link'] = $item['link'];

						// check to see if link is secondary or tertiary link
						if (isset($item['tag']) && is_array($item['tag'])) {
							if (in_array('secondary', $item['tag'])) {
								$data['secondaryNav'][] = $content;
							} else if (in_array('tertiary', $item['tag'])) {
								$data['tertiaryNav'][] = $content;
							}
						// if no tags set, it is a primary link
						} else {
							// if this item is shows, add submenu for it
							if (strcasecmp($item['title'], 'shows') === 0) {
								// get all shows data for show links
								$options = array(
									'filters' => array(
										'type' => 'site',
										'filter' => 'showtype=shows',
										'tag' => 'globalnav',
										'sort' => 'name',
										'limit' => array('items' => self::MAX_SHOWS)
									)
								);
								$showData = $this->_cache->retrieve(
									$this->_cacheLabel . 'showsList',
									function($api, $opt) {
										return $api->find($opt);
									},
									array($this->_api(), $options)
								);
								$showsContent = array();
								$showsContent['shows'] = array();
								$showContent = array();

								if ($showData) {
									foreach ($showData as $showItem) {
										$showContent['title'] = $showItem->title;
										$showContent['link'] = $showItem->link;
										$showsContent['shows'][] = $showContent;
									}
								}
								$showsContent['allShowsText'] = self::ALL_SHOWS_TEXT;
								$content['showsLinks'] = $showsContent;
							}
							$data['nav'][] = $content;
						}
					}
				}
			}
		}

		// get the current show info from site settings object and subnav if this is a show page
		if (strcasecmp($this->_site->getSettings()->getTitle(), $this->_globalSiteSettings) !== 0) {
			$options = array(
				'filters' => array(
					'type' => 'site',
					'show' => $this->_showName,
					'shownavigation' => 1,
					'sorts' => 'name',
					'limit' => array('items' => self::MAX_SUBNAV)
				)
			);
			$this->_data = $this->_cache->retrieve(
				$this->_cacheLabel . 'showMenu',
				function($api, $opt) {
					return $api->find($opt);
				},
				array($this->_api(), $options)
			);
			$content = array();

			if (isset($this->_data[0])) {
				$item = $this->_data[0];
				$content['showname'] = $item->title;
				$content['tunein'] = htmlentities(strip_tags(html_entity_decode($item->tunein)));
				$content['link'] = $item->link;

				// get logo tagged altlogo
				foreach ($item->mediaContent as $media) {
					if (isset($media->mediaCategory[0])) {
						$category = $media->mediaCategory[0]['category'];

						if (strcasecmp($category, 'altlogo') === 0) {
							$content['mediaThumbnail'] = array('url' => $media->url);
						}
					}
				}
				$content['subnav'] = array();
				$navigation = $item->navigation;
				$navContent = array();


				// get navigation associated content
				if (isset($navigation)) {
					foreach ($navigation as $navItem) {
						$navContent['title'] = $navItem['title'];
						$navContent['link'] = $navItem['link'];
						$content['subnav'][] = $navContent;
					}
				}
				$data['show'] = $content;
				$data['isShowsNav'] = true;
			}
		}
		// send data to template
		$viewRenderer = $this->_helper->getHelper('viewRenderer');
		$viewRenderer->setView($this->view)->setViewSuffix('hbs');

		$this->view->data = $data;
	}
}