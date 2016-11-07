define([], function() {
    'use strict';
    
    function addCSS(url) {
        var head = document.querySelector('head');
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        head.appendChild(link);
    }

    function addInlineScript(script) {
        var head = document.querySelector('head');
        var el = document.createElement('script');
        el.innerHTML = script;
        head.appendChild(el);
    }

    return {
        boot: function(el, context, config, mediator) {

        	/*
        	 *
        	 * VIDEO WALL CONFIGURATION
        	 *
        	 * This is the place to customise some of the core aspects of the template.
        	 *
        	 * Set DEBUG to true show all debug console logging.
        	 * The data object is where the keys for the 3 mandatory Google Sheet to JSON data sources should be included.
        	 * The theme object is where
        	 *
        	 */
        	
            window.videoWall = {
            	config: {
            		DEBUG: false,
            		data: {
            			main: "12oi2Pm-Ef4XDWU_-Qjf1v0Al8LCdUdyv3Bl67YzfUB4",
            			videos: "1gOaGqIJT_IaUmNBImLvbT7xsWBzWrttr2nP27aJWfz8",
            			articles: "1kxMxJtznvgtg1SXehnME3IQLM4NDrZz9d7Zgjq9J1eU"
            		},
            		theme: false, /* {
            			cssFile: "https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia.css",
            			scriptFile: "https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia.js"
            		}, */
            		customHeader: {
            			cssFile: "https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia.css",
            			scriptFile: "https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia.js"
            		}
            	}
            };

            /*
        	 *
        	 * VIDEO WALL CONFIGURATION END
        	 *
        	 */

        	var DEBUG = window.videoWall.config.DEBUG;

        	// Load Google Analytics
        	if ( !window.ga && DEBUG ){
        		addInlineScript("(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics_debug.js','ga');");

        		if ( DEBUG ){
					console.log('Info: Google Analytics initialised in debug mode.');
				}
        	} else if ( !window.ga && !DEBUG ){
        		addInlineScript("(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');");

        		if ( DEBUG ){
					console.log('Info: Google Analytics initialised.');
				}
        	}
        	addInlineScript("ga('create', 'UA-50967074-3', 'auto', 'glabsau');");

            // Load Main CSS
            addCSS('@@assetPath@@/css/main.css');
            if ( DEBUG ){
				console.log('Info: Main CSS file loaded.');
			}

            if ( window.videoWall.config.theme.cssFile ){
				// Load Theme CSS
				addCSS(window.videoWall.config.theme.cssFile);

				if ( DEBUG ){
					console.log('Info: Theme CSS file "' + window.videoWall.config.theme.cssFile + '" loaded.');
				}
            }

            // Load main application
            require(['@@assetPath@@/js/main.js'], function(req){
                // Main app returns a almond instance of require to avoid
                // R2 / NGW inconsistencies.
                req(['main'], function(main) {
                    main.init(el, context, config, mediator);
                });
            }, 
            function(err){ 
            	console.error('Fatal Error: Boot failed to load.', err); 
            });
        }
    };
});
