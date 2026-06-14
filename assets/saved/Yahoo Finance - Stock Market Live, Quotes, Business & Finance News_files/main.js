//Top level variables to store the instantAds object copy/dom elements/main holder/ad width/ad height/document/window/images loaded/requested/ and trackers for Timeout called and display ad called.
var clicked=false,iaObject={},dom={},main,feedItems=[],adWidth,adHeight,$d=document,$w=window,imagesRequested=0,imagesLoaded=0,timeoutcalled=false,displayAdCalled=false,feedFailed=false,preloadList=[],preloads=0,loadFinished=false;
var currentSlide=0,moving=false,carouselInterval,carouselElement,productsPerPage=2,totalProducts=6,adState=``;//carousel variables - can be removed if carousel is not used/needed.
var font_definitions=""; //".product_name|fonts/Avenir-Roman.woff||.product_price|fonts/Avenir-Black.woff||#intro_headline_txt,#frame2_cta_text|fonts/Avenir-Heavy.woff";
var activeFrames=[]; // Array to store which frames have content and should be shown
var countdownInterval; // Interval for countdown updates

$w.onload=function (){//MANDATORY_Basic Initialize No need to adjust code - this is for initialization ->processIAObject...
    //Get the main wrapper and set classes based on os-browser pairing (example: mac-safari)
    document.body.classList.add(checkPlatform()[0] + "-" + checkPlatform()[1]);
    myFT.on("richload", function (){
        myFT.on("instantads", function (){//On Richload,s how body,hide main, set width/height of ad vars, and process instant ads for cross var macros.
            $d.body.style.opacity=1,main=document.getElementById("container"),main.style.opacity=0;
            adWidth=myFT.manifestProperties.width,adHeight=myFT.manifestProperties.height;
            processIAObject();
        });
    });
}

function checkPlatform(){//MANDATORY_Check browser/user agent and return values assigned to the body class (used for browser specific style targeting).
    try{var a=new Array(),n=$w.navigator,ua=n.userAgent
        if(navigator.platform.toLowerCase().indexOf("mac")>-1){a[0]="macOS";
        }else if(navigator.platform.toLowerCase().indexOf("win")>-1){a[0]="$ws";
        }else{
            if (ua.match(/iPhone|iPad|iPod/i)){a[0]="iOS";}else if(ua.match(/Android/i)){a[0]="android";}
            else if(ua.match(/BlackBerry/i)){a[0]="BlackBerry";}else if(ua.match(/IEMobile/i)||ua.match(/WPDesktop/i)){a[0]="$wsPhone";}
        }
        var MSIE=ua.indexOf("MSIE "),Edge=ua.indexOf("Edge/"),Trdt=ua.indexOf("Trident/");
        if(ua.toLowerCase().indexOf("chrome")>-1){a[1]="chrome";}else if(ua.toLowerCase().indexOf("firefox")>-1){a[1]="firefox";}
        else if(n.vendor&&n.vendor.toLowerCase().indexOf("apple")>-1){a[1]="safari";}else if(MSIE>0||Edge>0||Trdt>0){a[1]="IE";}
        return a;
    } catch (error){}
}

function getElements(){//SUPPORTING_Grabs all elements in dom and returns an object with elements ID in simple node, while CLASSES are in arrays.
    var obj={},de=$d.querySelectorAll("*[id]"),ec=$d.querySelectorAll("*[class]");//Define Object and get all elements that have an ID or a CLASS
    for(var i=0;i<ec.length;i++){var ci=ec[i].classList;for(var c=0;c<ci.length;c++)obj[ci[c]]=obj[ci[c]]||$d.getElementsByClassName(ci[c])}//Loop through Classes creating arrays in the object
    for(var i=0;i<de.length;i++)obj[de[i].id]=de[i];//Loop through IDs creating dom objects in the master object.
    return obj //return the object.
}

function displayAd(){//ALL_IMAGES_LOADED_DISPLAY_AD ->setPreAnimateStyles ->animateAd
    if(!displayAdCalled){
        displayAdCalled=true;
        setPreAnimateStyles();
        setTimeout(function(){
            main.style.opacity=1;
            adState=document.body.innerHTML;
            animateAd();
        },500);
    }
}

function capitalize(s){//MANDATORY_Helps with the captilization part of the macro.
    var sa=s.split(" ");
    for(var i=0;i<sa.length;i++){sa[i]=sa[i].substr(0,1).toUpperCase()+sa[i].substr(1,sa[i].length)}
    return sa.join(" ");
}

