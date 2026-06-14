/**
 * This function initializes the navigation header. Instead of copy/paste the header in every page
 * it imports the header html from an external file. It also takes an an argument the id of the item
 * to be highlighted in the nav bar.
 */
function initPageHeader(selectedItem) {
    // Offline snapshot: header markup is already saved in the page.
    // Do not wipe it or fetch header.html (unavailable offline).
    if (selectedItem) {
        $(selectedItem).addClass('active');
    }
}

function initPageBody(filename) {
    $('#pagebody_container').load(filename, function (response, status, xhr) {
        if (status == "error") {
            var msg = "Sorry but there was an error: ";
            $("#error").html(msg + xhr.status + " " + xhr.statusText);
        } 
    });
}

function initPageFooter(nomap, callback) {
    // Offline snapshot: footer markup is already saved in the page.
    // Do not fetch footer.html (unavailable offline).
    if (nomap) {
        $('#map').remove();
    }
    if (callback !== undefined) {
        callback();
    }
}

function animateTitle(tag, numLetters) {
    var myVarI = setInterval(myTimerI, 20);
    var wordLength = [7];
    var curStates = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],[0,20]];
    var states = ["state-1", "state-2", "state-3"];
    function myTimerI() {    
        var randomLetterI = Math.floor(Math.random()*numLetters);
        
        var nthWord = $(tag).eq(0);
        var nthLetter = $(nthWord).children().eq(curStates[randomLetterI][1])
        var state = curStates[randomLetterI][0];
        if (state < 3 ){
            curStates[randomLetterI][0] += 1;
            if (curStates[randomLetterI][0] === 3) {
                curStates.splice(randomLetterI,1)
                numLetters -= 1;
            }

            $(nthLetter).addClass("state-"+(state+1));
        } 

        if (numLetters < 1){
            clearInterval(myVarI);
        }
    }
}

function filloutNews(news) {
    console.log(news)
    $("title").text(news.title + ' | MORSE Corp')
    $("#recentnewscontent h2").text(news.title);
    $("time").text(news.date);
    $("#newsimage").attr("src", news.image);
    $("#author").text(news.author);
    $("#duration").text(news.duration);
    news.content.forEach(elem => {
        $("#newscontent").append('<p>' + elem + '</p>');
    });
    
}

(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-60804363-1', 'auto');
ga('send', 'pageview');

// Fix to remove tooltip appearing when user hovers over items that have a <title> tag
// more specifically, when hovering over the capabilities and process graphics 
// happens on Safari and Firefox 
$(document).ready(function () {
    $('svg title').each(function () {
        $(this).empty();
    });
});
