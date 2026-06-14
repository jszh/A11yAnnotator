(function (cjs, an) {

var p; // shortcut to reference prototypes
var lib={};var ss={};var img={};
lib.ssMetadata = [];


(lib.AnMovieClip = function(){
	this.actionFrames = [];
	this.ignorePause = false;
	this.gotoAndPlay = function(positionOrLabel){
		cjs.MovieClip.prototype.gotoAndPlay.call(this,positionOrLabel);
	}
	this.play = function(){
		cjs.MovieClip.prototype.play.call(this);
	}
	this.gotoAndStop = function(positionOrLabel){
		cjs.MovieClip.prototype.gotoAndStop.call(this,positionOrLabel);
	}
	this.stop = function(){
		cjs.MovieClip.prototype.stop.call(this);
	}
}).prototype = p = new cjs.MovieClip();
// symbols:



(lib.logo = function() {
	this.initialize(img.logo);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,1400,259);// helper functions:

function mc_symbol_clone() {
	var clone = this._cloneProps(new this.constructor(this.mode, this.startPosition, this.loop, this.reversed));
	clone.gotoAndStop(this.currentFrame);
	clone.paused = this.paused;
	clone.framerate = this.framerate;
	return clone;
}

function getMCSymbolPrototype(symbol, nominalBounds, frameBounds) {
	var prototype = cjs.extend(symbol, cjs.MovieClip);
	prototype.clone = mc_symbol_clone;
	prototype.nominalBounds = nominalBounds;
	prototype.frameBounds = frameBounds;
	return prototype;
	}


(lib.Symbol6 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.instance = new lib.logo();
	this.instance.setTransform(0,0,0.045,0.045);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Symbol6, new cjs.Rectangle(0,0,96,11.7), null);


(lib.ClipGroup = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("EhR5AC3IAAltMCjzAAAIAAFtg");
	mask.setTransform(524.15,18.275);

	// Layer_3
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#202F59").s().p("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");
	this.shape.setTransform(524.15,18.275);

	var maskedShapeInstanceList = [this.shape];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup, new cjs.Rectangle(0,0,1048.3,36.6), null);


(lib.ClipGroup_1 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2 (mask)
	var mask_1 = new cjs.Shape();
	mask_1._off = true;
	mask_1.graphics.p("EhChAEhIAApBMCFDAAAIAAJBg");
	mask_1.setTransform(425.8,28.925);

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("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");
	this.shape_1.setTransform(425.8,28.925);

	var maskedShapeInstanceList = [this.shape_1];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask_1;
	}

	this.timeline.addTween(cjs.Tween.get(this.shape_1).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup_1, new cjs.Rectangle(0,0,851.6,57.9), null);


(lib.ClipGroup_2 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_3
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AtMH5QhthDg7h7Qg7h7gBihIAAg2QAAikA7h9QA7h8BshDQBthECKAAQCKAABtBEQBsBCA8B9QA6B8AACkIAAAxQAAClg5B7Qg7B8hsBDQhsBDiLAAQiKAAhthCgAsJkjQg+BagBCtIAAA1QAACsA/BdQA+BdB2AAQBzABA+hbQA+hbAAitIAAg1QABivg/hbQg/hbh0AAQhzAAg/BagAScIsIAAxXIFXAAQCSAAB0BCQB0BCBBB6QBBB6AACbIAAAyQAACbhAB4QhAB5h0BDQh0BDiSAAgAWCF0IBuAAQCGAABIhYQBHhYACijIAAg6QgBiphGhYQhGhYiHABIhxAAgALMIsIm/rbIAALbIjlAAIAAxXIDlAAIG/LcIAArcIDkAAIAARXgA/uIsIAAxXIGGAAQDKAABpBOQBoBMAACXQAABRgqA/QgqA9hKAeQBVAUAxBCQAxBAAABeQAAChhmBSQhmBTi9ABgA8JF0IDFAAQBQAAAugmQAugoAAhDQAAiYifgDIjSAAgA8JhZICqAAQCtgDAAiIQAAhLgsghQgrgihfABIihAAg");
	this.shape_2.setTransform(342.15,73.65);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup_2, new cjs.Rectangle(139.1,16.5,406.19999999999993,114.30000000000001), null);


(lib.Symbol15 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.instance = new lib.ClipGroup_2();
	this.instance.setTransform(56.8,-376.7,0.269,0.2688,0,0,0,260,67.7);

	this.shape = new cjs.Shape();
	this.shape.graphics.f("#102C5B").s().p("AlnHpIEfnjIkVnuIGvAAIEWHuIkgHjg");
	this.shape.setTransform(-1.7,-375.1,0.4008,0.4006,0,0,0,-1.3,-1.4);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape},{t:this.instance}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Symbol15, new cjs.Rectangle(-15.6,-394.1,149.2,39.10000000000002), null);


(lib.Symbol14 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.instance = new lib.ClipGroup_1();
	this.instance.setTransform(589.6,-349.85,0.2466,0.2452,0,0,0,428.1,27.9);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Symbol14, new cjs.Rectangle(484.1,-356.7,210,14.199999999999989), null);


(lib.ClipGroup_3 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Isolation_Mode
	this.instance = new lib.ClipGroup();
	this.instance.setTransform(812.15,-31.05,1,1,0,0,0,524.1,18.2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup_3, new cjs.Rectangle(288.1,-49.2,1048.3000000000002,36.5), null);


// stage content:
(lib.index = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.actionFrames = [0,67];
	// timeline functions:
	this.frame_0 = function() {
		var _this = this;
		/*
		Mousing out of the specified symbol instance executes a function.
		'3' is the number of the times event should be triggered.
		*/
		//stage.enableMouseOver(3);
		_this.infobtn.on('click', function(){
		/*
		Play a Movie Clip/Video or the current timeline.
		Plays the specified movie clip or video.
		*/
		_this.popup.play();
		});
		
		var _this = this;
		
		_this.popup.closebtn.addEventListener("click", fl_MouseClickHandler.bind(this));
		
		function fl_MouseClickHandler()
		{
			// Start your custom code
			// This example code displays the words "Mouse clicked" in the Output panel.
			_this.popup.play();
			// End your custom code
		}
		
		_this.clickTag.addEventListener("click", fl_MouseClickTagHandler.bind(this));
		
		function fl_MouseClickTagHandler()
		{
			// Start your custom code
			// This example code displays the words "Mouse clicked" in the Output panel.
			window.open(window.clickTag);
			// End your custom code
		}
	}
	this.frame_67 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(67).call(this.frame_67).wait(1));

	// Layer_5
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#000000").ss(1,1,1).p("Eg43gHBMBxvAAAIAAODMhxvAAAg");
	this.shape.setTransform(363.975,45);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("rgba(2,45,94,0)").s().p("Eg43AHCIAAuDMBxvAAAIAAODg");
	this.shape_1.setTransform(363.975,45);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(68));

	// pimco_logo
	this.instance = new lib.Symbol6();
	this.instance.setTransform(61.85,70.4,1,1,0,0,0,48,5.4);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(68));

	// CTA
	this.instance_1 = new lib.Symbol14();
	this.instance_1.setTransform(150.8,434.4,1,1,0,0,0,122.4,13.1);
	this.instance_1.alpha = 0;
	this.instance_1._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(46).to({_off:false},0).to({alpha:1},21).wait(1));

	// mint
	this.instance_2 = new lib.Symbol15();
	this.instance_2.setTransform(138.15,432.25,1,1,0,0,0,110.4,31.1);
	this.instance_2.alpha = 0;
	this.instance_2._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_2).wait(25).to({_off:false},0).to({alpha:1},21,cjs.Ease.quadOut).wait(22));

	// line1
	this.instance_3 = new lib.ClipGroup_3();
	this.instance_3.setTransform(-265.1,64.95,0.5,0.5,0,0,0,134.1,43.7);

	this.timeline.addTween(cjs.Tween.get(this.instance_3).to({regX:134.2,x:105.9},24,cjs.Ease.quadOut).wait(44));

	// bluebg
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#022D5E").s().p("EhLxADDIAAmFMCXjAAAIAAGFg");
	this.shape_2.setTransform(485,71.125);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(68));

	// cyan
	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#5BC2E7").s().p("EhLxAEJIAAoRMCXjAAAIAAIRg");
	this.shape_3.setTransform(485,26.2);

	this.timeline.addTween(cjs.Tween.get(this.shape_3).wait(68));

	this._renderFirstFrame();

}).prototype = p = new lib.AnMovieClip();
p.nominalBounds = new cjs.Rectangle(98,44,872,556);
// library properties:
lib.properties = {
	id: '0AF1505BAAD44F06BF5CA03461C9BB3D',
	width: 728,
	height: 90,
	fps: 30,
	color: "#FFFFFF",
	opacity: 1.00,
	manifest: [
		{src:"images/logo.png?1753896981270", id:"logo"}
	],
	preloads: []
};