function processIAObject(){//MANDATORY_iaObject builder + macro processing. ->feedLoad
    //Remapping styling variables:
    //myFT.instantAds.cta_wrapper_size_hex_xy = myFT.instantAds.CTA_txt_size_hex_xy;
    //delete myFT.instantAds.CTA_txt_size_hex_xy;
    myFT.instantAds.CTA_button_bghex = myFT.instantAds.CTA_button_hex; // Remap hex to background color for button
    
    // Extract XY from CTA_txt params and apply to button, keep size and hex for text
    var ctaParams = myFT.instantAds.CTA_txt_size_hex_xy.split("|");
    if(ctaParams.length >= 3) {
        myFT.instantAds.CTA_txt_size_hex = ctaParams[0] + "|" + ctaParams[1]; // size and hex for text
        myFT.instantAds.CTA_button_xy = ctaParams[2]; // xy position for button
        myFT.instantAds.CTA_txt_size_hex_xy = ctaParams[0] + "|" + ctaParams[1]; // Remove XY from text var
    }
    myFT.instantAds.frame_1_bg=myFT.instantAds.F1_bg_hex;
    myFT.instantAds.frame_2_bg=myFT.instantAds.F2_bg_hex;
    myFT.instantAds.frame_3_bg=myFT.instantAds.F3_bg_hex;
    myFT.instantAds.frame_4_bg=myFT.instantAds.F4_bg_hex;
    myFT.instantAds.F1_headline_txt_size_hex_xy=myFT.instantAds.F1_headlinetxt_size_hex_xy;
    myFT.instantAds.F2_headline_txt_size_hex_xy=myFT.instantAds.F2_headlinetxt_size_hex_xy;
    myFT.instantAds.F3_headline_txt_size_hex_xy=myFT.instantAds.F3_headlinetxt_size_hex_xy;
    myFT.instantAds.F4_headline_txt_size_hex_xy=myFT.instantAds.F4_headlinetxt_size_hex_xy;
    myFT.instantAds.F1_subheadline_txt_size_hex_xy=myFT.instantAds.F1_subheadlinetxt_size_hex_xy;
    myFT.instantAds.F2_subheadline_txt_size_hex_xy=myFT.instantAds.F2_subheadlinetxt_size_hex_xy;
    myFT.instantAds.F3_subheadline_txt_size_hex_xy=myFT.instantAds.F3_subheadlinetxt_size_hex_xy;
    myFT.instantAds.F4_subheadline_txt_size_hex_xy=myFT.instantAds.F4_subheadlinetxt_size_hex_xy;
    myFT.instantAds.store_details_size_hex_xy=myFT.instantAds.store_name_size_hex_xy;
    myFT.instantAds.store_name_size_hex_xy=myFT.instantAds.store_name_size_hex_xy;
    myFT.instantAds.store_address_size_hex_xy=myFT.instantAds.store_address_size_hex_xy;
    myFT.instantAds.store_distance_size_hex_xy=myFT.instantAds.store_distance_size_hex_xy;
    
    // Map countdown_start_xy to countdown_wrapper_contain_xy (the actual DOM element)
    if (myFT.instantAds.countdown_start_xy) {
        myFT.instantAds.countdown_wrapper_contain_xy = myFT.instantAds.countdown_start_xy;
    }
    myFT.instantAds.countdown_end_xy=myFT.instantAds.countdown_end_xy;

    // Apply countdown text color to countdown number elements
    myFT.instantAds.countdown_days_hex=myFT.instantAds.countdown_text_hex;
    myFT.instantAds.countdown_hours_hex=myFT.instantAds.countdown_text_hex;
    myFT.instantAds.countdown_minutes_hex=myFT.instantAds.countdown_text_hex;
    myFT.instantAds.countdown_seconds_hex=myFT.instantAds.countdown_text_hex;
    
    // Apply countdown_text_hex to labels as well
    myFT.instantAds.countdown_label_hex=myFT.instantAds.countdown_text_hex;
    
    // Apply countdown_box_hex to wrapper background
    myFT.instantAds.countdown_wrapper_bghex=myFT.instantAds.countdown_box_hex;

    iaObject=JSON.parse(JSON.stringify(myFT.instantAds));
    var macroHit=true;
    while(macroHit){
        macroHit=false;
        for(var n in iaObject){
            for(var s in iaObject){
                if(s!=n){
                    if(iaObject[n].indexOf("[#"+s+"#]")>-1){macroHit=true,iaObject[n]=iaObject[n].split("[#"+s+"#]").join(iaObject[s]);}
                    if(iaObject[n].indexOf("[U#"+s+"#]")>-1){macroHit=true,iaObject[n]=iaObject[n].split("[U#"+s+"#]").join(iaObject[s].toUpperCase());}
                    if(iaObject[n].indexOf("[L#"+s+"#]")>-1){macroHit=true,iaObject[n]=iaObject[n].split("[L#"+s+"#]").join(iaObject[s].toLowerCase());}
                    if(iaObject[n].indexOf("[C#"+s+"#]")>-1){macroHit=true,iaObject[n]=iaObject[n].split("[C#"+s+"#]").join(capitalize(iaObject[s]));}
                    if(iaObject[n].indexOf("[N#"+s+"#]")>-1){macroHit=true,iaObject[n]=iaObject[n].split("[N#"+s+"#]").join(iaObject[s].split(" ").join("&nbsp;"));}
                }
            }
        }
    }
    feedLoad();
}

function replayAd(){
    clearInterval(carouselInterval);
    clearInterval(countdownInterval);
    document.body.innerHTML=adState;
    dom=getElements();
    initializeCountdown();
    addInteractions();
    setTimeout(function(){animateAd()},250);
}

function feedLoad(){//MANDATORY_FUNCTION TO PREP AND CALL FEED LOADING -> feedSuccess / feedFail
    console.log(iaObject);
    feedFail();
}

function feedSuccess(stores){//MANDATORY_FEED SUCCESS - update as needed -> processFeedResponse -> runTrackings -> buildHTML
    runTrackings(true);
    buildHTML();
}

function feedFail(){//MANDATORY_FEED FAIL - update as needed. -> runTrackings -> buildHTML
    feedFailed=true,runTrackings(false), buildHTML()
}

function processFeedResponse(feedItem){//MANDATORY_HANDLE FEED RESPONSE - update as needed.
    var macroHit=true,macroOptions=["$","%"],mo=macroOptions;
    while(macroHit){
        macroHit=false;
        for(var m in mo){
            for(var n in iaObject){
                for (var s in feedItem){
                    if(s!=n){
                        if(iaObject[n].indexOf("["+mo[m]+s+mo[m]+"]")>-1)macroHit=true,iaObject[n]=iaObject[n].split("["+mo[m]+s+mo[m]+"]").join(feedItem[s]);
                        if(iaObject[n].indexOf("[U"+mo[m]+s+mo[m]+"]")>-1)macroHit=true,iaObject[n]=iaObject[n].split("[U"+mo[m]+s+mo[m]+"]").join(feedItem[s].toUpperCase());
                        if(iaObject[n].indexOf("[L"+mo[m]+s+mo[m]+"]")>-1)macroHit=true,iaObject[n]=iaObject[n].split("[L"+mo[m]+s+mo[m]+"]").join(feedItem[s].toLowerCase());
                        if(iaObject[n].indexOf("[C"+mo[m]+s+mo[m]+"]")>-1)macroHit=true,iaObject[n]=iaObject[n].split("[C"+mo[m]+s+mo[m]+"]").join(capitalize(feedItem[s]));
                        if(iaObject[n].indexOf("[N"+mo[m]+s+mo[m]+"]")>-1)macroHit=true,iaObject[n]=iaObject[n].split("[N"+mo[m]+s+mo[m]+"]").join(feedItem[s].split(" ").join("&nbsp;"));
                    }
                }
            }
        }
    }
}

