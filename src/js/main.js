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
			var $head = document.querySelector('head');
			var $body = $('body');
			var $interactive = $('[data-vw-interactive]');
			var $videoList = $('[data-vw-video-tiles]');
			var $articleList = $('[data-vw-article-tiles]');
			var $videoModal = $('[data-vw-video-modal]');
			var $videoWrapper = $('[data-vw-video-wrapper]');
			var $loading = $('[data-vw-loading-overlay]');
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
				$('[data-vw-interactive-copyright]').html(data.main.copyright);

				if ( DEBUG ){
					console.log('Info: General template content added.');
				}

				// Add sharing
				var msg = data.main.twittermsg ? data.main.twittermsg : null;
				var img = data.main.fbimg ? data.main.fbimg : null;

				$('[data-vw-share-global] [data-vw-share]').each(function(){
					var share = socialShare($(this).attr('data-vw-share-target'), null, img, msg);
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
				var articleCount = data.articles.length >= 4 ? 4 : data.articles.length;
				var articles = 0;

				for ( var a = 0; a < articleCount; a++ ){
					$articleList.append( articleTile(data.articles[a], a) );
					articles++;
				}

				if ( DEBUG ){
					console.log('Info: ' + articles + ' Article tiles added.');
				}

				// Add listeners
				addVideoWallListeners();

				if ( DEBUG ){
					console.log('Info: Event listeners activated.');
				}

				if ( startingVideo !== '' ){
					var index = startingVideo.split('vid');
					index = parseFloat(index[1]);

					if ( index !== NaN && index >= 0 && index <= lastIndex && data.videos[index].type !== 'placeholder' ){
						if ( DEBUG ){
							console.log('Info: Starting video detected, video modal initiated.');
						}

						toggleModal(true, index);
					}
				}

				// Remove loading overlay
				setTimeout(function(){
					$loading.fadeOut(600, function(){
						$(this).removeAttr('data-vw-loading');
					});

					if ( DEBUG ){
						console.log('Info: Loading overlay removed.');
					}
				}, 5000);
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
			}

			// Function: Toggle video modal visibility
			function toggleModal(state, index) {
				if ( state ){
					emptyModal();
					populateModal(index);
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
			function populateModal(index) {
				var content = data.videos[index];
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
						var share = socialShare($(this).attr('data-vw-share-target'), 'vid' + index, img, msg);
						$(this).attr('href', share);
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
							html += '<source src="https://cdn.theguardian.tv/HLS/2016/07/05/070516obamahappybirthday.m3u8" type="video/m3u8"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/m3u8 added to HTML.');
							}
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/mainwebsite/2016/07/05/070516obamahappybirthday_desk.mp4" type="video/mp4"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/mp4 added to HTML.');
							}
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://multimedia.guardianapis.com/interactivevideos/video.php?octopusid=11660445&amp;format=video/3gp&amp;maxwidth=700" type="video/3gp:small"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/3gp:small added to HTML.');
							}
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/3gp/large/2016/07/05/070516obamahappybirthday_large.3gp" type="video/3gp:large"/>';

							if ( DEBUG ){
								console.log('Info: Video format video/3gp:large added to HTML.');
							}
						}
						if ( content['video.mp4'] ){
							html += '<source src="https://cdn.theguardian.tv/webM/2016/07/05/070516obamahappybirthday_synd_768k_vp8.webm" type="video/webm"/>';

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
						console.log('Error: Unknown target for share link.');
					} else {
						console.log(DEBUG_msg);
					}

					return '';
				}
			}

			// Function: Load the Facebook share count for the URL
			function loadShares() {
				var url;

				url = 'https://graph.facebook.com/' + window.location.href;

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
					if ( response ){
						$interactive.find('[data-vw-social-shares]').text(response.shares);

						if ( DEBUG ){
							console.log('Info: A Facebook shares returned ' + response.shares + ' shares.');
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
		});
    }

    return {
        init: init
    };
});