// bootstrap callback support:

(lib.Stage = function(canvas) {
	createjs.Stage.call(this, canvas);
}).prototype = p = new createjs.Stage();

p.setAutoPlay = function(autoPlay) {
	this.tickEnabled = autoPlay;
}
p.play = function() { this.tickEnabled = true; this.getChildAt(0).gotoAndPlay(this.getTimelinePosition()) }
p.stop = function(ms) { if(ms) this.seek(ms); this.tickEnabled = false; }
p.seek = function(ms) { this.tickEnabled = true; this.getChildAt(0).gotoAndStop(lib.properties.fps * ms / 1000); }
p.getDuration = function() { return this.getChildAt(0).totalFrames / lib.properties.fps * 1000; }

p.getTimelinePosition = function() { return this.getChildAt(0).currentFrame / lib.properties.fps * 1000; }

an.bootcompsLoaded = an.bootcompsLoaded || [];
if(!an.bootstrapListeners) {
	an.bootstrapListeners=[];
}

an.bootstrapCallback=function(fnCallback) {
	an.bootstrapListeners.push(fnCallback);
	if(an.bootcompsLoaded.length > 0) {
		for(var i=0; i<an.bootcompsLoaded.length; ++i) {
			fnCallback(an.bootcompsLoaded[i]);
		}
	}
};