function runTrackings(isFeedSuccess,id){//MANDATORY FOR STATE CALL TRACKING - update as needed.
    var trackingString=[];
    console.log(isFeedSuccess);
    if(isFeedSuccess)Tracker.impressionTrackEvent(id);
    if(!isFeedSuccess)myFT.tracker("feedFail");
}

function buildHTML(){//MANDATORY - populate all elements in dom - update as needed.
    dom=getElements();
    for(var n in dom){
        if(dom[n].length){
            for(var i=0;i<dom[n].length;i++){
                if(iaObject[n]&&dom[n][i].nodeName=="IMG"){preload(iaObject[n],"img",dom[n][i]);
                }else if(iaObject[n]&&dom[n].nodeName!="VIDEO"){dom[n][i].innerHTML=iaObject[n];}
            }
        }else{
            if(iaObject[n]&&dom[n].nodeName=="IMG"){preload(iaObject[n],"img",dom[n]);
            }else if(iaObject[n]){dom[n].innerHTML=iaObject[n];}
        }
    }
    applyFonts(font_definitions);
    setElementAttributes();
    
    // Hide CTA element if no text is present
    if (iaObject.CTA_txt === "" && dom.CTA_txt) {
        console.log("Hiding CTA");
        dom.CTA_txt.style.visibility = "hidden";
    }
    
    // Check which frames have content and should be shown
    detectActiveFrames();
    
    // Initialize countdown if variables are provided
    initializeCountdown();
    
    addInteractions();
}

