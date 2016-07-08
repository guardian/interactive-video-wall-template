define([
    'text!templates/appTemplate.html',
    'jquery',
    'lodash',
    'video'
], function(
    templateHTML,
    $,
    _,
    vjs
) {
	'use strict';

	function init(el, context, bootconfig, mediator) {
		// DEBUG: What we get given on boot
		console.log(el, context, bootconfig, mediator);

		// DOM template example
		el.innerHTML = templateHTML;
		el.setAttribute('data-vw-interactive', '');

		$(document).ready(function(){
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
			var $html = $('html');
			var $body = $('body');
			var $interactive = $('[data-vw-interactive]');
			var $videoList = $('[data-vw-video-tiles]');
			var $articleList = $('[data-vw-article-tiles]');
			var $videoModal = $('[data-vw-video-modal]');
			var $videoWrapper = $('[data-vw-video-wrapper]');
			var breakpoint = getBreakpoint();
			var videojs;
			var videoExists = false;
			if ( DEBUG ){
				console.log('Active breakpoint: ' + breakpoint);
			}

			// Load JSON data
			if ( config.data ){
				var main = loadData(config.data.main);
				var videos = loadData(config.data.videos);
				var articles = loadData(config.data.articles);
				
				// Data loaded?
				$.when( main, videos, articles ).done(function( data_main, data_videos, data_articles ){
					if ( data_main && data_videos && data_articles ){

						// Success, initiate page build
						data.main = data_main[0].sheets.Sheet1[0];
						data.videos = data_videos[0].sheets.Sheet1;
						data.articles = data_articles[0].sheets.Sheet1;
						populateVideoWall();

					} else {
						
						// Failed
						if ( DEBUG ){
							console.log('Fatal Error: A data source request contained no data.');
						}
						console.log(DEBUG_msg);

					}
				}).fail(function(error) {
					
					if ( DEBUG ){
						console.log('Fatal Error: An AJAX request resulted in a ' + error.status + ' ' + error.statusText + ' error.');
					}
					console.log(DEBUG_msg);

				});
			}

			// Functions
			// Function: Build the Video wall interactive
			function populateVideoWall() {
				// Add the header and intro
				$('[data-vw-interactive-hub]').html(data.main['hub.name']).attr('href', data.main['hub.url']);
				$('[data-vw-interactive-name]').html(data.main.name);
				$('[data-vw-interactive-title]').html(data.main.title);
				$('[data-vw-interactive-intro]').html(data.main.intro);
				$('[data-vw-interactive-contributors]').html(data.main.contributors);
				$('[data-vw-interactive-supporter-intro]').html(data.main['supporter.intro']);
				$('[data-vw-interactive-supporter-img]').attr({
					'src': data.main['supporter.img'],
					'alt': data.main['supporter.name']
				});
				$('[data-vw-interactive-supporter-abouturl]').attr('href', data.main['supporter.abouturl']);
				$('[data-vw-interactive-readmoretitle]').html(data.main.readmoretitle);
				$('[data-vw-interactive-copyright]').html(data.main.copyright);

				// Add sharing
				var msg = data.main.twittermsg ? data.main.twittermsg : null;
				var img = data.main.fbimg ? data.main.fbimg : null;

				$('[data-vw-share-global] [data-vw-share]').each(function(){
					var share = socialShare($(this).attr('data-vw-share-target'), null, img, msg);
					$(this).attr('href', share);
				});

				loadShares();

				// Loop through and add the videos
				var videoCount = 0;
				var lastIndex;
				for ( var v = 0; v < data.videos.length; v++ ){
					if ( data.videos[v].type === 'featured' ){
						$videoList.attr('data-vw-video-tiles-featured', '');
					}

					if ( data.videos[v].type !== 'placeholder' ){
						videoCount++;
						lastIndex = v;
					}

					$videoList.append( videoTile(data.videos[v], v) );
				}

				$videoList.attr({
					'data-vw-video-tiles-count': videoCount,
					'data-vw-video-tiles-last-index': lastIndex
				});

				// Loop through and add the articles
				var articleCount = data.articles.length >= 4 ? 4 : data.articles.length;

				for ( var a = 0; a < articleCount; a++ ){
					$articleList.append( articleTile(data.articles[a], a) );
				}

				// Add listeners
				addVideoWallListeners();
			}

			// Function: Add event listeners to the interactive
			function addVideoWallListeners() {
				// Listen for window size changes and change responsive images
				$(window).on('resize', _.debounce( function(){
					var newBreakpoint = getBreakpoint();

					if ( newBreakpoint !== breakpoint ){
						breakpoint = newBreakpoint;

						$interactive.find('[data-vw-responsive-img]').each(function(index){
							responsiveImageSwitcher(
								$(this), 
								$(this).attr('data-vw-responsive-img-target'), 
								$(this).attr('data-vw-responsive-img-mobile'), 
								$(this).attr('data-vw-responsive-img-tablet'), 
								$(this).attr('data-vw-responsive-img-desktop')
							);
						});

						if ( DEBUG ){
							console.log('Active breakpoint: ' + breakpoint);
						}
					}
				}, 200 ));

				// Listen for clicks on video item to launch modal
				$interactive.on('click', '[data-vw-video-item]', function(e){
					e.preventDefault();
					var index = $(this).attr('data-vw-video-index');
					toggleModal(true, parseFloat(index));

					if ( DEBUG ){
						console.log('Info: video item at index ' + index + ' clicked.');
					}
				});

				// Listen for clicks on modal close button
				$interactive.on('click', '[data-vw-video-modal-close]', function(e){
					e.preventDefault();
					toggleModal(false);
				});

				// Listen for clicks on modal next button
				$interactive.on('click', '[data-vw-video-modal-next]', function(e){
					e.preventDefault();
					var index = $(this).attr('data-vw-video-modal-target');
					toggleModal(true, parseFloat(index));
				});

				// Listen for clicks on modal prev button
				$interactive.on('click', '[data-vw-video-modal-prev]', function(e){
					e.preventDefault();
					var index = $(this).attr('data-vw-video-modal-target');
					toggleModal(true, parseFloat(index));
				});

				// Listen for mouseover on video element
				$interactive.on('mouseenter', '[data-vw-video-wrapper] > div', function(e){
					e.preventDefault();
					var timer;

					$(this).addClass('vjs-mousemoved');

					$(this).on('mousemove', _.throttle( function(){
						clearTimeout(timer);
						$(this).addClass('vjs-mousemoved');

						timer = setTimeout(function(){
							$(this).removeClass('vjs-mousemoved');
						}, 2000);
					}, 100));
				});
			}

			// Function: Toggle video modal visibility
			function toggleModal(state, index) {
				if ( state ){
					emptyModal();
					populateModal(index);
					$html.attr('data-vw-modal-active', '');
				} else {
					$html.removeAttr('data-vw-modal-active');
					emptyModal();
				}
			}

			// Function: Toggle video modal visibility
			function emptyModal() {
				if ( videoExists ){
					if ( !videojs ){
						if ( !window.videojs ){
							videojs = vjs;
						} else {
							// RELIES ON GUARDIAN.COM USING VIDEO JS
							videojs = window.videojs;
						}
					}

					videojs('#vw-interactive-main-video').dispose();

					$videoWrapper.empty();

					videoExists = false;
				}
			}

			// Function: Toggle video modal visibility
			function populateModal(index) {
				var content = data.videos[index];

				if ( content && ( index >= 0 || index <= lastIndex ) ){
					videoExists = true;

					var $next = $videoModal.find('[data-vw-video-modal-next]');
					var $prev = $videoModal.find('[data-vw-video-modal-prev]');
					var lastIndex = parseFloat($videoList.attr('data-vw-video-tiles-last-index'));
					var firstIndex = parseFloat($videoList.find('[data-vw-video-item][data-vw-video-index]').eq(0).attr('data-vw-video-index'));
					var nextIndex = parseFloat($videoList.find('[data-vw-video-item]:eq(' + index + ')').nextAll('[data-vw-video-index]:first').attr('data-vw-video-index'));
					var prevIndex = parseFloat($videoList.find('[data-vw-video-item]:eq(' + index + ')').prevAll('[data-vw-video-index]:first').attr('data-vw-video-index'));

					$videoModal.removeAttr('data-vw-video-modal-hide-next');
					$videoModal.removeAttr('data-vw-video-modal-hide-prev');

					if ( index === lastIndex && index > firstIndex ){
						console.log('state 1');
						$videoModal.attr('data-vw-video-modal-hide-next', '');
						$prev.attr('data-vw-video-modal-target', prevIndex);
					} else if ( index === firstIndex && index < lastIndex ){
						console.log('state 2');
						$videoModal.attr('data-vw-video-modal-hide-prev', '');
						$next.attr('data-vw-video-modal-target', nextIndex);
					} else if ( index > firstIndex && index < lastIndex ){
						console.log('state 3');
						$next.attr('data-vw-video-modal-target', nextIndex);
						$prev.attr('data-vw-video-modal-target', prevIndex);
					} else {
						console.log('state 4');
						$videoModal.attr({
							'data-vw-video-modal-hide-next': '',
							'data-vw-video-modal-hide-prev': ''
						});
					}

					// Add the title and description
					$('[data-vw-video-modal-title]').html(content.title);
					$('[data-vw-video-modal-description]').html(content.description);

					var msg = content.twittermsg ? content.twittermsg : null;
					var img = content.fbimg ? content.fbimg : null;

					$videoModal.find('[data-vw-share]').each(function(){
						var share = socialShare($(this).attr('data-vw-share-target'), 'vid' + index, img, msg);
						$(this).attr('href', share);
					});

					var images = imageOptions(
						content['tile.img.mobile'] !== '' ? content['tile.img.mobile'] : false, 
						content['tile.img.tablet'] !== '' ? content['tile.img.tablet'] : false, 
						content['tile.img.desktop'] !== '' ? content['tile.img.desktop'] : false
					);

					var html = '<video controls class="gu-media gu-media--show-controls-at-start gu-media--video js-gu-media--enhance" preload="none" id="vw-interactive-main-video"';

						if ( images ){
							html += 'poster="' + images.default + '" data-vw-responsive-img data-vw-responsive-img-target="poster" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '"';
						} else {
							if ( DEBUG ){
								console.log('Info: POSTER attribute ommitted for VIDEO element of index ' + index + ' due to lack of image URLs.');
							}
						}

						html += '>';
						
						if ( content['video.m3u8'] ){
							html += '<source src="https://cdn.theguardian.tv/HLS/2016/07/05/070516obamahappybirthday.m3u8" type="video/m3u8"/>';
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/mainwebsite/2016/07/05/070516obamahappybirthday_desk.mp4" type="video/mp4"/>';
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://multimedia.guardianapis.com/interactivevideos/video.php?octopusid=11660445&amp;format=video/3gp&amp;maxwidth=700" type="video/3gp:small"/>';
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/3gp/large/2016/07/05/070516obamahappybirthday_large.3gp" type="video/3gp:large"/>';
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/webM/2016/07/05/070516obamahappybirthday_synd_768k_vp8.webm" type="video/webm"/>';
						}
						
						html += '<object type="application/x-shockwave-flash" data="https://assets.guim.co.uk/flash/components/mediaelement/7c5b6df9c2993d7ed62d87361c4651f6/flashmediaelement-cdn.swf" width="640" height="640">';
							html += '<param name="allowFullScreen" value="true"/>';
							html += '<param name="movie" value="https://assets.guim.co.uk/flash/components/mediaelement/f70092081235f698081e268fecea95e4/flashmediaelement.swf"/>';
							html += '<param name="flashvars" value="controls=true&file=https://cdn.theguardian.tv/mainwebsite/2016/07/05/070516obamahappybirthday_desk.mp4&poster=https://i.guim.co.uk/img/media/1e44490dee9f86b9ae86777a653c941ba64268de/0_153_3912_2348/3912.jpg?w=640&amp;h=360&amp;q=55&amp;auto=format&amp;usm=12&amp;fit=max&amp;s=0041a08eeed6b14444c38c6fc2ae676a"/>';
							
							if ( images ){
								html += '<img src="' + images.default + '" alt="" width="640" height="640" data-vw-responsive-img data-vw-responsive-img-target="src" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '" />';
							} else {
								if ( DEBUG ){
									console.log('Info: IMG element ommitted for VIDEO element of index ' + index + ' due to lack of image URLs.');
								}
							}

							html += '<div class="vjs-error-display">';
								html += '<div>Sorry, your browser is unable to play this video. <br/>Please install <a href="http://get.adobe.com/flashplayer/">Adobe Flash</a>™ and try again.	Alternatively <a href="http://whatbrowser.org/">upgrade</a> to a modern browser.</div>';
							html += '</div>';
						html += '</object>';
					html += '</video>';

					$videoWrapper.append(html);

					if ( !videojs ){
						if ( !window.videojs ){
							videojs = vjs;
						} else {
							// RELIES ON GUARDIAN.COM USING VIDEO JS
							videojs = window.videojs;
						}
					}

					videojs('#vw-interactive-main-video');

				} else {
					if ( DEBUG ){
						console.log('Error: The requested video content index was not found.');
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

				var images = imageOptions(
					content['tile.img.mobile'] !== '' ? content['tile.img.mobile'] : false, 
					content['tile.img.tablet'] !== '' ? content['tile.img.tablet'] : false, 
					content['tile.img.desktop'] !== '' ? content['tile.img.desktop'] : false
				);

				var html = '<!-- VIDEO TILE -->';
					html += '<div class="vw-video-tiles-item ' + style + '"';

						// Data attributes for the video modal
						if ( content.type !== 'placeholder' ){
							html += ' data-vw-video-index="' + index + '"';
						}

						html += ' data-vw-video-item';
						html += ' data-vw-video-id="' + content.id + '"';

					html +='>';

						if ( content.type === 'placeholder' ){
							html += '<div class="vw-video-tiles-item-inner inner">';
						} else {
							html += '<a href="#" class="vw-video-tiles-item-inner inner">';
						}

							html += '<figure class="vw-video-tiles-item-media">';

							if ( images ){
								html += '<img src="' + images.default + '" alt="" data-vw-responsive-img data-vw-responsive-img-target="src" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '" />';
							} else {
								if ( DEBUG ){
									console.log('Info: IMG element ommitted for video at index ' + index + ' due to lack of image URLs.');
								}
							}

							html += '</figure>';
							html += '<div class="vw-video-tiles-item-body">';
								html += '<h2>' + content.title + '</h2>';
								html += '<div class="vw-video-tiles-item-body-hover">';

								// Insert play button or coming soon text
								if ( content.type === 'placeholder' ){
									html += '<div class="vw-video-soon">coming soon</div>';
								} else {
									html += '<div class="vw-video-button-play"></div>';
									html += '<div class="vw-video-duration">' + content['video.duration'] + '</div>';
								}

								html += '</div>';
							html += '</div>';

						if ( content.type === 'placeholder' ){
							html += '</div>';
						} else {
							html += '</a>';
						}

					html += '</div>';
					html += '<!-- VIDEO TILE END -->';

				return html;
			}

			// Function: Article tile item
			function articleTile(content, index) {
				var images = imageOptions(
					content['tile.img.mobile'] !== '' ? content['tile.img.mobile'] : false, 
					content['tile.img.tablet'] !== '' ? content['tile.img.tablet'] : false, 
					content['tile.img.desktop'] !== '' ? content['tile.img.desktop'] : false
				);

				var html = '<!-- FOOTER ARTICLE ITEM -->';
					html += '<div class="vw-article-tiles-item">';
						html += '<a href="' + content.url + '" class="vw-article-tiles-item-inner inner">';
							html += '<figure class="vw-article-tiles-item-media">';
								
							if ( images ){
								html += '<img src="' + images.default + '" alt="" data-vw-responsive-img data-vw-responsive-img-target="src" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '" />';
							} else {
								if ( DEBUG ){
									console.log('Info: IMG element ommitted for article at index ' + index + ' due to lack of image URLs.');
								}
							}

							html += '</figure>';
							html += '<div class="vw-article-tiles-item-body">';
								html += '<h3>' + content.title + '</h3>';
							html += '</div>';
						html += '</a>';
					html += '</div>';
					html += '<!-- FOOTER ARTICLE ITEM END -->';

				return html;
			}

			// Function: Determines what images have been provided and makes them available
			function imageOptions(mobile, tablet, desktop) {
				var def, mob, tab, desk;

				// Mobile image
				if ( mobile ){
					mob = mobile;

					if ( !tablet ){
						tab = mobile;
					}

					if ( !desktop ){
						desk = mobile;
					}
				}

				// Tablet image
				if ( tablet ){
					tab = tablet;

					if ( !mobile ){
						mob = tablet;
					}

					if ( !desktop ){
						desk = tablet;
					}
				}

				// Desktop image
				if ( desktop ){
					desk = desktop;

					if ( !mobile ){
						mob = desktop;
					}

					if ( !tablet ){
						tab = desktop;
					}
				}

				// No images?
				if ( !mobile && !tablet && !desktop ){
					if ( DEBUG ){
						console.log('Error: No valid image URLs were provided to imageOptions.');
					}

					return false;
				}

				// Set default image
				if ( breakpoint === 'mobile' ){
					def = mob;
				} else if ( breakpoint === 'tablet' ){
					def = tab;
				} else if ( breakpoint === 'desktop' ){
					def = desk;
				}

				return {
					default: def,
					mobile: mob,
					tablet: tab,
					desktop: desk
				};
			}

			// Function: Load an image based on the current breakpoint size
			function responsiveImageSwitcher($this, target, mobile, tablet, desktop) {
				if ( breakpoint === 'mobile' ){
					$this.attr(target, mobile);
				} else if ( breakpoint === 'tablet' ){
					$this.attr(target, tablet);
				} else if ( breakpoint === 'desktop' ){
					$this.attr(target, desktop);
				} else {
					if ( DEBUG ){
						console.log('Error: An unknown breakpoint value was provided to responsiveImageSwitcher.');
					}
				}
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

				if ( DEBUG ){
					console.log('Info: AJAX request for asset ' + key + '.');
					console.log(request);
				}

				return request;
			}

			// Function: Share content on socila media
			function socialShare(target, item, img, msg) {
				var url = window.location.href;
				item = item ? '#' + item : '';

				if ( target === 'twitter' ){
					return 'https://twitter.com/intent/tweet?text=' + msg + '&url=' + url + item;
				} else if ( target === 'facebook' ){
					return 'https://www.facebook.com/dialog/share?app_id=180444840287&href=' + url + item + '&redirect_uri=' + url + item + '&picture=' + img;
				} else {
					// Failed
					if ( DEBUG ){
						console.log('Fatal Error: Unknown target for share link.');
					}
					console.log(DEBUG_msg);

					return '';
				}
			}

			// Function: Load the Facebook share count for the URL
			function loadShares() {
				//var url = 'https://graph.facebook.com/' + window.location.href;
				var url = 'https://graph.facebook.com/http://www.theguardian.com/australia-news/2016/jul/07/mediscare-campaign-didnt-worry-my-electorate-says-christopher-pyne';

				var request = $.ajax({
					method: "GET",
					url: url,
					cache: DEBUG ? false : true,
					dataType: "json"
				}).done(function( response ){
					// success
					if ( response ){
						$interactive.find('[data-vw-social-shares]').text(response.shares);
					} else {
						// Failed
						if ( DEBUG ){
							console.log('Fatal Error: A Facebook shares request contained no data.');
						}
						console.log(DEBUG_msg);
					}
				}).fail(function(error) {
					
					if ( DEBUG ){
						console.log('Fatal Error: An AJAX request for Facebook shares resulted in a ' + error.status + ' ' + error.statusText + ' error.');
					}
					console.log(DEBUG_msg);

				});
			}
		});
    }

    return {
        init: init
    };
});
