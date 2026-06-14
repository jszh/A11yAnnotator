function animateSlogan(title) {

	var l = Snap('#slogan');
	var p = l.select('path');

	setTimeout( function() {
		// modify this one line below, and see the result !
		var logoTitle = title;
		var logoRandom = '';
		var logoTitleContainer = l.text(0, '100%', '');
		var possible = ".";

        logoTitleContainer.attr({
			fill: '#fff',
            fontSize: '95px'
		});
        
		function generateRandomTitle(i, logoRandom) {
			setTimeout( function() {
				logoTitleContainer.attr({ text: logoRandom });
			}, i*50 );
		}

		for( var i=0; i < logoTitle.length+1; i++ ) {
			logoRandom = logoTitle.substr(0, i);
			for( var j=i; j < logoTitle.length; j++ ) { 
				logoRandom += possible.charAt(Math.floor(Math.random() * possible.length)); 
			}
			generateRandomTitle(i, logoRandom);
			logoRandom = '';
		}

	}, 500 );

}

function animateTitles(svgtag, title, speed=50) {

	var l = Snap(svgtag);
	var p = l.select('path');

	setTimeout( function() {
		// modify this one line below, and see the result !
		var logoTitle = title;
		var logoRandom = '';
		var logoTitleContainer = l.text(0, '100%', '');
		var possible = ".";

        logoTitleContainer.attr({
			fill: '#fff',
            fontSize: '95px'
		});
        
		function generateRandomTitle(i, logoRandom) {
			setTimeout( function() {
				logoTitleContainer.attr({ text: logoRandom });
			}, i*speed );
		}

		for( var i=0; i < logoTitle.length+1; i++ ) {
			logoRandom = logoTitle.substr(0, i);
			for( var j=i; j < logoTitle.length; j++ ) { 
				logoRandom += possible.charAt(Math.floor(Math.random() * possible.length)); 
			}
			generateRandomTitle(i, logoRandom);
			logoRandom = '';
		}

	}, 500 );

}