function initializeCountdown(){
    // Check if countdown_start and countdown_end are provided
    if(!iaObject.countdown_end || iaObject.countdown_end.trim() === ""){
        // Hide countdown if no end date provided
        if(dom.countdown_wrapper){
            dom.countdown_wrapper.style.display = "none";
        }
        return;
    }
    
    // Check if we have a start date and if we're past it
    if(iaObject.countdown_start && iaObject.countdown_start.trim() !== ""){
        var startDate = new Date(iaObject.countdown_start);
        var now = new Date();
        
        // If countdown hasn't started yet, hide it
        if(now < startDate){
            if(dom.countdown_wrapper){
                dom.countdown_wrapper.style.display = "none";
            }
            return;
        }
    }
    
    // Keep countdown hidden initially - it will show only on F4
    if(dom.countdown_wrapper){
        dom.countdown_wrapper.style.display = "none";
    }
    
    // Start the countdown update
    updateCountdown();
    
    // Clear any existing interval
    if(countdownInterval){
        clearInterval(countdownInterval);
    }
    
    // Update countdown every second
    countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown(){
    if(!iaObject.countdown_end || iaObject.countdown_end.trim() === ""){
        return;
    }
    
    // Parse the end date (assuming format like "2025-12-31" or "12/31/2025")
    var endDate = new Date(iaObject.countdown_end);
    var now = new Date();
    
    // Calculate time difference in milliseconds
    var timeDiff = endDate - now;
    
    // If countdown is finished
    if(timeDiff <= 0){
        if(dom.countdown_days) dom.countdown_days.textContent = "00";
        if(dom.countdown_hours) dom.countdown_hours.textContent = "00";
        if(dom.countdown_minutes) dom.countdown_minutes.textContent = "00";
        if(dom.countdown_seconds) dom.countdown_seconds.textContent = "00";
        clearInterval(countdownInterval);
        return;
    }
    
    // Calculate days, hours, minutes, seconds
    var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    // Format with leading zeros
    var formatNumber = function(num){
        return num < 10 ? "0" + num : num.toString();
    };
    
    // Update DOM elements
    if(dom.countdown_days) dom.countdown_days.textContent = formatNumber(days);
    if(dom.countdown_hours) dom.countdown_hours.textContent = formatNumber(hours);
    if(dom.countdown_minutes) dom.countdown_minutes.textContent = formatNumber(minutes);
    if(dom.countdown_seconds) dom.countdown_seconds.textContent = formatNumber(seconds);
}

function detectActiveFrames(){
    // Check each frame (1-4) to see if it has valid content
    activeFrames = [];
    
    for(var i = 1; i <= 4; i++){
        var hasContent = false;
        
        // Check headline text
        var headlineText = iaObject["F"+i+"_headline_txt"] || "";
        var headlineImg = iaObject["F"+i+"_headline_img"] || "";
        
        // Check subheadline text
        var subheadlineText = iaObject["F"+i+"_subheadline_txt"] || "";
        var subheadlineImg = iaObject["F"+i+"_subheadline_img"] || "";
        
        // Check background image, video, and hex color
        var bgImg = iaObject["F"+i+"_bg_img"] || "";
        var bgVid = iaObject["F"+i+"_bg_vid"] || "";
        var bgHex = iaObject["F"+i+"_bg_hex"] || "";
        
        // Frame has content if any text exists or if images are not empty/1x1/blank
        if(headlineText.trim().length > 0 || subheadlineText.trim().length > 0){
            hasContent = true;
        }
        
        // Check if images/video/hex are valid (not 1x1.png or blank.png)
        if(!hasContent){
            var validMedia = false;
            if(headlineImg && headlineImg.indexOf("1x1.png") === -1 && headlineImg.indexOf("blank.png") === -1 && headlineImg.trim().length > 0){
                validMedia = true;
            }
            if(subheadlineImg && subheadlineImg.indexOf("1x1.png") === -1 && subheadlineImg.indexOf("blank.png") === -1 && subheadlineImg.trim().length > 0){
                validMedia = true;
            }
            if(bgImg && bgImg.indexOf("1x1.png") === -1 && bgImg.indexOf("blank.png") === -1 && bgImg.trim().length > 0){
                validMedia = true;
            }
            // Check for valid video
            if(bgVid && bgVid.indexOf("1x1") === -1 && bgVid.indexOf("blank") === -1 && bgVid.trim().length > 0){
                validMedia = true;
            }
            // Check for valid hex color
            if(bgHex && bgHex.trim().length > 0){
                validMedia = true;
            }
            hasContent = validMedia;
        }
        
        if(hasContent){
            activeFrames.push(i);
        } else {
            // Hide this frame if it has no content
            if(dom["frame_"+i]){
                dom["frame_"+i].style.display = "none";
            }
        }
    }
    
    // if we need to debug for active framses
    //console.log("Active frames:", activeFrames);
}

function setElementAttributes(){
    //Default Stylizing based on IA Var mapping.
    main.style.backgroundColor=iaObject.background_color||"#FFF",main.style.border=`1px solid ${iaObject.border_borderColor||"black"}`
    var elements=[],adElements=[];
    for(var n in dom){
        if(!dom[n].length){
            elements.push(dom[n]);
        }else{
            for(var i=0;i<dom[n].length;i++)elements.push(dom[n][i])
        }
    }
    stylize(elements);
    //Push any elements you want to be absolute positioned, sized to adWidth/adHeight, and positioned at 0,0
    adElements=document.getElementsByClassName("ad");
    stylize(adElements,"ad");
    
    // Apply background hex colors to frames when bg_img is not present
    for(var i = 1; i <= 4; i++){
        var bgImg = iaObject["F"+i+"_bg_img"] || "";
        var bgVid = iaObject["F"+i+"_bg_vid"] || "";
        var bgHex = iaObject["F"+i+"_bg_hex"] || "";
        
        // Check if bg_img is empty or is a blank/1x1 placeholder
        var hasValidBgImg = bgImg.trim().length > 0 && 
                           bgImg.indexOf("1x1.png") === -1 && 
                           bgImg.indexOf("blank.png") === -1 &&
                           bgImg.indexOf("1x1") === -1;
        var hasValidBgVid = bgVid.trim().length > 0 && 
                           bgVid.indexOf("1x1") === -1 && 
                           bgVid.indexOf("blank") === -1;
        
        // If we have a hex color and NO valid background image/video, apply hex to frame
        if(bgHex && !hasValidBgImg && !hasValidBgVid && dom["frame_"+i]){
            dom["frame_"+i].style.backgroundColor = bgHex;
            // Hide the bg_img element since we're using hex color instead
            if(dom["F"+i+"_bg_img"]){
                dom["F"+i+"_bg_img"].style.display = "none";
            }
            // Hide the bg_vid element since we're using hex color instead
            if(dom["F"+i+"_bg_vid"]){
                dom["F"+i+"_bg_vid"].style.display = "none";
            }
        }
    }
    //Extra Styling for click hotspot, main, border, background color etc.
}

function callPosition(s,v,d){//s=xy or xywh etc, v=values, d=domelement
    if(v==""||v=="0,0"||v=="0,0,0"||v=="0,0,0,0"||v=="center,0")return;
    var vals=v.split(","),types=s.split("");
    for(var i=0;i<vals.length;i++){
        if(types[i]=="x"||types[i]=="l")if(vals[i].indexOf("+")>-1){d.style.marginLeft=(parseInt(window.getComputedStyle(d).marginLeft)+Number(vals[i].split("+").join("")))+"px"}else{d.style.left=vals[i]+"px";d.style.position="absolute";}
        if(types[i]=="y"||types[i]=="t")if(vals[i].indexOf("+")>-1){d.style.marginTop=(parseInt(window.getComputedStyle(d).marginTop)+Number(vals[i].split("+").join("")))+"px"}else{d.style.top=vals[i]+"px";d.style.position="absolute";}
        if(types[i]=="b")if(vals[i].indexOf("+")>-1){d.style.marginBottom=(parseInt(window.getComputedStyle(d).marginBottom)+Number(vals[i].split("+").join("")))+"px"}else{d.style.bottom=vals[i]+"px";d.style.position="absolute";}
        if(types[i]=="w")d.style.width=vals[i]+"px";
        if(types[i]=="h")d.style.height=vals[i]+"px";
    }
}

function stylize(e,type){
    type=type||"normal";
    if(type!="ad"){
        var e=e||[];
        styleMap = {
            "size": "fontSize",                    "color": "color",                    "fgcolor": "color",
            "hex": "color",                        "bghex": "backgroundColor",          "fghex": "color",
            "bgcolor": "backgroundColor",          "align": "textAlign",                "xy": "left,top","XY":"left,top",
            "lb": "left,bottom",                   "xyw": "left,top,width",             "lbw": "left,bottom,width",
            "lt": "left,top",                      "ltw": "left,top,width",             "ltwh": "left,top,width,height",
            "lbwh": "left,bottom,width,height",    "xywh": "left,top,width,height",     "wh":"width,height",
            "background":"backgroundColor",        "font": "fontFamily",                "weight": "fontWeight",
            "topgap": "marginTop",                 "bottomgap": "marginBottom",         "leftgap": "marginLeft",
            "rightgap": "marginRight",             "bordercolor":"borderColor",         "letterspacing":"letterSpacing",
            "halign":"justifyContent",             "valign":"alignItems"
        },
        appends = {
            "size": "px",       "color": "",       "fgColor": "",    "bgColor": "",     "align": "",        "hex":"",
            "xy": "px",         "lb": "px",        "xyw": "px",      "lbw": "px",       "lt": "px",         "ltw": "px",
            "ltwh": "px",       "lbwh": "px",      "xywh": "px",     "hColor": "",      "hBgColor": "",     "lines": "",
            "font": "",         "weight": "",      "topGap": "px",   "bottomGap": "px", "leftGap": "px",    "rightGap": "px", 
            "valign":"",        "halign":"",       "pos": "px"
        }
        for (var i in e) {
            var ens = [],ecs = e[i].classList||[];
            if (e[i].id) ens.push(e[i].id);
            for (var c = 0; c < ecs.length; c++) ens.push(ecs[c]);
            for (var n = 0; n < ens.length; n++) {
                var ensval = ens[n];
                for (var v in iaObject) {
                    if (v.toUpperCase().indexOf(ensval.toUpperCase() + "_") > -1) {
                        var vals = (iaObject[v]||"").split("|");
                        var vars = (v.split(ensval + "_")[1]||"").split("_");
                        for (var vp = 0; vp < vals.length; vp++) {
                            if (vals[vp].length > 0) { //Actual Value Present
                                if (vars[vp] && vars[vp].length > 0) { //Actual Var Present
                                    if (styleMap[vars[vp].toLowerCase()]) {
                                        if ("xy,xywh,xyw,lb,lt,lbw,ltw,ltwh,lbwh".indexOf(vars[vp]) > -1){
                                            callPosition(vars[vp],vals[vp],e[i]);//Update that allows for absolute or relative positioning based on +/- in coordinates.
                                        } else if (styleMap[vars[vp]]&&styleMap[vars[vp]].indexOf("M:") == -1 && styleMap[vars[vp]].indexOf("H:") == -1) { //STANDARD
                                            var fs = styleMap[vars[vp]].split(","); //split the map by commas
                                            var fvs = vals[vp].split(","); //Match/split the values by commas
                                            for (var sn = 0; sn < fs.length; sn++) e[i].style[fs[sn]] = fvs[sn] + (appends[vars[vp]]); ////loop and set values based on appends
                                        } else if (styleMap[vars[vp]]&&styleMap[vars[vp]].indexOf("H:") > -1) { //HOVER
                                            document.head.appendChild(document.createElement("head")).innerHTML = ens[n] + ":hover{" + styleMap[vars[vp]].split("H:")[1] + ":" + vals[vp] + appends[vars[vp]] + "}" //SET HOVER STYLE
                                        } else if (styleMap[vars[vp]]&&styleMap[vars[vp]].indexOf("M:") > -1) { //FIRE MACRO FUNCTION AGAINST THE ELEMNT, with the prescribed value
                                            window[styleMap[vars[vp]].split("M:")[1]](e[i], vals[vp]);
                                        }
                                    }
                                } else {
                                    e[i].style[vals[vp].split(":")[0]] = vals[vp].split(":")[1];
                                }
                            }
                        }
                    }
                }
            }
        }
    }else{
        for(var i=0;i<e.length;i++)if(e[i])e[i].style.position="absolute",e[i].style.top=e[i].style.left="0px",e[i].style.width=adWidth+"px",e[i].style.height=adHeight+"px";
    }
    document.body.style.cursor="pointer";
}

function addInteractions(){ //Add background clicks for hotspots, CTAs, carousel interaction,
    dom=getElements();
    
    // Add hover interaction for Legal_txt to open legal overlay
    if (dom.Legal_txt) {
        dom.Legal_txt.addEventListener("mouseenter", function(e){
            openLegalOverlay();
        }, false);
    }
    
    // Add close button functionality
    if (dom.legalClose) {
        dom.legalClose.style.cursor = "pointer";
        dom.legalClose.addEventListener("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            closeLegalOverlay();
            return false;
        }, true); // Use capture phase for priority
    }
    
    // Prevent body click when clicking on legal overlay
    if (dom.legalOverlay_wrapper) {
        dom.legalOverlay_wrapper.addEventListener("click", function(e){
            e.stopPropagation();
        }, false);
    }
    
    document.body.addEventListener("click",function(e){
        if(clicked==false){
            clicked=true;
            
            myFT.clickTag(1,myFT.instantAds.ClickTag)
            setTimeout(function(){clicked=false;},100)
        }
    },false);
}