an.compositions = an.compositions || {};
an.compositions['0AF1505BAAD44F06BF5CA03461C9BB3D'] = {
	getStage: function() { return exportRoot.stage; },
	getLibrary: function() { return lib; },
	getSpriteSheet: function() { return ss; },
	getImages: function() { return img; }
};

an.compositionLoaded = function(id) {
	an.bootcompsLoaded.push(id);
	for(var j=0; j<an.bootstrapListeners.length; j++) {
		an.bootstrapListeners[j](id);
	}
}

an.getComposition = function(id) {
	return an.compositions[id];
}


an.makeResponsive = function(isResp, respDim, isScale, scaleType, domContainers) {		
	var lastW, lastH, lastS=1;		
	window.addEventListener('resize', resizeCanvas);		
	resizeCanvas();		
	function resizeCanvas() {			
		var w = lib.properties.width, h = lib.properties.height;			
		var iw = window.innerWidth, ih=window.innerHeight;			
		var pRatio = window.devicePixelRatio || 1, xRatio=iw/w, yRatio=ih/h, sRatio=1;			
		if(isResp) {                
			if((respDim=='width'&&lastW==iw) || (respDim=='height'&&lastH==ih)) {                    
				sRatio = lastS;                
			}				
			else if(!isScale) {					
				if(iw<w || ih<h)						
					sRatio = Math.min(xRatio, yRatio);				
			}				
			else if(scaleType==1) {					
				sRatio = Math.min(xRatio, yRatio);				
			}				
			else if(scaleType==2) {					
				sRatio = Math.max(xRatio, yRatio);				
			}			
		}
		domContainers[0].width = w * pRatio * sRatio;			
		domContainers[0].height = h * pRatio * sRatio;
		domContainers.forEach(function(container) {				
			container.style.width = w * sRatio + 'px';				
			container.style.height = h * sRatio + 'px';			
		});
		stage.scaleX = pRatio*sRatio;			
		stage.scaleY = pRatio*sRatio;
		lastW = iw; lastH = ih; lastS = sRatio;            
		stage.tickOnUpdate = false;            
		stage.update();            
		stage.tickOnUpdate = true;		
	}
}
an.handleSoundStreamOnTick = function(event) {
	if(!event.paused){
		var stageChild = stage.getChildAt(0);
		if(!stageChild.paused || stageChild.ignorePause){
			stageChild.syncStreamSounds();
		}
	}
}
an.handleFilterCache = function(event) {
	if(!event.paused){
		var target = event.target;
		if(target){
			if(target.filterCacheList){
				for(var index = 0; index < target.filterCacheList.length ; index++){
					var cacheInst = target.filterCacheList[index];
					if((cacheInst.startFrame <= target.currentFrame) && (target.currentFrame <= cacheInst.endFrame)){
						cacheInst.instance.cache(cacheInst.x, cacheInst.y, cacheInst.w, cacheInst.h);
					}
				}
			}
		}
	}
}


})(createjs = createjs||{}, AdobeAn = AdobeAn||{});
var createjs, AdobeAn;