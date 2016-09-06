(function () {
	// The element in which the banner will be inserted
	// Leave as is unless targeting a different element
    var target = $("[data-vw-interactive-banner]");

    // Breakpoint
    var breakpoint = window.videoWall.config.breakpoint;

    // Insert Banner template
    target.empty().append( bannerTemplate( breakpoint ) );

    // Listen for breakpoint changes
    $(window).on('vwBreakpointChange', function(){
    	if ( window.videoWall.config.breakpoint !== breakpoint ){
    		breakpoint = window.videoWall.config.breakpoint;
    		target.empty().append( bannerTemplate( breakpoint ) );
    	}
    });
    
    // Generate Banner template
    function bannerTemplate(breakpoint){
	    var html;

		if ( breakpoint !== 'mobile' ){
			html = '<div data-vw-interactive-banner-insert class="vw-custom-banner" style="background-image:url(https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-banner-large.jpg)">';

			html += '<figure class="vw-custom-banner-media">'
				+ '<video autoplay="" muted="" loop="" poster="https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-banner-large.jpg">'
					+ '<source src="https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-video.mp4" type="video/mp4">'
					+ '<source src="https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-video.webm" type="video/webm">'
					+ '<img src="https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-banner-large.jpg">'
				+ '</video>'
			+ '</figure>';
		} else {
			html = '<div data-vw-interactive-banner-insert class="vw-custom-banner" style="background-image:url(https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-banner-small.jpg)">';
		}
			
			html += '<div class="vw-custom-banner-title">'
				+ '<div class="vw-container vw-container-constrained">'
					+ '<img src="https://interactive.guim.co.uk/2016/07/dear-australia/custom/dearaustralia-headline.png" alt="Dear Australia" />'
				+ '</div>'
			+ '</div>'
		+ '</div>';

		return html;
	}
})();