function openLegalOverlay(){
    if (dom.legalOverlay_wrapper) {
        dom.legalOverlay_wrapper.style.transform = "translateY(0px)";
    }
}

function closeLegalOverlay(){
    if (dom.legalOverlay_wrapper) {
        dom.legalOverlay_wrapper.style.transform = "translateY(" + adHeight + "px)";
    }
}

function productClick(n){
    if(clicked==false){
        clicked=true;
        Tracker.clickTrackEvent(feedItems[n].product_name);
        if(dom.frame_2.style.display=="block"){
            myFT.clickTag(n+3,feedItems[n].product_url)
        } else {
            myFT.clickTag(2,myFT.instantAds.feed_fail_click_url);
        }
        setTimeout(function(){clicked=false},100);
    }
}

function applyFonts(fd){//Sets fonts based on font definitions expectation of selectors|fontURL||selectors|fontURL||selectors|fontURL... etc.
    if(fd&&fd.length>0){fd=fd.split("||");for(var i in fd)preload(fd[i].split("|")[1],"font",fd[i].split("|")[0]);}
}

function setPreAnimateStyles() {
    dom = getElements();
    //Preset frames to hidden (first active frame will be shown by animation)
    for(var i=1;i<5;i++){
        if(dom["frame_"+i]){
            dom["frame_"+i].style.opacity="0";
        }
    }
    
    // Set up animations only for active frames
    for(var i=0;i<activeFrames.length;i++){
        var frameNum = activeFrames[i];
        
        // Headlines - slide from left to right (start at negative marginLeft)
        if(dom["F"+frameNum+"_headline_txt"]){
            dom["F"+frameNum+"_headline_txt"].style.opacity=0;
            dom["F"+frameNum+"_headline_txt"].style.marginLeft="-100px";
            dom["F"+frameNum+"_headline_txt"].style.transitionDuration=".5s";
            dom["F"+frameNum+"_headline_txt"].style.transitionTimingFunction="ease-out";
        }
        
        if(dom["F"+frameNum+"_headline_img"]){
            dom["F"+frameNum+"_headline_img"].style.opacity=0;
            dom["F"+frameNum+"_headline_img"].style.marginLeft="-100px";
            dom["F"+frameNum+"_headline_img"].style.transitionDuration=".5s";
            dom["F"+frameNum+"_headline_img"].style.transitionTimingFunction="ease-out";
        }
        
        // Subheadlines - fade in only (no sliding)
        if(dom["F"+frameNum+"_subheadline_txt"]){
            dom["F"+frameNum+"_subheadline_txt"].style.opacity=0;
            dom["F"+frameNum+"_subheadline_txt"].style.transitionDuration=".5s";
            dom["F"+frameNum+"_subheadline_txt"].style.transitionTimingFunction="ease-in";
        }
        
        if(dom["F"+frameNum+"_subheadline_img"]){
            dom["F"+frameNum+"_subheadline_img"].style.opacity=0;
            dom["F"+frameNum+"_subheadline_img"].style.transitionDuration=".5s";
            dom["F"+frameNum+"_subheadline_img"].style.transitionTimingFunction="ease-in";
        }
        
        // Devices - always visible (set to full opacity, no animation)
        if(dom["F"+frameNum+"_device_img"]){
            dom["F"+frameNum+"_device_img"].style.opacity=1;
            dom["F"+frameNum+"_device_img"].style.display="block";
        }
    }

    /*if (dom.CTA_txt) {
        dom.CTA_txt.style.opacity = "0";
        dom.CTA_txt.style.transitionDuration = ".5s";
        dom.CTA_txt.style.transitionTimingFunction = "ease-in";
    }*/
    if (dom.CTA_button) {
        dom.CTA_button.style.opacity = "0";
        dom.CTA_button.style.transitionDuration = ".5s";
        dom.CTA_button.style.transitionTimingFunction = "ease-in";
        dom.CTA_button.style.backgroundColor = iaObject.CTA_button_hex;
    }

    // Set countdown initial state - hidden, will fade in with CTA on F4
    if (dom.countdown_wrapper) {
        dom.countdown_wrapper.style.opacity = "0";
        dom.countdown_wrapper.style.display = "none";
        // Apply countdown box background color if provided
        if (iaObject.countdown_box_hex) {
            dom.countdown_wrapper.style.backgroundColor = iaObject.countdown_box_hex;
        }
    }

    if (dom.countdown_end) {
        dom.countdown_end.style.opacity = "0";
        dom.countdown_end.style.display = "none";
    }

    // Set logo initial state - hidden, will pop in first frame
    if (dom.LogoMain_img) {
        dom.LogoMain_img.style.opacity = "0";
        dom.LogoMain_img.style.transform = "scale(0.5)";
        dom.LogoMain_img.style.transitionDuration = ".3s";
        dom.LogoMain_img.style.transitionTimingFunction = "cubic-bezier(0.68, -0.55, 0.265, 1.55)"; // Pop effect
    }

    // Set Logo1_img initial state - hidden, centered, and scaled to 50% (independent of its intrinsic size)
    if (dom.Logo1_img) {
        dom.Logo1_img.style.opacity = "0";
        dom.Logo1_img.style.transitionDuration = ".5s";
        dom.Logo1_img.style.transitionTimingFunction = "ease-out";
        // Position Logo1_img absolutely to match LogoMain_img position
        // LogoMain_img is centered via LogoMain_wrapper, so we'll position Logo1_img similarly
        dom.Logo1_img.style.position = "absolute";
        // Center horizontally and vertically (matching LogoMain_wrapper behavior)
        dom.Logo1_img.style.left = "50%";
        dom.Logo1_img.style.top = "50%";
        // Center and ALWAYS scale to 50%
        dom.Logo1_img.style.transform = "translate(-50%, -50%) translateX(0px) scale(0.5)";
        // Let the browser keep aspect ratio; no fixed width/height so any asset size is halved visually
        dom.Logo1_img.style.width = "";
        dom.Logo1_img.style.height = "";
    }

    // Set video initial state - hidden, will pop in first frame
    if (dom.F1_bg_vid) {
        dom.F1_bg_vid.style.opacity = "0";
        // Pause video initially to prevent it from playing while hidden
        if (dom.F1_bg_vid.pause) {
            dom.F1_bg_vid.pause();
        }
    }

    // Set up legal overlay - hidden at bottom initially
    if (dom.legalOverlay_wrapper) {
        dom.legalOverlay_wrapper.style.position = "absolute";
        dom.legalOverlay_wrapper.style.left = "0px";
        dom.legalOverlay_wrapper.style.top = "0px";
        dom.legalOverlay_wrapper.style.width = adWidth + "px";
        dom.legalOverlay_wrapper.style.height = adHeight + "px";
        dom.legalOverlay_wrapper.style.transform = "translateY(" + adHeight + "px)";
        dom.legalOverlay_wrapper.style.transition = "transform .3s ease-out";
        dom.legalOverlay_wrapper.style.overflow = "auto";
        dom.legalOverlay_wrapper.style.zIndex = "1000";
    }
    
    // Set up close button with high z-index
    if (dom.legalClose) {
        dom.legalClose.style.position = "absolute";
        dom.legalClose.style.zIndex = "1001";
        dom.legalClose.style.pointerEvents = "auto";
    }
    
    // Make Legal_txt interactive (cursor pointer) for legal overlay
    if (dom.Legal_txt) {
        dom.Legal_txt.style.cursor = "pointer";
        dom.Legal_txt.style.pointerEvents = "auto";
        dom.Legal_txt.style.zIndex = "100";
        // Hide Legal_txt initially - it will only show on F4
        dom.Legal_txt.style.opacity = "0";
        dom.Legal_txt.style.display = "none";
    }
}

