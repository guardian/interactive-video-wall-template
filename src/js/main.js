define([
    'text!templates/appTemplate.html',
    'jquery'
], function(
    templateHTML,
    $
) {
	'use strict';

	function init(el, context, bootconfig, mediator) {
		// DEBUG: What we get given on boot
		console.log(el, context, bootconfig, mediator);

		// DOM template example
		el.innerHTML = templateHTML;

		// Global variables
		var DEBUG = true;
		var DEBUG_msg = 'There was an error. Use DEBUG mode for more detail.';
		if ( DEBUG ){
			console.log('DEBUG mode active.');
		}

		var config = window.videoWall.config;
		if ( DEBUG ){
			console.log('Video Wall config:');
			console.log(config);
		}

		var data = {};
		var $body = $('body');
		var $interactive = $('figure.element-interactive.interactive');
		var $videoList = $('#vw-video-tiles-list .vw-video-tiles-inner');
		var $articleList = $('#vw-article-tiles-list');
		var $videoModal = $('#vw-video-modal');

		var breakpoint = getBreakpoint();
		if ( DEBUG ){
			console.log('Active breakpoint: ' + breakpoint);
		}

		// Load JSON data
		if ( config.data ){
			//data.main = loadData(config.data.main);
			var videos = loadData(config.data.videos);
			//data.articles = loadData(config.data.articles);
			
			// Data loaded?
			$.when( videos ).done(function( data_videos ){
				if ( data_videos ){
					// Success, initiate page build
					data.videos = data_videos.sheets.Sheet1;
					populateVideoWall();
				} else {
					// Failed
					console.log(DEBUG_msg);
				}
			});
		}

		// Functions
		// Function: Build the Video wall interactive
		function populateVideoWall() {
			// Add the header and intro

			// Loop through and add the videos
			for ( var v = 0; v < data.videos.length; v++ ){
				$videoList.append( videoTile(data.videos[v], v) );
			}

			// Loop through and add the articles
			/*var articleCount = data.articles.length >= 4 ? 4 : data.articles.length;

			for ( var a = 0; a < articleCount; a++ ){
				$articleList.append( articleTile(data.articles[a], a) );
			}*/

			// Add listeners
			addVideoWallListeners();
		}

		// Function: Add event listeners to the interactive
		function addVideoWallListeners() {
			$interactive.on('click', '[data-vw-video-item]', function(){
				var index = $(this).attr('data-vw-video-index');
				toggleModal(index);

				if ( DEBUG ){
					console.log(index);
				}
			});

			$interactive.on('click', '[data-vw-modal-close]', function(){
				toggleModal();
			});
		}

		// Function: Toggle video modal visibility
		function toggleModal(index) {
			if ( $body.attr('data-vw-modal-active') ){
				$body.removeAttr('data-vw-modal-active');
			} else {
				$body.attr('data-vw-modal-active', '');
			}
		}

		// Function: Toggle video modal visibility
		function emptyModal() {

		}

		// Function: Toggle video modal visibility
		function populateModal(index) {
			var content = data.videos[index];

			if ( content ){

			} else {
				if ( DEBUG ){
					console.log('Error: The requested video index was not found.');
				}
				console.log(DEBUG_msg);
			}
		}

		// Function: Video tile item
		function videoTile(content, index) {
			var style = 'vw-video-tiles-item-normal';

			if ( content.type === 'placeholder' ){
				style = 'vw-video-tiles-item-placeholder';
			} else if ( content.type === 'featured' ){
				style = 'vw-video-tiles-item-featured';
			}

			var html = '<!-- VIDEO TILE -->'
				+ '<div class="vw-video-tiles-item ' + style + '"'
					// Data attributes for the video modal
					+ ' data-vw-video-item'
					+ ' data-vw-video-id="' + content.id + '"'
					+ ' data-vw-video-index="' + index + '"'
				+'>'
					+ '<a href="#" class="vw-video-tiles-item-inner inner">'
						+ '<figure class="vw-video-tiles-item-media">'
							+ '<img src="' + responsiveImage(content['tile.img.mobile'], content['tile.img.tablet'], content['tile.img.desktop']) + '" alt="" />'
						+ '</figure>'
						+ '<div class="vw-video-tiles-item-body">'
							+ '<h2>' + content.title + '</h2>'
							+ '<div class="vw-video-tiles-item-body-hover">';

							// Insert play button or coming soon text
							if ( content.type === 'placeholder' ){
								html += '<div class="vw-video-soon">coming soon</div>'
							} else {
								html += '<div class="vw-video-button-play"></div>'
								+ '<div class="vw-video-duration">' + content['video.duration'] + '</div>';
							}

							html += '</div>'
						+ '</div>'
					+ '</a>'
				+ '</div>'
				+ '<!-- VIDEO TILE END -->';

			return html;
		}

		// Function: Article tile item
		function articleTile(content, index) {
			var html = '<!-- FOOTER ARTICLE ITEM -->'
				+ '<div class="vw-article-tiles-item">'
					+ '<a href="' + content.url + '" class="vw-article-tiles-item-inner inner">'
						+ '<figure class="vw-article-tiles-item-media">'
							+ '<img src="' + responsiveImage(content['tile.img.mobile'], content['tile.img.tablet'], content['tile.img.desktop']) + '" alt="' + content.title + '" />'
						+ '</figure>'
						+ '<div class="vw-article-tiles-item-body">'
							+ '<h3>' + content.title + '</h3>'
						+ '</div>'
					+ '</a>'
				+ '</div>'
				+ '<!-- FOOTER ARTICLE ITEM END -->';

			return html;
		}

		// Function: Load an image based on the current breakpoint size
		function responsiveImage(mobile, tablet, desktop) {
			if ( breakpoint === 'mobile' ){
				if ( mobile ){
					return mobile;
				} else if ( tablet ){
					if ( DEBUG ){
						console.log('Info: Mobile image is undefined, loading Mobile');
					}
					return tablet;
				} else if ( desktop ){
					if ( DEBUG ){
						console.log('Info: Tablet image is undefined, loading Desktop');
					}
					return desktop;
				} else {
					if ( DEBUG ){
						console.log('Error: Desktop image is undefined');
					}
				}
			} else if ( breakpoint === 'tablet' ){
				if ( tablet ){
					return tablet;
				} else if ( desktop ){
					if ( DEBUG ){
						console.log('Info: Tablet image is undefined, loading Desktop');
					}
					return desktop;
				} else {
					if ( DEBUG ){
						console.log('Error: Desktop image is undefined');
					}
				}
			} else {
				if ( desktop ){
					return desktop;
				} else {
					if ( DEBUG ){
						console.log('Error: Desktop image is undefined');
					}
				}
			}

			return;
		}

		// Function: Detect the current breakpoint
		function getBreakpoint() {
			var width = window.innerWidth;

			if ( width < 740 ) {
				return 'mobile';
			} else if ( width >= 740 && width < 980 ) {
				return 'tablet';
			} else {
				return 'desktop';
			}
		}

        // Function: Load JSON data
        function loadData(key) {
        	var url = "https://interactive.guim.co.uk/spreadsheetdata/" + key + ".json";

			var request = $.ajax({
				method: "GET",
				url: url,
				cache: DEBUG ? false : true,
				dataType: "json"
			});

			return request;
		}
    }

    return {
        init: init
    };
});
