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
        	// Interactive Config
            window.videoWall = {
            	config: {
            		DEBUG: true,
            		data: {
            			main: "1okuaX6Gem9z5Vd3VqFcGHzxS5k0DFMhf9Mp1qpQJXb4",
            			videos: "1322jBQ9h5wKPpfKAVGQSSh9d-EDBVvVx6M7O1c1-XNY",
            			articles: "1n0___pxSaKJ7y8qSBfOHSba3MeLhhXJBMDb6UBXEc3M"
            		},
            		customHeader: {
            			cssFile: "@@assetPath@@/custom/dearaustralia.css",
            			scriptFile: "@@assetPath@@/custom/dearaustralia.js"
            		}
            	}
            };

        	// Load Google Analytics
        	if ( !window.ga && window.videoWall.config.DEBUG ){
        		addInlineScript("(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics_debug.js','ga');");
        	} else if ( !window.ga && !window.videoWall.config.DEBUG ){
        		addInlineScript("(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');");
        	}
        	addInlineScript("ga('create', 'UA-50967074-3', 'auto', 'glabsau');");

            // Load Main CSS
            addCSS('@@assetPath@@/css/main.css');

            // Load main application
            require(['@@assetPath@@/js/main.js'], function(req){
                // Main app returns a almond instance of require to avoid
                // R2 / NGW inconsistencies.
                req(['main'], function(main) {
                    main.init(el, context, config, mediator);
                });
            }, 
            function(err){ 
            	console.error('Error loading boot.', err); 
            });
        }
    };
});