function calculateLogoPositionsVertical() {
    // Calculate dynamic vertical positions for logos based on their actual heights
    // Returns object with topOffset (for LogoMain) and bottomOffset (for Logo1)
    var logoMainHeight = 0;
    var logo1Height = 0;
    var gapBetweenLogos = 12; // Small constant vertical gap between logos (visual)

    // Get rendered heights
    if (dom.LogoMain_img) {
        var mainStyle = window.getComputedStyle(dom.LogoMain_img);
        var mainH = parseFloat(mainStyle.height);
        if (mainH && !isNaN(mainH)) {
            logoMainHeight = mainH;
        } else if (dom.LogoMain_img.complete && dom.LogoMain_img.naturalHeight) {
            logoMainHeight = dom.LogoMain_img.naturalHeight;
        }
    }

    if (dom.Logo1_img) {
        var logo1Style = window.getComputedStyle(dom.Logo1_img);
        var logo1H = parseFloat(logo1Style.height);
        if (logo1H && !isNaN(logo1H)) {
            logo1Height = logo1H;
        } else if (dom.Logo1_img.complete && dom.Logo1_img.naturalHeight) {
            logo1Height = dom.Logo1_img.naturalHeight;
        }
    }

    // Fallbacks if something went wrong
    if (!logoMainHeight) logoMainHeight = 108;
    if (!logo1Height) logo1Height = 108;

    // Apply visual scale factors when calculating spacing so the
    // distance between logos stays consistent regardless of Logo1 size.
    // LogoMain is shown at scale(1), Logo1 at scale(0.5).
    var logoMainEffectiveHeight = logoMainHeight;          // scale 1
    var logo1EffectiveHeight = logo1Height * 0.5;          // scale 0.5

    var centerY = adHeight / 2;

    // Total visual height needed for both logos plus the fixed gap
    var totalHeightNeeded = logoMainEffectiveHeight + gapBetweenLogos + logo1EffectiveHeight;

    // Center the logo stack vertically, with equal top/bottom margins
    var topMargin = (adHeight - totalHeightNeeded) / 2;
    if (topMargin < 0) topMargin = 0;

    // Absolute positions based on effective (visual) heights
    var logoMainTop = topMargin;
    var logoMainBottom = logoMainTop + logoMainEffectiveHeight;
    var logoMainCenterY = logoMainTop + logoMainEffectiveHeight / 2;

    var logo1Top = logoMainBottom + gapBetweenLogos;
    var logo1Bottom = logo1Top + logo1EffectiveHeight;
    var logo1CenterY = logo1Top + logo1EffectiveHeight / 2;

    // Offsets relative to ad center (logos start visually centered)
    var topOffset = logoMainCenterY - centerY;     // typically negative (up)
    var bottomOffset = logo1CenterY - centerY;     // positive (down)

    return {
        topOffset: Math.round(topOffset),
        bottomOffset: Math.round(bottomOffset)
    };
}