$(window).load(function () {
    $('body').removeClass('novisible').addClass('duration_0_3s fadeIn animated');
    $('#pagebody_container').removeClass('novisible').addClass('duration_0_5s delay_05 fadeIn animated');

    $('#capabilities h2').addClass('hidden');
    $('#capabilities p').addClass('hidden');
        
    // Animations for the "Capabilities" section
    $('#cap-dragon').addClass('hidden');
    $('#cap1').addClass('hidden');
    $('#cap2').addClass('hidden');
    $('#cap3').addClass('hidden');
    $('#cap4').addClass('hidden');
    $('#cap5').addClass('hidden');
    $('#cap6').addClass('hidden');
    $('#cap7').addClass('hidden');
    $('#cap8').addClass('hidden');

    $("#capabilitiescontent").waypoint(function () {
        
        $('#capabilities h2').addClass('duration_1s delay_05 fadeInUp animated');
        $('#capabilities p').addClass('duration_1s delay_07 fadeInUp animated');

        $('#cap-dragon').addClass('duration_1s delay_1 fadeInUp animated');
        
        $('#cap1').addClass('duration_1s delay_07 fadeInUp animated');
        $('#cap2').addClass('duration_1s delay_09 fadeInUp animated');
        $('#cap3').addClass('duration_1s delay_11 fadeInUp animated');
        $('#cap4').addClass('duration_1s delay_13 fadeInUp animated');
        
        $('#cap5').addClass('duration_1s delay_07 fadeInUp animated');
        $('#cap6').addClass('duration_1s delay_09 fadeInUp animated');
        $('#cap7').addClass('duration_1s delay_11 fadeInUp animated');
        $('#cap8').addClass('duration_1s delay_13 fadeInUp animated');
    }, {
        offset: '100%'
    });

    // Animations for the "News" section
    $('#companyNews h2').addClass('hidden');
    $('#companyNews time').addClass('hidden');
    $('#companyNews .newsContainer').addClass('hidden');
    $('iframe').addClass('hidden');

    $("#recentnewscontent").waypoint(function () {
        $('#companyNews h2').addClass('duration_1s delay_05 fadeInUp animated');
        $('#companyNews time').addClass('duration_1s delay_07 fadeInUp animated');
        $('#companyNews .newsContainer').addClass('duration_1s delay_07 fadeInUp animated');
        $('iframe').addClass('duration_1s delay_10 fadeIn animated');
        $('#companyNews .right-box-content').addClass('duration_1s delay_07 fadeIn animated');
    }, {
        offset: '100%'
    });

    // Animations for the bottom map section
    $("#map").waypoint(function () {
        $('#map').addClass('duration_1s delay_07 fadeIn animated');
    }, {
        offset: '100%'
    });

    // Animations for the "Our Process" section
    $('#ourProcess h2').addClass('hidden');
    $('#ourProcess p').addClass('hidden');

    $("#ourprocesscontent").waypoint(function () {
        $('#ourProcess h2').addClass('duration_1s delay_05 fadeInUp animated');
        $('#ourProcess p').addClass('duration_1s delay_07 fadeInUp animated');
    }, {
        offset: '100%'
    });

    // When the <g id='user'> becomes visible, animate the entrance of the graphics around it

    $('#understand').attr('class', 'hidden');
    $('#storyboard').attr('class', 'hidden');
    $('#math').attr('class', 'hidden');
    $('#design').attr('class', 'hidden');
    $('#test').attr('class', 'hidden');
    $('#deploy').attr('class', 'hidden');
    $('#user').attr('class', 'hidden');
    $('#arrow').attr('class', 'hidden');

    $('#user').waypoint(function () {
        $('#user').attr('class', 'duration_1s  fadeInUp animate');
        $('#arrow').attr('class', 'duration_1s  fadeInUp animate');
        setTimeout(()=>{
            $('#understand').attr('class', 'duration_1s fadeInUp animate');
            $('#storyboard').attr('class', 'duration_1_5s fadeInUp animate');
            $('#math').attr('class', 'duration_2s fadeInUp animate');
            $('#design').attr('class', 'duration_0_5s  fadeInUp animate');
            $('#test').attr('class', 'duration_1s  fadeInUp animate');
            $('#deploy').attr('class', 'duration_1_5s  fadeInUp animate');        
        }, 1000);
        

    }, {
        offset: '100%'
    });

    // Stuff for the 'our process' section
    $('#understand').on('mouseenter', function () {
        hidePopups();

        $('#arc1').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup1').attr('class', 'duration_2s fadeIn animate');
        }, 300);
    });

    $('#storyboard').on('mouseenter', function () {
        hidePopups();

        $('#arc2').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup2').attr('class', 'duration_2s fadeIn animate');
        }, 300);
    });

    $('#math').on('mouseenter', function () {
        hidePopups();

        $('#arc3').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup3').attr('class', 'duration_2s fadeIn animate');
        }, 300);

    });

    $('#design').on('mouseenter', function () {
        hidePopups();

        $('#arc4').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup4').attr('class', 'duration_2s fadeIn animate');
        }, 300);
    });

    $('#test').on('mouseenter', function () {
        hidePopups();

        $('#arc5').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup5').attr('class', 'duration_2s fadeIn animate');
        }, 300);
    });

    $('#deploy').on('mouseenter', function () {
        hidePopups();

        $('#arc6').attr('class', 'ringSelected duration_0_5s fadeIn animate');

        setTimeout(function () {
            $('#popup6').attr('class', 'duration_2s fadeIn animate');
        }, 300);
    });

    $('#understand').on('mouseleave', function () {
        hidePopups();
    });

    $('#storyboard').on('mouseleave', function () {
        hidePopups();
    });

    $('#math').on('mouseleave', function () {
        hidePopups();
    });

    $('#design').on('mouseleave', function () {
        hidePopups();
    });

    $('#test').on('mouseleave', function () {
        hidePopups();
    });

    $('#deploy').on('mouseleave', function () {
        hidePopups();
    });

    function hidePopups() {
        $('#popup1').attr('class', 'novisible');
        $('#popup2').attr('class', 'novisible');
        $('#popup3').attr('class', 'novisible');
        $('#popup4').attr('class', 'novisible');
        $('#popup5').attr('class', 'novisible');
        $('#popup6').attr('class', 'novisible');
        $('#arc1').attr('class', 'cls-1');
        $('#arc2').attr('class', 'cls-1');
        $('#arc3').attr('class', 'cls-1');
        $('#arc4').attr('class', 'cls-1');
        $('#arc5').attr('class', 'cls-1');
        $('#arc6').attr('class', 'cls-1');

    }

    function hideProcesses() {
        $('#understand').attr('class', 'novisible');
        $('#storyboard').attr('class', 'novisible');
        $('#math').attr('class', 'novisible');
        $('#design').attr('class', 'novisible');
        $('#test').attr('class', 'novisible');
        $('#deploy').attr('class', 'novisible');
    }

    hidePopups();

    hideProcesses();
    
    // This code sets up the swiper object that controls the display
    // of the video and images in the home page
    
    var mySwiper = new Swiper ('.swiper-container', {
    // Optional parameters
    loop: false,
    autoplay: {
        delay: 10000,
        disableOnInteraction: false
    },
    effect: "fade",
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    resizeReInit: true,

  on: {

    transitionStart: function(){
      var videos = document.querySelectorAll('video');
      Array.prototype.forEach.call(videos, function(video){
        video.pause();
      });
    },

    transitionEnd: function(){
      var activeIndex = this.activeIndex;
        // The first and 3rd 'slide' are videos, so play them when the swiper lands
        // on their corresponding slide
        if (activeIndex == 0 || activeIndex == 2){
          var activeSlide = document.getElementsByClassName('swiper-slide')[activeIndex];
          var activeSlideVideo = activeSlide.getElementsByTagName('video')[0];
          activeSlideVideo.play();
        }
    },
  }
})

});
