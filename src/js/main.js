define([
    'text!templates/appTemplate.html',
    'jquery'
], function(
    templateHTML,
    $
) {
	'use strict';

	// Globals
	var gWH = 0;

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        // DOM template example
        el.innerHTML = templateHTML;
    }

    return {
        init: init
    };
});