function animateAd(){
    // Dynamic animation based on active frames only
    if(activeFrames.length === 0) return; // No frames to show
    
    var frameDuration = 3000; // Each frame shows for 3 seconds
    var currentTime = 0;
    var isFirstFrame = true;
    
    // Animate each active frame
    for(var i = 0; i < activeFrames.length; i++){
        var frameNum = activeFrames[i];
        var isLastFrame = (i === activeFrames.length - 1);
        
        (function(frameNum, frameTime, isFirst, isLast){
            // Show headlines
            setTimeout(function(){
                dom["frame_"+frameNum].style.opacity="1";
                showElements([dom["F"+frameNum+"_headline_txt"],dom["F"+frameNum+"_headline_img"]]);
                
                // Show subheadlines after headlines
                setTimeout(function(){
                    var subElements = [dom["F"+frameNum+"_subheadline_txt"],dom["F"+frameNum+"_subheadline_img"]];
                    
                    // Add store details and CTA for last frame
                    if(isLast){
                        subElements.push(dom.store_address_1);
                        subElements.push(dom.store_address_2);
                    }
                    
                    showElements(subElements);
                    
                    if(isLast && dom.CTA_txt && iaObject.CTA_txt){
                        if (dom.CTA_button && iaObject.CTA_txt) {
                            dom.CTA_button.style.opacity = "1";
                            dom.CTA_button.style.position = "relative";
                        }
                        if (dom.CTA_img) {
                            dom.CTA_img.style.opacity = "1";
                        }
                    }
                    
                    // Show Legal_txt on last frame (F4)
                    if(isLast && dom.Legal_txt){
                        dom.Legal_txt.style.display = "block";
                        dom.Legal_txt.style.opacity = "1";
                    }
                    
                    // Show countdown if this is F4 and countdown is initialized (fade in with CTA)
                    if(frameNum === 4 && dom.countdown_wrapper && iaObject.countdown_end && iaObject.countdown_end.trim() !== ""){
                        var shouldShowCountdown = true;
                        if(iaObject.countdown_start && iaObject.countdown_start.trim() !== ""){
                            var startDate = new Date(iaObject.countdown_start);
                            var now = new Date();
                            if(now < startDate){
                                shouldShowCountdown = false;
                            }
                        }
                        
                        if(shouldShowCountdown){
                            dom.countdown_wrapper.style.display = "block";
                            setTimeout(function(){
                                dom.countdown_wrapper.style.opacity = "1";
                            }, 50);
                        }
                    }
                }, 800);
            }, frameTime);
            
            // Logo animation on first frame only
            if(isFirst){
                // Calculate dynamic vertical positions for logos
                var logoPositions = calculateLogoPositionsVertical();

                // Pop in logo
                setTimeout(function(){
                    if (dom.LogoMain_img) {
                        dom.LogoMain_img.style.opacity = "1";
                        dom.LogoMain_img.style.transform = "scale(1)";
                    }
                }, frameTime + 300);
                
                // After logo pops in, slide LogoMain_img up and Logo1_img down
                setTimeout(function(){
                    if (dom.LogoMain_img) {
                        // Update transition for sliding
                        dom.LogoMain_img.style.transitionDuration = ".5s";
                        dom.LogoMain_img.style.transitionTimingFunction = "ease-out";
                        // Slide LogoMain_img vertically based on dynamic position
                        dom.LogoMain_img.style.transform = "scale(1) translateY(" + logoPositions.topOffset + "px)";
                    }
                    if (dom.Logo1_img) {
                        // Reveal and slide Logo1_img vertically based on dynamic position
                        setTimeout(() => {dom.Logo1_img.style.opacity = "1"}, 100);
                        // Keep Logo1 at 50% scale during the slide
                        dom.Logo1_img.style.transform = "translate(-50%, -50%) translateY(" + logoPositions.bottomOffset + "px) scale(0.5)";
                    }
                }, frameTime + 600); // Start sliding 300ms after pop-in completes
                
                // Fade out logos
                setTimeout(function(){
                    if (dom.LogoMain_img) {
                        dom.LogoMain_img.style.transitionDuration = ".5s";
                        dom.LogoMain_img.style.transitionTimingFunction = "ease-out";
                        dom.LogoMain_img.style.opacity = "0";
                    }
                    if (dom.Logo1_img) {
                        dom.Logo1_img.style.transitionDuration = ".5s";
                        dom.Logo1_img.style.transitionTimingFunction = "ease-out";
                        dom.Logo1_img.style.opacity = "0";
                    }
                }, frameTime + 2500);

                // Pop in video (same as before)
                var video = iaObject["F1_bg_vid"] || "";
                var validVideo = false;
                if(video && video.indexOf("1x1") === -1 && video.indexOf("blank") === -1 && video.trim().length > 0){
                    validVideo = true;
                }

                if(validVideo){
                    setTimeout(function(){
                        if (dom.F1_bg_vid.currentTime !== undefined) {
                            dom.F1_bg_vid.currentTime = 0;
                        }
                        if (dom.F1_bg_vid.play) {
                            dom.F1_bg_vid.play();
                        }
                        dom.F1_bg_vid.style.opacity = "1";
                    }, frameTime + 300);
                    
                    setTimeout(function(){
                        dom.F1_bg_vid.style.transitionDuration = ".5s";
                        dom.F1_bg_vid.style.transitionTimingFunction = "ease-out";
                        dom.F1_bg_vid.style.opacity = "0";
                        if (dom.F1_bg_vid.pause) {
                            dom.F1_bg_vid.pause();
                        }
                    }, frameTime + 2500);
                } else {
                    if(dom["F1_bg_vid"]){
                        dom["F1_bg_vid"].style.display = "none";
                    }
                }
            }
            
            // Fade out content before next frame (unless it's the last frame)
            if(!isLast){
                setTimeout(function(){
                    hideElements([
                        dom["F"+frameNum+"_headline_txt"],
                        dom["F"+frameNum+"_headline_img"],
                        dom["F"+frameNum+"_subheadline_txt"],
                        dom["F"+frameNum+"_subheadline_img"]
                    ]);
                    
                    if(frameNum === 4 && dom.countdown_wrapper){
                        dom.countdown_wrapper.style.opacity = "0";
                        setTimeout(function(){
                            dom.countdown_wrapper.style.display = "none";
                        }, 500);
                    }
                }, frameTime + 2500);
            }
        })(frameNum, currentTime, isFirstFrame, isLastFrame);
        
        currentTime += frameDuration;
        isFirstFrame = false;
    }
}

