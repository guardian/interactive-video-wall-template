define([
    'text!templates/appTemplate.html',
    'jquery'
], function(
    templateHTML,
    $,
    window
) {
	'use strict';

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        // DOM template example
        el.innerHTML = templateHTML;

        window.videojs('#vw-main-video');
    }

    return {
        init: init
    };
});
