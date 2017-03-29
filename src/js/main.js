define([
    'text!templates/appTemplate.html',
    'jquery',
    'lodash',
    'video',
    'object-fit-images'
], function(
    templateHTML,
    $,
    _,
    vjs,
    ofi
) {
	'use strict';

	function init(el, context, bootconfig, mediator) {
		// DEBUG: What we get given on boot
		console.log(el, context, bootconfig, mediator);

		// DOM template example
		el.innerHTML = templateHTML;
		el.setAttribute('data-vw-interactive', '');

		var isApp = location.href.indexOf('http') !== 0 ? 1 : 0;

		if ( isApp ){
			el.setAttribute('data-vw-interactive-show-scroll', '');
		}

		objectFitImages();

		$(document).ready(function(){
			// Global variables
			var config = window.videoWall.config;
			var DEBUG = window.videoWall.config.DEBUG;
			if ( DEBUG ){
				console.log('Info: Video Wall config:');
				console.log(config);
			}
			var DEBUG_msg = 'There was an error. Use DEBUG mode for more detail.';
			var DEBUG_msg_fatal = 'There was a fatal error. Use DEBUG mode for more detail.';
			if ( DEBUG ){
				console.log('Info: DEBUG mode active.');
			}
			var data = {};
			var $html = $('html');
			$html.attr('data-vw-interactive-loading', '');
			var $head = document.querySelector('head');
			var $body = $('body');
			var $interactive = $('[data-vw-interactive]');
			var $videoList = $('[data-vw-video-tiles]');
			var $articleList = $('[data-vw-article-tiles]');
			var $paidList = $('[data-vw-paid-tiles]');
			var hasPaid = false;
			var $videoModal = $('[data-vw-video-modal]');
			var $videoWrapper = $('[data-vw-video-wrapper]');
			var $loading = $('[data-vw-loading-overlay]');
			var $paidDropdown = $('#vw-articles-paid-about');
			var $player;
			var breakpoint = getBreakpoint();
			if ( DEBUG ){
				console.log('Info: Currently Active breakpoint: ' + breakpoint);
			}
			var videojs;
			var videoExists = false;
			if ( DEBUG ){
				console.log('Active breakpoint: ' + breakpoint);
			}
			var startingVideo = location.hash;

			// Load JSON data
			if ( config.data ){
				if ( config.data.paid ){
					var main = loadData(config.data.main);
					var videos = loadData(config.data.videos);
					var articles = loadData(config.data.articles);
					var paid = loadData(config.data.paid);

					hasPaid = true;
					
					// Data loaded?
					$.when( main, videos, articles, paid ).done(function( data_main, data_videos, data_articles, data_paid ){
						if ( data_main && data_videos && data_articles && data_paid ){

							// Success, initiate page build
							data.main = data_main[0].sheets.Sheet1[0];
							data.videos = _.sortBy(data_videos[0].sheets.Sheet1, ['order']);
							data.articles = _.sortBy(data_articles[0].sheets.Sheet1, ['order']);
							data.paid = _.sortBy(data_paid[0].sheets.Sheet1, ['order']);
							populateVideoWall();

						} else {
							
							// Failed
							if ( DEBUG ){
								console.log('Fatal Error: A data source request contained no data.');
							} else {
								console.log(DEBUG_msg_fatal);
							}

						}
					}).fail(function(error) {
						
						if ( DEBUG ){
							console.log('Fatal Error: An AJAX request resulted in a ' + error.status + ' ' + error.statusText + ' error.');
						} else {
							console.log(DEBUG_msg_fatal);
						}

					});
				} else {
					var main = loadData(config.data.main);
					var videos = loadData(config.data.videos);
					var articles = loadData(config.data.articles);
					
					// Data loaded?
					$.when( main, videos, articles ).done(function( data_main, data_videos, data_articles ){
						if ( data_main && data_videos && data_articles ){

							// Success, initiate page build
							data.main = data_main[0].sheets.Sheet1[0];
							data.videos = _.sortBy(data_videos[0].sheets.Sheet1, ['order']);
							data.articles = data_articles[0].sheets.Sheet1;
							populateVideoWall();

						} else {
							
							// Failed
							if ( DEBUG ){
								console.log('Fatal Error: A data source request contained no data.');
							} else {
								console.log(DEBUG_msg_fatal);
							}

						}
					}).fail(function(error) {
						
						if ( DEBUG ){
							console.log('Fatal Error: An AJAX request resulted in a ' + error.status + ' ' + error.statusText + ' error.');
						} else {
							console.log(DEBUG_msg_fatal);
						}

					});
				}
			}

			// Functions
			// Function: Build the Video wall interactive
			function populateVideoWall() {
				if ( config.theme.scriptFile ){
					var theme = document.createElement('script');
					theme.setAttribute('type', 'text/javascript');
					theme.setAttribute('src', config.theme.scriptFile);

					$head.appendChild(theme);

					if ( DEBUG ){
						console.log('Info: Theme JS file "' + config.theme.scriptFile + '" loaded.');
					}
				}

				if ( config.customHeader ){
					if ( DEBUG ){
						console.log('Info: Custom header configuration detected.');
					}
					
					if ( config.customHeader.cssFile ){
						var css = document.createElement('link');
						css.setAttribute('rel', 'stylesheet');
						css.setAttribute('type', 'text/css');
						css.setAttribute('href', config.customHeader.cssFile);
						
						$head.appendChild(css);

						if ( DEBUG ){
							console.log('Info: Custom header CSS file "' + config.customHeader.cssFile + '" loaded.');
						}
					}

					if ( config.customHeader.scriptFile ){
						var script = document.createElement('script');
						script.setAttribute('type', 'text/javascript');
						script.setAttribute('src', config.customHeader.scriptFile);

						$head.appendChild(script);

						if ( DEBUG ){
							console.log('Info: Custom header JS file "' + config.customHeader.scriptFile + '" loaded.');
						}
					}
				} else {
					if ( DEBUG ){
						console.log('Info: No Custom header configuration detected, loading default.');
					}

					var images = imageOptions(
						data.main['banner.img.mobile'] !== '' ? data.main['banner.img.mobile'] : false, 
						data.main['banner.img.tablet'] !== '' ? data.main['banner.img.tablet'] : false, 
						data.main['banner.img.desktop'] !== '' ? data.main['banner.img.desktop'] : false
					);

					$('[data-vw-interactive-banner-default]').attr({
						'src': images.default,
						'data-vw-responsive-img-mobile': images.mobile,
						'data-vw-responsive-img-tablet': images.tablet,
						'data-vw-responsive-img-desktop': images.desktop
					});
				}

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
				if ( hasPaid ){
					$('[data-vw-interactive-paidtitle]').html(data.main['paid.title']);
					$('[data-vw-interactive-paid-img]').attr({
						'src': data.main['paid.img'],
						'alt': data.main['paid.name']
					});
				}
				$('[data-vw-interactive-copyright]').html(data.main.copyright);

				if ( DEBUG ){
					console.log('Info: General template content added.');
				}

				// Add sharing
				var msg = data.main.twittermsg ? data.main.twittermsg : null;
				var img = data.main.fbimg ? data.main.fbimg : null;

				$('[data-vw-share-global] [data-vw-share]').each(function(){
					var share = socialShare($(this).attr('data-vw-share-target'), null, img, msg, data.main.sharelink);
					$(this).attr('href', share);
				});

				if ( DEBUG ){
					console.log('Info: Share functionality added.');
				}

				// Share count
				loadShares();

				if ( DEBUG ){
					console.log('Info: Latest Share count added.');
				}

				// Loop through and add the videos
				var videoCount = 0;
				var lastIndex;
				var lastId = 0;

				for ( var v = 0; v < data.videos.length; v++ ){
					if ( data.videos[v].type === 'featured' ){
						$videoList.attr('data-vw-video-tiles-featured', '');

						if ( DEBUG ){
							console.log('Info: Feature Video tile added.');
						}
					}

					if ( data.videos[v].type !== 'placeholder' ){
						videoCount++;
						lastIndex = v;
					} else {
						if ( DEBUG ){
							console.log('Info: Placeholder Video tile added.');
						}
					}

					if ( parseInt(data.videos[v].id) > lastId ){
						lastId = parseInt(data.videos[v].id);
					}

					$videoList.append( videoTile(data.videos[v], v) );
				}

				$videoList.attr({
					'data-vw-video-tiles-count': videoCount,
					'data-vw-video-tiles-last-index': lastIndex
				});

				if ( DEBUG ){
					console.log('Info: ' + videoCount + ' Video tiles added.');
				}

				// Loop through and add the articles
				if ( data.articles[0].id !== '-1' && data.articles.length > 0 ){
					var articleCount = data.articles.length >= 4 ? 4 : data.articles.length;
					var articles = 0;

					for ( var a = 0; a < articleCount; a++ ){
						$articleList.append( articleTile(data.articles[a], a) );
						articles++;
					}

					if ( DEBUG ){
						console.log('Info: ' + articles + ' Article tiles added.');
					}
				} else {
					$('#vw-articles-related').remove();

					if ( DEBUG ){
						console.log('Info: No articles provided.');
					}
				}

				// Loop through and add the paid articles
				if ( hasPaid ){
					if ( data.paid[0].id !== '-1' && data.paid.length > 0 ){
						var articleCount = data.paid.length >= 4 ? 4 : data.paid.length;
						var articles = 0;

						for ( var a = 0; a < articleCount; a++ ){
							$paidList.append( articleTile(data.paid[a], a) );
							articles++;
						}

						if ( DEBUG ){
							console.log('Info: ' + articles + ' Paid Article tiles added.');
						}
					} else {
						$('#vw-articles-paid').remove();

						if ( DEBUG ){
							console.log('Info: No paid articles provided.');
						}
					}
				} else {
					$('#vw-articles-paid').remove();
				}

				// Add listeners
				addVideoWallListeners();

				if ( DEBUG ){
					console.log('Info: Event listeners activated.');
				}

				if ( startingVideo !== '' ){
					var id = startingVideo.split('vid');
					var vid = _.find(data.videos, ['id', id[1].toString()]);
					id = parseFloat(id[1]);

					if ( id !== NaN && id > 0 && id <= lastId && vid && vid.type !== 'placeholder' ){
						if ( DEBUG ){
							console.log('Info: Starting video detected, video modal initiated.');
						}

						toggleModal(true, false, id);
					} else {
						if ( DEBUG ){
							console.log('Error: Starting video detected but ID not found.');
						}
					}
				}

				// Remove loading overlay
				setTimeout(function(){
					$html.removeAttr('data-vw-interactive-loading');
					setHeaderHeight();
					objectFitImages(null, {watchMQ: true});

					$loading.fadeOut(600, function(){
						$(this).removeAttr('data-vw-loading');
					});

					if ( DEBUG ){
						console.log('Info: Loading overlay removed.');
					}
				}, 1000);
			}

			function setHeaderHeight() {
				var adHeight = $('.top-banner-ad-container').outerHeight() >= 0 ? $('.top-banner-ad-container').outerHeight() : 0;
				var adBlockHeight = $('.adblock-sticky__message').outerHeight() >= 0 ? $('.adblock-sticky__message').outerHeight() : 0;
				var windowHeight = $(window).height();
				var bannerHeight = windowHeight - adHeight;

				$('[data-vw-interactive-banner]').css('height', bannerHeight);
				$('[data-vw-interactive-banner] > div').css('height', bannerHeight);
				$('[data-vw-interactive-banner] > div > figure').css('height', bannerHeight);
			}

			// Function: Add event listeners to the interactive
			function addVideoWallListeners() {
				// Listen for window size changes and change responsive images
				$(window).on('resize', _.debounce( function(){
					var newBreakpoint = getBreakpoint();

					if ( newBreakpoint !== breakpoint ){
						breakpoint = newBreakpoint;
						
						// emit breakpoint change event
						var event = new Event('vwBreakpointChange', {
							breakpoint: breakpoint
						});
						window.dispatchEvent(event);

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
							console.log('Info: Currently Active breakpoint: ' + breakpoint);
						}
					}

					setHeaderHeight();
				}, 200 ));

				// Listen for clicks on video item to launch modal
				$interactive.on('click', '[data-vw-video-item]', function(e){
					e.preventDefault();
					var index = $(this).attr('data-vw-video-index');

					if ( index ){
						toggleModal(true, parseFloat(index));
					}

					if ( DEBUG ){
						console.log('Info: video item at index ' + index + ' clicked.');
					}
				});

				// Listen for clicks on modal close button
				$interactive.on('click', '[data-vw-video-modal-close]', function(e){
					e.preventDefault();

					if ( DEBUG ){
						console.log('Info: Modal Close clicked.');
					}

					toggleModal(false);
				});

				// Listen for clicks on modal next button
				$interactive.on('click', '[data-vw-video-modal-next]', function(e){
					e.preventDefault();
					
					if ( DEBUG ){
						console.log('Info: Modal Next clicked.');
					}

					var index = $(this).attr('data-vw-video-modal-target');
					toggleModal(true, parseFloat(index));
				});

				// Listen for clicks on modal prev button
				$interactive.on('click', '[data-vw-video-modal-prev]', function(e){
					e.preventDefault();

					if ( DEBUG ){
						console.log('Info: Modal Prev clicked.');
					}

					var index = $(this).attr('data-vw-video-modal-target');
					toggleModal(true, parseFloat(index));
				});

				// Listen for clicks on modal SCROLL BUTTONS
				$interactive.on('click', '[data-vw-video-modal-scroll] a', function(e){
					e.preventDefault();
					
					if ( DEBUG ){
						console.log('Info: Modal Scroll clicked.');
					}

					var direction = $(this).data('direction');

					scrollModal(direction);
				});

				// Listen for mouseover on video element
				$interactive.on('mouseenter', '[data-vw-video-wrapper] > div', function(e){
					e.preventDefault();

					if ( DEBUG ){
						console.log('Info: User cursor over modal video.');
					}

					var timer;

					if ( breakpoint === 'mobile' ){
						$(this).addClass('vjs-mousemoved');

						timer = setTimeout(function(){
							$(this).removeClass('vjs-mousemoved');
						}, 2000);
					} else {
						$(this).addClass('vjs-mousemoved');

						$(this).on('mousemove', _.throttle( function(){
							clearTimeout(timer);
							$(this).addClass('vjs-mousemoved');

							timer = setTimeout(function(){
								$(this).removeClass('vjs-mousemoved');
							}, 2000);
						}, 100));
					}
				});

				// Show paid dropdown
				$interactive.on('click', '#vw-articles-paid-about-button', function(e){
					e.stopPropagation();
					toggleDropdown();
				});

				$(document).on('click', function(e){
					if ( $('body').hasClass('vw-paid-about-dropdown-open') ){
						toggleDropdown();
					}
				});
			}

			// Function: Toggle video modal visibility
			function toggleModal(state, index, id) {
				if ( state ){
					emptyModal();

					if ( id && !index ){
						populateModal(false, id);
					} else {
						populateModal(index);
					}

					$html.attr('data-vw-modal-active', '');

					if ( DEBUG ){
						console.log('Info: Open modal.');
					}
				} else {
					$html.removeAttr('data-vw-modal-active');
					emptyModal();

					if ( DEBUG ){
						console.log('Info: Close modal.');
					}
				}
			}

			function scrollModal(direction) {
				var top = $videoModal.scrollTop();

				if ( direction === 'down' ){
					$videoModal.scrollTop(top + 40);
				} else if ( direction === 'up' ){
					$videoModal.scrollTop(top - 40);
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

						if ( DEBUG ){
							console.log('Info: Videojs initialised.');
						}
					}

					$player.dispose();
					$player = null;
					$videoWrapper.empty();
					videoExists = false;

					if ( DEBUG ){
						console.log('Info: Modal Video destroyed.');
					}
				}
			}

			// Function: Toggle video modal visibility
			function populateModal(index, id) {
				var content;

				if ( id && !index ){
					index = parseFloat($videoList.find('[data-vw-video-id=' + id + ']').attr('data-vw-video-index'));
				 	content = _.find(data.videos, ['id', id.toString()]);
				} else {
					content = data.videos[index];
				}

				var lastIndex = parseFloat($videoList.attr('data-vw-video-tiles-last-index'));

				if ( content && ( index >= 0 || index <= lastIndex ) ){
					if ( DEBUG ){
						console.log('Info: Video at index ' + index + ' exists.');
					}

					videoExists = true;

					var $next = $videoModal.find('[data-vw-video-modal-next]');
					var $prev = $videoModal.find('[data-vw-video-modal-prev]');
					var firstIndex = parseFloat($videoList.find('[data-vw-video-item][data-vw-video-index]').eq(0).attr('data-vw-video-index'));
					var nextIndex = parseFloat($videoList.find('[data-vw-video-item]:eq(' + index + ')').nextAll('[data-vw-video-index]:first').attr('data-vw-video-index'));
					var prevIndex = parseFloat($videoList.find('[data-vw-video-item]:eq(' + index + ')').prevAll('[data-vw-video-index]:first').attr('data-vw-video-index'));

					$videoModal.removeAttr('data-vw-video-modal-hide-next');
					$videoModal.removeAttr('data-vw-video-modal-hide-prev');

					if ( index === lastIndex && index > firstIndex ){
						$videoModal.attr('data-vw-video-modal-hide-next', '');
						$prev.attr('data-vw-video-modal-target', prevIndex);
					} else if ( index === firstIndex && index < lastIndex ){
						$videoModal.attr('data-vw-video-modal-hide-prev', '');
						$next.attr('data-vw-video-modal-target', nextIndex);
					} else if ( index > firstIndex && index < lastIndex ){
						$next.attr('data-vw-video-modal-target', nextIndex);
						$prev.attr('data-vw-video-modal-target', prevIndex);
					} else {
						$videoModal.attr({
							'data-vw-video-modal-hide-next': '',
							'data-vw-video-modal-hide-prev': ''
						});
					}

					if ( DEBUG ){
						console.log('Info: Modal Prev/Next functionality added.');
					}

					// Add the title and description
					$('[data-vw-video-modal-title]').html(content.title);
					$('[data-vw-video-modal-description]').html(content.description);

					var msg = content.twittermsg ? content.twittermsg : null;
					var img = content.fbimg ? content.fbimg : null;

					$videoModal.find('[data-vw-share]').each(function(){
						var share = socialShare($(this).attr('data-vw-share-target'), 'vid' + index, img, msg, content.sharelink);
						if ( share ){
							$(this).attr('href', share);
						} else {
							$(this).parent().remove();
						}
					});

					if ( DEBUG ){
						console.log('Info: Modal Share functionality added.');
					}

					var images = imageOptions(
						content['tile.img.mobile'] !== '' ? content['tile.img.mobile'] : false, 
						content['tile.img.tablet'] !== '' ? content['tile.img.tablet'] : false, 
						content['tile.img.desktop'] !== '' ? content['tile.img.desktop'] : false
					);

					var html = '<video controls width="640" height="360" class="gu-media gu-media--show-controls-at-start gu-media--video js-gu-media--enhance" preload="none" id="vw-interactive-main-video"';

						if ( images ){
							html += 'poster="' + images.default + '" data-vw-responsive-img data-vw-responsive-img-target="poster" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '"';
						} else {
							if ( DEBUG ){
								console.log('Info: POSTER attribute ommitted for VIDEO element of index ' + index + ' due to lack of image URLs.');
							}
						}

						html += '>';
						
						if ( content['video.m3u8'] ){
							html += '<source src="' + content['video.m3u8'] + '" type="video/m3u8"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/m3u8 added to HTML.');
							}
						}
						if ( content['video.mp4'] ){
							html += '<source src="' + content['video.mp4'] + '" type="video/mp4"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/mp4 added to HTML.');
							}
						}
						if ( content['video.3gp.small'] ){
							html += '<source src="' + content['video.3gp.small'] + '" type="video/3gp:small"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/3gp:small added to HTML.');
							}
						}
						if ( content['video.3gp.large'] ){
							html += '<source src="' + content['video.3gp.large'] + '" type="video/3gp:large"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/3gp:large added to HTML.');
							}
						}
						if ( content['video.webm'] ){
							html += '<source src="' + content['video.webm'] + '" type="video/webm"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/webm added to HTML.');
							}
						}
						
						html += '<object type="application/x-shockwave-flash" data="https://assets.guim.co.uk/flash/components/mediaelement/7c5b6df9c2993d7ed62d87361c4651f6/flashmediaelement-cdn.swf" width="640" height="640">';
							html += '<param name="allowFullScreen" value="true"/>';
							html += '<param name="movie" value="https://assets.guim.co.uk/flash/components/mediaelement/f70092081235f698081e268fecea95e4/flashmediaelement.swf"/>';
							html += '<param name="flashvars" value="controls=true&file=https://cdn.theguardian.tv/mainwebsite/2016/07/05/070516obamahappybirthday_desk.mp4&poster=https://i.guim.co.uk/img/media/1e44490dee9f86b9ae86777a653c941ba64268de/0_153_3912_2348/3912.jpg?w=640&amp;h=360&amp;q=55&amp;auto=format&amp;usm=12&amp;fit=max&amp;s=0041a08eeed6b14444c38c6fc2ae676a"/>';
							
							if ( images ){
								html += '<img src="' + images.default + '" alt="" width="640" height="360" data-vw-responsive-img data-vw-responsive-img-target="src" data-vw-responsive-img-mobile="' + images.mobile + '" data-vw-responsive-img-tablet="' + images.tablet + '" data-vw-responsive-img-desktop="' + images.desktop + '" />';
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

					if ( DEBUG ){
						console.log('Info: Video HTML generated.');
					}

					$videoWrapper.append(html);

					if ( DEBUG ){
						console.log('Info: Video HTML added to modal.');
					}

					if ( !videojs ){
						if ( !window.videojs ){
							videojs = vjs;
						} else {
							// RELIES ON GUARDIAN.COM USING VIDEO JS
							videojs = window.videojs;
						}

						if ( DEBUG ){
							console.log('Info: Videojs initialised.');
						}
					}

					videojs.plugin('fullscreener', fullscreener);

					$player = videojs('#vw-interactive-main-video', {
						"controls": true,
						"textTrackDisplay": false,
						"textTrackSettings": false,
						"controlBar": {
							"children": [
								'playToggle',
								'currentTimeDisplay',
								'timeDivider',
								'durationDisplay',
								'progressControl',
								'fullscreenToggle',
								'volumeMenuButton'
							]
						},
						"autoplay": false,
						"preload": 'metadata'
					}, function(){
						if ( DEBUG ){
							console.log('Info: Videojs initialised on modal video.');
						}

						upgradeVideoPlayerAccessibility($player);
						$player.fullscreener();

						var vol = $player.volume();
						if (window.videoWall.config.initialVolume) {
							$player.volume(0);
							$player.volume(window.videoWall.config.initialVolume);
						} else {
							$player.volume(0);
							$player.volume(vol);
						}

						$player.on('volumechange', function(e){
							window.videoWall.config.initialVolume = $player.volume();
						});

						if ( DEBUG ){
							console.log('Info: Videojs enhancements and tweaks completed.');
						}
					});

				} else {
					if ( DEBUG ){
						console.log('Error: The requested video content at index ' + index + ' was not found.');
					} else {
						console.log(DEBUG_msg);
					}
				}
			}

			// Guardian Function: Making the video controls more accessible
			function upgradeVideoPlayerAccessibility(player) {
				// Set the video tech element to aria-hidden, and label the buttons in the videojs control bar.
				// It doesn't matter what kind of tech this is, flash or html5.
				$('.vjs-tech', player.el()).attr('aria-hidden', true);

				// Hide superfluous controls, and label useful buttons.
				$('.vjs-big-play-button', player.el()).attr('aria-hidden', true);
				$('.vjs-current-time', player.el()).attr('aria-hidden', true);
				$('.vjs-time-divider', player.el()).attr('aria-hidden', true);
				$('.vjs-duration', player.el()).attr('aria-hidden', true);
				$('.vjs-embed-button', player.el()).attr('aria-hidden', true);

				$('.vjs-play-control', player.el()).attr('aria-label', 'video play');
				$('.vjs-mute-control', player.el()).attr('aria-label', 'video mute');
				$('.vjs-fullscreen-control', player.el()).attr('aria-label', 'video fullscreen');

				if ( DEBUG ){
					console.log('Info: Video accessibility upgraded.');
				}
			}

			function fullscreener() {
				var player = this,
				clickbox = document.createElement('div'),
				events = {
					click: function (e) {
						if (this.paused()) {
							this.play();
						} else {
							this.pause();
						}
						e.preventDefault();

						if ( DEBUG ){
							console.log('Info: Video Fullscreener clicked.');
						}
					},
					dblclick: function (e) {
						e.preventDefault();
						if (this.isFullscreen()) {
							this.exitFullscreen();
						} else {
							this.requestFullscreen();
						}

						if ( DEBUG ){
							console.log('Info: Video Fullscreener double-clicked.');
						}
					}
				};

				clickbox.className = 'vjs-fullscreen-clickbox';
				$(player.el()).addClass('vjs').append(clickbox);

				$(clickbox).on('click', events.click.bind(player));
				$(clickbox).on('dblclick', events.dblclick.bind(player));
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

				if ( DEBUG ){
					console.log('Info: Video tile HTML generated.');
				}

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

				if ( DEBUG ){
					console.log('Info: Article tile HTML generated.');
				}

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
					} else {
						console.log(DEBUG_msg);
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

				if ( DEBUG ){
					console.log('Info: Responsive image options generated.');
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
					} else {
						console.log(DEBUG_msg);
					}
				}
			}

			// Function: Detect the current breakpoint
			function getBreakpoint() {
				var bp, width = window.innerWidth;

				if ( width < 740 ) {
					bp = 'mobile';
				} else if ( width >= 740 && width < 980 ) {
					bp = 'tablet';
				} else {
					bp = 'desktop';
				}

				window.videoWall.config.breakpoint = bp;

				return bp;
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
			function socialShare(target, item, img, msg, link) {
				if ( target === 'twitter' ){
					return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(msg) + '&url=' + encodeURIComponent(link);
				} else if ( target === 'facebook' ){
					if ( img ){
						return 'https://www.facebook.com/dialog/share?app_id=180444840287&href=' + encodeURIComponent(link) + '&redirect_uri=' + encodeURIComponent(link) + '&picture=' + encodeURIComponent(img);
					} else {
						return 'https://www.facebook.com/dialog/share?app_id=180444840287&href=' + encodeURIComponent(link) + '&redirect_uri=' + encodeURIComponent(link);
					}
				} else if ( target === 'linkedin' ){
					return 'http://www.linkedin.com/shareArticle?mini=true&title=' + encodeURIComponent(msg) + '&url=' + encodeURIComponent(link);
				} else {
					// Failed
					if ( DEBUG ){
						console.log('Error: Unknown target for share link.');
					} else {
						console.log(DEBUG_msg);
					}

					return false;
				}
			}

			// Function: Load the Facebook share count for the URL
			function loadShares() {
				var url;

				url = 'https://graph.facebook.com/' + encodeURIComponent(window.location.href);

				if ( DEBUG ){
					console.log('Info: Loading shares for: ' + url + '.');
				}

				var request = $.ajax({
					method: "GET",
					url: url,
					cache: DEBUG ? false : true,
					dataType: "json"
				}).done(function( response ){
					// success
					if ( response.share ){
						$interactive.find('[data-vw-social-shares]').text(response.share.share_count);

						if ( DEBUG ){
							console.log('Info: A Facebook shares returned ' + response.share.share_count + ' shares.');
						}
					} else {
						// Failed
						if ( DEBUG ){
							console.log('Error: A Facebook shares request contained no data.');
						} else {
							console.log(DEBUG_msg);
						}
					}
				}).fail(function(error) {
					
					if ( DEBUG ){
						console.log('Error: An AJAX request for Facebook shares resulted in a ' + error.status + ' ' + error.statusText + ' error.');
					} else {
						console.log(DEBUG_msg);
					}

				});
			}

			function toggleDropdown() {
				var $body = $('body');
				if ( $body.hasClass('vw-paid-about-dropdown-open') ){
					$body.removeClass('vw-paid-about-dropdown-open');
					$paidDropdown.find('#vw-articles-paid-about-button').attr('aria-expanded', false);
					$paidDropdown.find('#vw-articles-paid-about-dropdown').attr('aria-hidden', true);
				} else {
					$body.addClass('vw-paid-about-dropdown-open');
					$paidDropdown.find('#vw-articles-paid-about-button').attr('aria-expanded', true);
					$paidDropdown.find('#vw-articles-paid-about-dropdown').attr('aria-hidden', false);
				}
			}
		});
    }

    return {
        init: init
    };
});
