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

    function addScript(url) {
        var head = document.querySelector('head');
        var script = document.createElement('script');
        script.setAttribute('src', url);
        head.appendChild(script);
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
        	 * The data object is where the keys for the 3 mandatory and 1 optional Google Sheet to JSON data sources should be included.
        	 * The theme object is where
        	 *
        	 */
        	
            window.videoWall = {
            	config: {
            		DEBUG: true,
            		trackingLabel: 'Video Wall',
            		data: {
            			main: "1okuaX6Gem9z5Vd3VqFcGHzxS5k0DFMhf9Mp1qpQJXb4",
            			videos: "1322jBQ9h5wKPpfKAVGQSSh9d-EDBVvVx6M7O1c1-XNY",
            			articles: "1n0___pxSaKJ7y8qSBfOHSba3MeLhhXJBMDb6UBXEc3M",
            			paid: false
            		},
            		theme: {
            			scriptFile: "https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia.js",
            			cssFile: "@@assetPath@@/css/main-glabs.css"
            		},
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
        		addInlineScript('ga("create", "UA-78705427-1", "auto", "allEditorialPropertyTracker", {sampleRate: 100, siteSpeedSampleRate: 0.1, userId: null});');

        		if ( DEBUG ){
					console.log('Info: Google Analytics initialised in debug mode.');
				}
        	}

            // Load CSS
            if ( window.videoWall.config.theme.cssFile ){
				// Load Theme CSS
				addCSS(window.videoWall.config.theme.cssFile);

				if ( DEBUG ){
					console.log('Info: Theme CSS file "' + window.videoWall.config.theme.cssFile + '" loaded.');
				}
            } else {
            	addCSS('@@assetPath@@/css/main.css');
	            
	            if ( DEBUG ){
					console.log('Info: Main CSS file loaded.');
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

            // Load Script
            if ( window.videoWall.config.theme.scriptFile ){
            	// Load Theme Script
				addScript(window.videoWall.config.theme.scriptFile);

				if ( DEBUG ){
					console.log('Info: Theme Script file "' + window.videoWall.config.theme.scriptFile + '" loaded.');
				}
            }
        }
    };
});