function showElements(e){
    for(var i=0;i<e.length;i++){
        e[i].style.display="block";
        e[i].style.opacity=1;
        
        // Only reset margins for headline elements (they slide in)
        // Subheadlines and other elements just fade in without margin changes
        var elementId = e[i].id || '';
        if(elementId.indexOf('headline') > -1) {
            e[i].style.marginLeft=e[i].style.marginRight=e[i].style.marginTop=e[i].style.marginBottom="0px";
        }
    }
}

function hideElements(e){
    for(var i=0;i<e.length;i++){
        e[i].style.opacity=0;
    }
}

async function preload(file,responseType,d) {
    preloads++;
    const response = await fetch(file);const imageBlob=await response.blob();const reader=new FileReader();
    reader.readAsDataURL(imageBlob),reader.onloadend=()=>{
        const base64data=reader.result;preloadList.push({"file":file,"response":base64data,"responseType":responseType,"dom":d});
        if(preloadList.length==preloads&&!loadFinished){
            loadFinished=true;
            for(var i=0;i<preloadList.length;i++){
                var rt=preloadList[i].responseType,rs=preloadList[i].response,f=preloadList[i].file,dom=preloadList[i].dom;
                if(rt=="font"){
                    console.log(dom);
                    document.head.appendChild(document.createElement("style")).innerHTML=`
                    @font-face {
                        font-family: "${f.split("/").pop().split(".")[0]}";/*${"font url: "+f}*/
                        src: url("${rs}") format("woff");
                    }
                    ${dom}{font-family:"${f.split("/").pop().split(".")[0]}"}`
                }
                if(rt=="img")dom=(!dom?document.body.appendChild(document.createElement("img")):dom),dom.src=rs,dom.setAttribute("data-url",f);
                if(rt=="script")document.head.appendChild(document.createElement("script")).innerHTML=btoa(response.split(",")[1]);
                if(rt=="data"){//Detects if data should be used against dom var as svg img swap, for dom innerHTML, or for callback function.
                    dom=(!dom?document.body.appendChild(document.createElement("div")):dom);
                    if(dom.nodeName&&dom.nodeName=="IMG"){
                        var svgE=dom.parentElement.insertBefore(document.createElement("div"),dom),domId=dom.id||"img"+i,domClass=dom.className||"svgImg",dp=dom.parentElement,svgImg=dp.appendChild(svgE.getElementsByTagName("svg")[0]);
                        svgE.innerHTML=btoa(rs.split(",")[1]),dp.removeChild(dom);
                        svgImg.id=domId,svg.className=domClass,dp.removeChidl(svgE);
                    }
                    else if(dom.nodeName){dom.innerHTML=btoa(rs.split(",")[1])} //Dom is an element that needs response to be innerHTML
                    else if(!dom.nodeName){dom(btoa(rs.split(",")[1]))}//Dom is a callback function
                }
            }
            displayAd();
        }
    }
}