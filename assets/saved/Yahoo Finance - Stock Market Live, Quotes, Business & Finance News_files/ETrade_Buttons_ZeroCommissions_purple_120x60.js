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
// helper functions:

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


(lib.logo_star = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#6633CC").s().p("AgsB0IAwhVIhhAAIAAg9IBhAAIgwhVIA1gfIBVCSIhVCTg");
	this.shape.setTransform(9.4,14.725);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#187ABB").s().p("AhHBLIArhLIgrhKIAphIIA1AfIgwBVIBhAAIAAA9IhhAAIAwBVIg1Afg");
	this.shape_1.setTransform(23.175,14.725);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.logo_star, new cjs.Rectangle(0,0,30.4,29.5), null);


(lib.logo_ms = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// new
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AFRAnIACgHIAFACQABAAAAAAQABAAAAgBQABAAAAAAQABAAAAgBIADgFIABgEIgRgtIAJAAIANAjIALgjIAJAAIgTAzQgEAMgJAAQgGAAgCgCgAgmAkIACgGQAIAEAGAAQAMAAAAgNIAAgDQgGAFgGAAQgIAAgGgFQgFgGAAgMQAAgLAFgHQAGgFAIAAQAGAAAGAFIAAgEIAIAAIAAAtQAAAIgGAFQgFAFgJAAQgJAAgHgFgAgdgNQgEAFAAAIQAAAIAEAFQACAEAGAAQAFgBAGgEIAAgYQgGgEgFAAQgGAAgCADgAEsARQgGgGAAgLQAAgKAGgHQAFgGAIAAQAJAAAGAGQAEAGAAALIAAACIgeAAQABAPALAAQAIAAAEgIIAGAEQgGAKgMAAQgJAAgFgGgAFEgDQAAgNgLAAQgJAAgBANIAVAAIAAAAgAC6ATQgDgDAAgFQAAgLARgEIAKgCIAAgCQgBgIgIAAQgHAAgGAHIgFgFQAHgJAMAAQAHAAAEAEQAFAEgBAGIAAAWQAAABABAAQAAABAAAAQAAAAABABQAAAAABAAIACAAIAAAGIgDAAQgIAAgBgEQgHAFgHAAQgGAAgEgEgADJABQgKADAAAGQAAAHAHAAQAGAAAGgFIAAgMgAB0ATQgGgDgEgGIAIgEQAEAKAMAAQAMAAAAgJQAAgFgEgCQgDgCgIgCQgKgDgDgDQgFgEgBgHQAAgIAGgFQAFgEAJAAQAPAAAGANIgHAEQgEgKgKAAQgEAAgDACQgEACAAAFQAAAEAEADIAKADQALAEADADQAGAEAAAHQAAAIgHAFQgFAEgJAAQgIAAgGgEgAAIATQgEgDABgFQAAgLARgEIAJgCIAAgCQAAgIgIAAQgHAAgHAHIgEgFQAHgJAMAAQAHAAAEAEQAEAEAAAGIAAAWQAAABAAAAQAAABABAAQAAAAABABQAAAAABAAIABAAIAAAGIgDAAQgHAAgBgEQgHAFgHAAQgGAAgEgEgAAXABQgKADAAAGQgBAHAIAAQAFAAAGgFIAAgMgAhtARQgFgGAAgLQAAgKAFgHQAFgGAKAAQAJAAAFAGQAGAHAAAKQAAALgGAGQgFAGgJAAQgKAAgFgGgAhmgMQgEAEAAAIQAAARAMAAQAMAAAAgRQAAgQgMAAQgGAAgCAEgAk5ARQgGgGABgLQgBgLAGgGQAFgGAKAAQAJAAAFAGQAGAGgBALQABALgGAGQgFAGgJAAQgKAAgFgGgAkzgMQgDAEAAAIQAAARAMAAQALAAAAgRQAAgQgLAAQgFAAgEAEgAETANIAAgyIAIAAIAAAxQAAAEAEAAIADgBIAAAHIgEAAQgLAAAAgJgAEAAWIAAgfQAAgHgHAAQgHAAgEAFIAAAhIgJAAIAAgsIAJAAIAAAFQAFgGAIAAQAGAAADAEQAEAEAAAGIAAAfgAChANIAAgcIgIAAIAAgHIAIAAIAAgMIAIAAIAAAMIAJAAIAAAHIgJAAIAAAbQAAAEAFAAIAEAAIAAAGIgGAAQgLAAAAgJgABOAWIAAgfQAAgHgIAAQgFAAgGAFIAAAhIgIAAIAAgsIAIAAIAAAFQAGgGAHAAQAHAAADAEQAEAEAAAGIAAAfgAhBAWIAAgsIAIAAIAAAHQAFgIAGAAIADAAIAAAIIgDAAQgGAAgFAIIAAAdgAiDAWIAAg0IgQA0IgHAAIgQg0IAAA0IgIAAIAAg7IAPAAIANAsIANgsIAOAAIAAA7gAjZAWIAAgeQABgIgJAAQgEAAgEAEQgCAEAAAHIAAAXIgJAAIAAgeQAAgIgHAAQgFAAgDAEQgDAEAAAHIAAAXIgJAAIAAgsIAJAAIAAAEQAFgFAHAAQAJAAAEAIQAFgIAIAAQAHAAAEAEQAEAEABAGIAAAfgAlYAWIAAgsIAIAAIAAAHQAFgIAHAAIACAAIAAAIIgCAAQgHAAgFAIIAAAdgAlxAWIAAglIgHAAIAAgHIAHAAIAAgDQABgHADgEQAEgEAFAAIAEABIAAAHIAAAAIgCAAQgHAAAAAGIAAAEIAJAAIAAAHIgJAAIAAAlg");
	this.shape.setTransform(36.15,3.8,1,1,0,0,0,-0.1,0);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.logo_ms, new cjs.Rectangle(-1.4,-0.2,75.4,8.299999999999999), null);


(lib.copy2a = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AgDAiQgEgEAAgHIAAgmIgJAAIAAgJIAJAAIAAgOIAJAAIAAAOIAPAAIAAAJIgPAAIAAAlQAAAIAIABQAEgBADgBIAAAJQgDABgFAAQgIAAgEgFg");
	this.shape.setTransform(105.525,8);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_1.setTransform(100.075,8.6);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AgTAaQgGgGAAgMIAAgnIAKAAIAAAmQAAAQAPABQAGgBAFgEQAFgFAAgHIAAgmIAKAAIAAA+IgKAAIAAgKQgCAFgFADQgGADgGAAQgKAAgGgGg");
	this.shape_2.setTransform(92.975,8.7);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_3.setTransform(85.975,8.65);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AgUAYQgIgJAAgOIAAgBQAAgNAJgJQAIgKANABQAKgBAHAGQAIAGACAKIgKAAQgCgNgPAAQgIAAgGAHQgGAGAAAKIAAABQAAALAGAHQAGAFAIAAQAHAAAFgDQAFgEABgIIAJAAQgBALgHAGQgIAGgLAAQgNAAgJgIg");
	this.shape_4.setTransform(79.1,8.65);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAJgJQAJgKALABQALgBAHAGQAIAGABAKIgJAAQgDgNgPAAQgIAAgFAHQgGAGAAAKIAAABQAAALAGAHQAFAFAIAAQAIAAAEgDQAGgEABgIIAJAAQgBALgIAGQgHAGgMAAQgMAAgIgIg");
	this.shape_5.setTransform(72.4,8.65);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AgSAcQgGgFAAgJQAAgKAJgEQAJgEAMAAIAJAAIAAgFQAAgHgDgEQgDgDgHAAQgMAAgCALIgKAAQABgKAIgFQAGgEAJAAQAXgBAAAXIAAAoIgKAAIAAgIQgHAKgLgBQgKABgFgFgAgOAOQAAAKAMAAQAHAAAFgDQAFgEAAgHIAAgIIgJAAQgUAAAAAMg");
	this.shape_6.setTransform(65.625,8.65);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_7.setTransform(56.125,8.6);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AgSAcQgGgFAAgJQAAgKAJgEQAJgEAMAAIAJAAIAAgFQAAgHgDgEQgDgDgHAAQgMAAgCALIgKAAQABgKAIgFQAGgEAJAAQAXgBAAAXIAAAoIgKAAIAAgIQgHAKgLgBQgKABgFgFgAgOAOQAAAKAMAAQAHAAAFgDQAFgEAAgHIAAgIIgJAAQgUAAAAAMg");
	this.shape_8.setTransform(49.175,8.65);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_9.setTransform(39.675,8.6);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAIgJQAJgKAMABQAMAAAHAHQAJAIAAAQIAAACIgvAAQABAWATAAQAOAAACgLIAKAAQgBAJgIAGQgHAEgLAAQgMAAgIgIgAATgFQgCgSgQAAQgHAAgFAFQgFAFgBAIIAkAAIAAAAg");
	this.shape_10.setTransform(32.775,8.65);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FFFFFF").s().p("AgdArIAAhUIAKAAIAAALQADgFAGgDQAFgEAHAAQAMAAAHAIQAJAKAAAOIAAAAQAAAOgIAJQgIAJgMAAQgOAAgHgMIAAAhgAgOgcQgFAHAAALIAAABQAAALAFAGQAGAGAJAAQASAAABgXIAAgBQgBgLgFgHQgGgFgIgBQgIABgGAFg");
	this.shape_11.setTransform(25.95,9.7);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#FFFFFF").s().p("AgdAfQgMgMAAgSIAAgBQAAgSAMgMQALgNATAAQASAAAMANQALAMAAASIAAABQAAASgLAMQgMANgSAAQgSAAgMgNgAgWgYQgIAJAAAPIAAABQAAAPAJAKQAJAKANAAQAOgBAIgJQAIgKAAgPIAAgBQABgOgJgKQgIgLgOABQgOgBgJALg");
	this.shape_12.setTransform(17.2,7.5);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_1
	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#241056").s().p("AgDAiQgEgEAAgHIAAgmIgJAAIAAgJIAJAAIAAgOIAJAAIAAAOIAPAAIAAAJIgPAAIAAAlQAAAIAIABQAEgBADgBIAAAJQgDABgFAAQgIAAgEgFg");
	this.shape_13.setTransform(105.525,8);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#241056").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_14.setTransform(100.075,8.6);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#241056").s().p("AgTAaQgGgGAAgMIAAgnIAKAAIAAAmQAAAQAPABQAGgBAFgEQAFgFAAgHIAAgmIAKAAIAAA+IgKAAIAAgKQgCAFgFADQgGADgGAAQgKAAgGgGg");
	this.shape_15.setTransform(92.975,8.7);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#241056").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_16.setTransform(85.975,8.65);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f("#241056").s().p("AgUAYQgIgJAAgOIAAgBQAAgNAJgJQAIgKANABQAKgBAHAGQAIAGACAKIgKAAQgCgNgPAAQgIAAgGAHQgGAGAAAKIAAABQAAALAGAHQAGAFAIAAQAHAAAFgDQAFgEABgIIAJAAQgBALgHAGQgIAGgLAAQgNAAgJgIg");
	this.shape_17.setTransform(79.1,8.65);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#241056").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAJgJQAJgKALABQALgBAHAGQAIAGABAKIgJAAQgDgNgPAAQgIAAgFAHQgGAGAAAKIAAABQAAALAGAHQAFAFAIAAQAIAAAEgDQAGgEABgIIAJAAQgBALgIAGQgHAGgMAAQgMAAgIgIg");
	this.shape_18.setTransform(72.4,8.65);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#241056").s().p("AgSAcQgGgFAAgJQAAgKAJgEQAJgEAMAAIAJAAIAAgFQAAgHgDgEQgDgDgHAAQgMAAgCALIgKAAQABgKAIgFQAGgEAJAAQAXgBAAAXIAAAoIgKAAIAAgIQgHAKgLgBQgKABgFgFgAgOAOQAAAKAMAAQAHAAAFgDQAFgEAAgHIAAgIIgJAAQgUAAAAAMg");
	this.shape_19.setTransform(65.625,8.65);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#241056").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_20.setTransform(56.125,8.6);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#241056").s().p("AgSAcQgGgFAAgJQAAgKAJgEQAJgEAMAAIAJAAIAAgFQAAgHgDgEQgDgDgHAAQgMAAgCALIgKAAQABgKAIgFQAGgEAJAAQAXgBAAAXIAAAoIgKAAIAAgIQgHAKgLgBQgKABgFgFgAgOAOQAAAKAMAAQAHAAAFgDQAFgEAAgHIAAgIIgJAAQgUAAAAAMg");
	this.shape_21.setTransform(49.175,8.65);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#241056").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_22.setTransform(39.675,8.6);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#241056").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAIgJQAJgKAMABQAMAAAHAHQAJAIAAAQIAAACIgvAAQABAWATAAQAOAAACgLIAKAAQgBAJgIAGQgHAEgLAAQgMAAgIgIgAATgFQgCgSgQAAQgHAAgFAFQgFAFgBAIIAkAAIAAAAg");
	this.shape_23.setTransform(32.775,8.65);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#241056").s().p("AgdArIAAhUIAKAAIAAALQADgFAGgDQAFgEAHAAQAMAAAHAIQAJAKAAAOIAAAAQAAAOgIAJQgIAJgMAAQgOAAgHgMIAAAhgAgOgcQgFAHAAALIAAABQAAALAFAGQAGAGAJAAQASAAABgXIAAgBQgBgLgFgHQgGgFgIgBQgIABgGAFg");
	this.shape_24.setTransform(25.95,9.7);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#241056").s().p("AgdAfQgMgMAAgSIAAgBQAAgSAMgMQALgNATAAQASAAAMANQALAMAAASIAAABQAAASgLAMQgMANgSAAQgSAAgMgNgAgWgYQgIAJAAAPIAAABQAAAPAJAKQAJAKANAAQAOgBAIgJQAIgKAAgPIAAgBQABgOgJgKQgIgLgOABQgOgBgJALg");
	this.shape_25.setTransform(17.2,7.5);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14},{t:this.shape_13}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.copy2a, new cjs.Rectangle(0,0,120,16), null);


(lib.copy1b = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AgLAgIAJgWIgTgpIAIAAIAOAhIANghIAIAAIgZA/g");
	this.shape.setTransform(91.025,7.825);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AgDAjIAAhFIAHAAIAABFg");
	this.shape_1.setTransform(87.7,5.875);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AgVAgIAAg+IAHAAIAAAIQACgEAFgCQAEgDAEAAQAKAAAFAGQAHAHAAALIAAAAQAAAKgHAHQgFAHgKAAQgKAAgFgJIAAAYgAgKgVQgEAFAAAJIAAABQAAAHAEAFQAEAEAGAAQAOAAAAgQIAAgBQAAgJgDgEQgFgFgGAAQgFAAgFAEg");
	this.shape_2.setTransform(84.15,7.775);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AgWAgIAAg+IAIAAIAAAIQACgEAFgCQAEgDAEAAQAKAAAFAGQAHAHAAALIAAAAQAAAKgHAHQgFAHgKAAQgKAAgFgJIAAAYgAgKgVQgEAFAAAJIAAABQAAAHAEAFQAEAEAGAAQAOAAAAgQIAAgBQAAgJgDgEQgFgFgGAAQgFAAgFAEg");
	this.shape_3.setTransform(78.75,7.775);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AgNAVQgFgDAAgIQAAgHAHgDQAHgDAJAAIAHAAIAAgEQgBgFgCgCQgCgDgFAAQgJAAgCAIIgHAAQABgHAFgEQAGgDAGAAQARAAAAAQIAAAfIgHAAIAAgHQgGAIgIgBQgHAAgEgDgAgLAKQABAIAIAAQAGAAADgCQAFgDAAgGIAAgGIgHAAQgQAAAAAJg");
	this.shape_4.setTransform(73.35,7);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AgLAVQgGgFAAgHIAIAAQAAAJAKAAQAKAAAAgIQAAgDgDgBIgIgDQgIgCgEgCQgDgDgBgGQAAgGAGgEQAEgDAGAAQAPAAACANIgIAAQgCgHgHAAQgEAAgCABQgDADABACQAAAEABACQADABAFABQAJACADABQAFADAAAHQAAAGgFAFQgEAEgIgBQgIABgEgEg");
	this.shape_5.setTransform(67,7);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AgOASQgHgHABgLIAAAAQAAgKAFgHQAHgGAJAAQAJgBAFAGQAHAGgBAMIAAABIgiAAQABARANAAQAMAAABgIIAHAAQgBAHgFAEQgFAEgJgBQgJAAgGgGgAAOgDQgBgOgMAAQgFAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_6.setTransform(62.5,7);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AgOASQgGgHgBgLIAAAAQAAgKAHgHQAGgGAJAAQAIgBAGAGQAGAGABAMIAAABIgjAAQABARAOAAQAKAAACgIIAIAAQgCAHgGAEQgFAEgHgBQgKAAgGgGgAAOgDQgBgOgMAAQgFAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_7.setTransform(57.6,7);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AgGAjIAAgoIgGAAIAAgGIAGAAIAAgIQAAgPANAAIAGABIAAAGIgFgBQgHABAAAHIAAAJIALAAIAAAGIgLAAIAAAog");
	this.shape_8.setTransform(53.725,5.85);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("AgKAYIAAguIAHAAIAAAIQAEgJAKAAIAAAHQgHAAgEADQgDAEAAAIIAAAZg");
	this.shape_9.setTransform(48.75,6.95);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("AgOASQgHgHABgLIAAAAQAAgKAFgHQAHgGAIAAQAKgBAFAGQAHAGgBAMIAAABIgiAAQABARANAAQAMAAABgIIAHAAQgBAHgFAEQgFAEgJgBQgJAAgGgGgAAOgDQgBgOgNAAQgEAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_10.setTransform(44.5,7);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FFFFFF").s().p("AAMAjIAAgeQAAgLgLAAQgEAAgEAEQgEACAAAGIAAAdIgIAAIAAhFIAIAAIAAAeQACgDAEgDQAEgCAEAAQAQAAABASIAAAdg");
	this.shape_11.setTransform(39.5,5.875);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#FFFFFF").s().p("AgCAaQgDgDgBgGIAAgcIgGAAIAAgGIAGAAIAAgLIAHAAIAAALIALAAIAAAGIgLAAIAAAbQAAAHAGAAIAGgBIAAAGIgGABQgHAAgCgDg");
	this.shape_12.setTransform(35.4,6.475);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#FFFFFF").s().p("AgWAXQgIgJgBgOIAAAAQAAgNAJgKQAJgJANAAQAOAAAJAJQAJAKgBANIAAAAQABAOgJAJQgJAKgNAAQgNAAgKgKgAgQgSQgHAGAAAMIAAAAQAAAMAIAHQAGAIAKAAQAKAAAGgIQAHgHgBgMIAAAAQAAgLgFgHQgHgIgLAAQgKAAgGAIg");
	this.shape_13.setTransform(30.45,6.15);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_1
	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#241056").s().p("AgLAgIAJgWIgTgpIAIAAIAOAhIANghIAIAAIgZA/g");
	this.shape_14.setTransform(91.025,7.825);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#241056").s().p("AgDAjIAAhFIAHAAIAABFg");
	this.shape_15.setTransform(87.7,5.875);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#241056").s().p("AgVAgIAAg+IAHAAIAAAIQACgEAFgCQAEgDAEAAQAKAAAFAGQAHAHAAALIAAAAQAAAKgHAHQgFAHgKAAQgKAAgFgJIAAAYgAgKgVQgEAFAAAJIAAABQAAAHAEAFQAEAEAGAAQAOAAAAgQIAAgBQAAgJgDgEQgFgFgGAAQgFAAgFAEg");
	this.shape_16.setTransform(84.15,7.775);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f("#241056").s().p("AgWAgIAAg+IAIAAIAAAIQACgEAFgCQAEgDAEAAQAKAAAFAGQAHAHAAALIAAAAQAAAKgHAHQgFAHgKAAQgKAAgFgJIAAAYgAgKgVQgEAFAAAJIAAABQAAAHAEAFQAEAEAGAAQAOAAAAgQIAAgBQAAgJgDgEQgFgFgGAAQgFAAgFAEg");
	this.shape_17.setTransform(78.75,7.775);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#241056").s().p("AgNAVQgFgDAAgIQAAgHAHgDQAHgDAJAAIAHAAIAAgEQgBgFgCgCQgCgDgFAAQgJAAgCAIIgHAAQABgHAFgEQAGgDAGAAQARAAAAAQIAAAfIgHAAIAAgHQgGAIgIgBQgHAAgEgDgAgLAKQABAIAIAAQAGAAADgCQAFgDAAgGIAAgGIgHAAQgQAAAAAJg");
	this.shape_18.setTransform(73.35,7);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#241056").s().p("AgLAVQgGgFAAgHIAIAAQAAAJAKAAQAKAAAAgIQAAgDgDgBIgIgDQgIgCgEgCQgDgDgBgGQAAgGAGgEQAEgDAGAAQAPAAACANIgIAAQgCgHgHAAQgEAAgCABQgDADABACQAAAEABACQADABAFABQAJACADABQAFADAAAHQAAAGgFAFQgEAEgIgBQgIABgEgEg");
	this.shape_19.setTransform(67,7);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#241056").s().p("AgOASQgHgHABgLIAAAAQAAgKAFgHQAHgGAJAAQAJgBAFAGQAHAGgBAMIAAABIgiAAQABARANAAQAMAAABgIIAHAAQgBAHgFAEQgFAEgJgBQgJAAgGgGgAAOgDQgBgOgMAAQgFAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_20.setTransform(62.5,7);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#241056").s().p("AgOASQgGgHgBgLIAAAAQAAgKAHgHQAGgGAJAAQAIgBAGAGQAGAGABAMIAAABIgjAAQABARAOAAQAKAAACgIIAIAAQgCAHgGAEQgFAEgHgBQgKAAgGgGgAAOgDQgBgOgMAAQgFAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_21.setTransform(57.6,7);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#241056").s().p("AgGAjIAAgoIgGAAIAAgGIAGAAIAAgIQAAgPANAAIAGABIAAAGIgFgBQgHABAAAHIAAAJIALAAIAAAGIgLAAIAAAog");
	this.shape_22.setTransform(53.725,5.85);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#241056").s().p("AgKAYIAAguIAHAAIAAAIQAEgJAKAAIAAAHQgHAAgEADQgDAEAAAIIAAAZg");
	this.shape_23.setTransform(48.75,6.95);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#241056").s().p("AgOASQgHgHABgLIAAAAQAAgKAFgHQAHgGAIAAQAKgBAFAGQAHAGgBAMIAAABIgiAAQABARANAAQAMAAABgIIAHAAQgBAHgFAEQgFAEgJgBQgJAAgGgGgAAOgDQgBgOgNAAQgEAAgEAEQgDADgCAHIAbAAIAAAAg");
	this.shape_24.setTransform(44.5,7);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#241056").s().p("AAMAjIAAgeQAAgLgLAAQgEAAgEAEQgEACAAAGIAAAdIgIAAIAAhFIAIAAIAAAeQACgDAEgDQAEgCAEAAQAQAAABASIAAAdg");
	this.shape_25.setTransform(39.5,5.875);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#241056").s().p("AgCAaQgDgDgBgGIAAgcIgGAAIAAgGIAGAAIAAgLIAHAAIAAALIALAAIAAAGIgLAAIAAAbQAAAHAGAAIAGgBIAAAGIgGABQgHAAgCgDg");
	this.shape_26.setTransform(35.4,6.475);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#241056").s().p("AgWAXQgIgJgBgOIAAAAQAAgNAJgKQAJgJANAAQAOAAAJAJQAJAKgBANIAAAAQABAOgJAJQgJAKgNAAQgNAAgKgKgAgQgSQgHAGAAAMIAAAAQAAAMAIAHQAGAIAKAAQAKAAAGgIQAHgHgBgMIAAAAQAAgLgFgHQgHgIgLAAQgKAAgGAIg");
	this.shape_27.setTransform(30.45,6.15);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.copy1b, new cjs.Rectangle(0,0,120,13), null);


(lib.copy1a = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape.setTransform(112.575,8.65);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_1.setTransform(106.475,8.6);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_2.setTransform(99.575,8.65);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AgEAsIAAg+IAJAAIAAA+gAgEghQAAAAAAAAQgBgBAAAAQAAgBAAgBQAAAAAAgBQAAgBAAAAQAAgBAAAAQAAgBABAAQAAgBAAgBQABAAABAAQAAgBABAAQAAAAABAAQAAgBAAAAQABAAAAABQABAAABAAQAAAAABABQAAAAAAAAQABABAAABQABAAAAABQAAAAAAABQAAAAAAABQAAABAAAAQAAABAAABQAAAAgBABQAAAAgBAAQAAABAAAAQgBABAAAAQgBAAgBAAQAAABgBAAQAAAAAAgBQgBAAAAAAQgBAAAAgBQgBAAgBgBg");
	this.shape_3.setTransform(94.7,7.35);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape_4.setTransform(90.625,8.65);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape_5.setTransform(85.175,8.65);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AgDAsIAAg+IAJAAIAAA+gAgDghQgBAAAAAAQgBgBAAAAQAAgBAAgBQgBAAAAgBQAAgBABAAQAAgBAAAAQAAgBABAAQAAgBABgBQAAAAABAAQAAgBABAAQAAAAABAAQAAgBAAAAQABAAAAABQABAAABAAQAAAAABABQAAAAABAAQAAABAAABQABAAAAABQAAAAAAABQABAAAAABQAAABgBAAQAAABAAABQAAAAgBABQAAAAAAAAQgBABAAAAQgBABAAAAQgBAAgBAAQAAABgBAAQAAAAAAgBQgBAAAAAAQgBAAAAgBQgBAAAAgBg");
	this.shape_6.setTransform(81.05,7.35);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AAjAgIAAgnQAAgPgNAAQgHAAgFAEQgFAFAAAHIAAAmIgJAAIAAgnQAAgPgNAAQgHAAgEAEQgGAFAAAHIAAAmIgKAAIAAg+IAKAAIAAAKQADgFAEgCQAGgEAGAAQAOAAADAMQADgGAHgDQAFgDAHAAQAJAAAGAGQAGAGAAANIAAAmg");
	this.shape_7.setTransform(74.425,8.6);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AAjAgIAAgnQAAgPgNAAQgHAAgFAEQgFAFAAAHIAAAmIgJAAIAAgnQAAgPgNAAQgHAAgEAEQgGAFAAAHIAAAmIgKAAIAAg+IAKAAIAAAKQADgFAEgCQAGgEAGAAQAOAAADAMQADgGAHgDQAFgDAHAAQAJAAAGAGQAGAGAAANIAAAmg");
	this.shape_8.setTransform(63.825,8.6);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_9.setTransform(55.075,8.65);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAJgJQAIgKAMABQALgBAHAGQAJAGAAAKIgJAAQgCgNgQAAQgHAAgGAHQgGAGAAAKIAAABQAAALAGAHQAGAFAHAAQAIAAAFgDQAFgEABgIIAJAAQgBALgHAGQgIAGgMAAQgMAAgIgIg");
	this.shape_10.setTransform(48.4,8.65);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FFFFFF").s().p("AgXAgQgKgKAAgUIAAgDQAAgTAJgMQAKgLAOAAQAQAAAJALQAJAMAAATIAAADQAAAUgJAKQgJAMgPAAQgPAAgJgMgAgQgaQgGAJAAAQIAAADQAAARAGAIQAHAJAKAAQAWgBAAghIAAgDQAAgQgGgIQgGgKgLABQgKAAgGAIg");
	this.shape_11.setTransform(38.325,7.5);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#FFFFFF").s().p("AgCA5IAAgPQgagCgCgZIAKAAQABAIADAEQAEAGAKABIAAgiQgMgBgGgFQgHgGAAgKQAAgJAHgHQAHgGALgBIAAgLIAHAAIAAALQAWACACAWIgJAAQgCgOgNgCIAAAeQAOADAGAEQAGAFAAALQAAALgHAHQgIAHgLABIAAAPgAAFAiQAHgBAFgFQAEgEAAgHQAAgHgDgDQgEgEgJgCgAgNggQgEADAAAGQAAAGADADQADAEAJACIAAgdQgHABgEAEg");
	this.shape_12.setTransform(30.725,7.725);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#FFFFFF").s().p("AgDAiQgEgEAAgHIAAgmIgJAAIAAgJIAJAAIAAgOIAJAAIAAAOIAPAAIAAAJIgPAAIAAAlQAAAIAIABQAEgBADgBIAAAJQgDABgFAAQgIAAgEgFg");
	this.shape_13.setTransform(22.275,8);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#FFFFFF").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAIgJQAJgKAMABQAMAAAHAHQAJAIAAAQIAAACIgvAAQABAWATAAQAOAAACgLIAKAAQgBAJgIAGQgHAEgLAAQgMAAgIgIgAATgFQgCgSgQAAQgHAAgFAFQgFAFgBAIIAkAAIAAAAg");
	this.shape_14.setTransform(17.175,8.65);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#FFFFFF").s().p("AgcAgQgKgMgBgTIAAgBQAAgTAMgMQAMgMARAAQAOAAAJAHQAKAGACAOIgLAAQgDgTgUAAQgOAAgJAKQgHAKgBAPIAAABQAAAQAIAJQAIAKAOAAQANgBAHgHQAHgIAAgLIgZAAIAAgJIAkAAIAAAGQAAASgLALQgKAJgRAAQgSAAgMgMg");
	this.shape_15.setTransform(9.45,7.5);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_1
	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#241056").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape_16.setTransform(112.575,8.65);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f("#241056").s().p("AAQAgIAAgnQAAgPgPAAQgGAAgFAEQgFAFAAAIIAAAlIgKAAIAAg+IAKAAIAAAKQACgEAFgDQAGgEAGAAQAWAAAAAZIAAAmg");
	this.shape_17.setTransform(106.475,8.6);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#241056").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_18.setTransform(99.575,8.65);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#241056").s().p("AgEAsIAAg+IAJAAIAAA+gAgEghQAAAAAAAAQgBgBAAAAQAAgBAAgBQAAAAAAgBQAAgBAAAAQAAgBAAAAQAAgBABAAQAAgBAAgBQABAAABAAQAAgBABAAQAAAAABAAQAAgBAAAAQABAAAAABQABAAABAAQAAAAABABQAAAAAAAAQABABAAABQABAAAAABQAAAAAAABQAAAAAAABQAAABAAAAQAAABAAABQAAAAgBABQAAAAgBAAQAAABAAAAQgBABAAAAQgBAAgBAAQAAABgBAAQAAAAAAgBQgBAAAAAAQgBAAAAgBQgBAAgBgBg");
	this.shape_19.setTransform(94.7,7.35);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#241056").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape_20.setTransform(90.625,8.65);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#241056").s().p("AgQAbQgGgFgBgKIAKAAQABAMANAAQANAAAAgKQAAgEgDgDIgLgDQgMgDgEgDQgFgDAAgIQAAgJAHgFQAGgEAIAAQAUgBACATIgKAAQgCgKgKAAQgFAAgEACQgDADAAAEQAAAEADACQADACAIACQALACAFACQAGAEAAAJQAAAJgGAGQgGAEgLAAQgKABgHgGg");
	this.shape_21.setTransform(85.175,8.65);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#241056").s().p("AgDAsIAAg+IAJAAIAAA+gAgDghQgBAAAAAAQgBgBAAAAQAAgBAAgBQgBAAAAgBQAAgBABAAQAAgBAAAAQAAgBABAAQAAgBABgBQAAAAABAAQAAgBABAAQAAAAABAAQAAgBAAAAQABAAAAABQABAAABAAQAAAAABABQAAAAABAAQAAABAAABQABAAAAABQAAAAAAABQABAAAAABQAAABgBAAQAAABAAABQAAAAgBABQAAAAAAAAQgBABAAAAQgBABAAAAQgBAAgBAAQAAABgBAAQAAAAAAgBQgBAAAAAAQgBAAAAgBQgBAAAAgBg");
	this.shape_22.setTransform(81.05,7.35);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#241056").s().p("AAjAgIAAgnQAAgPgNAAQgHAAgFAEQgFAFAAAHIAAAmIgJAAIAAgnQAAgPgNAAQgHAAgEAEQgGAFAAAHIAAAmIgKAAIAAg+IAKAAIAAAKQADgFAEgCQAGgEAGAAQAOAAADAMQADgGAHgDQAFgDAHAAQAJAAAGAGQAGAGAAANIAAAmg");
	this.shape_23.setTransform(74.425,8.6);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#241056").s().p("AAjAgIAAgnQAAgPgNAAQgHAAgFAEQgFAFAAAHIAAAmIgJAAIAAgnQAAgPgNAAQgHAAgEAEQgGAFAAAHIAAAmIgKAAIAAg+IAKAAIAAAKQADgFAEgCQAGgEAGAAQAOAAADAMQADgGAHgDQAFgDAHAAQAJAAAGAGQAGAGAAANIAAAmg");
	this.shape_24.setTransform(63.825,8.6);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#241056").s().p("AgVAXQgJgIAAgOIAAgBQAAgNAJgJQAJgKAMABQANgBAJAKQAJAJAAANIAAABQAAAOgJAIQgJAKgNgBQgNABgIgKgAgOgQQgGAGAAAKIAAABQAAAKAGAHQAGAHAIgBQAJABAGgHQAGgHAAgKIAAgBQAAgKgGgGQgGgHgJAAQgIAAgGAHg");
	this.shape_25.setTransform(55.075,8.65);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#241056").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAJgJQAIgKAMABQALgBAHAGQAJAGAAAKIgJAAQgCgNgQAAQgHAAgGAHQgGAGAAAKIAAABQAAALAGAHQAGAFAHAAQAIAAAFgDQAFgEABgIIAJAAQgBALgHAGQgIAGgMAAQgMAAgIgIg");
	this.shape_26.setTransform(48.4,8.65);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#241056").s().p("AgXAgQgKgKAAgUIAAgDQAAgTAJgMQAKgLAOAAQAQAAAJALQAJAMAAATIAAADQAAAUgJAKQgJAMgPAAQgPAAgJgMgAgQgaQgGAJAAAQIAAADQAAARAGAIQAHAJAKAAQAWgBAAghIAAgDQAAgQgGgIQgGgKgLABQgKAAgGAIg");
	this.shape_27.setTransform(38.325,7.5);

	this.shape_28 = new cjs.Shape();
	this.shape_28.graphics.f("#241056").s().p("AgCA5IAAgPQgagCgCgZIAKAAQABAIADAEQAEAGAKABIAAgiQgMgBgGgFQgHgGAAgKQAAgJAHgHQAHgGALgBIAAgLIAHAAIAAALQAWACACAWIgJAAQgCgOgNgCIAAAeQAOADAGAEQAGAFAAALQAAALgHAHQgIAHgLABIAAAPgAAFAiQAHgBAFgFQAEgEAAgHQAAgHgDgDQgEgEgJgCgAgNggQgEADAAAGQAAAGADADQADAEAJACIAAgdQgHABgEAEg");
	this.shape_28.setTransform(30.725,7.725);

	this.shape_29 = new cjs.Shape();
	this.shape_29.graphics.f("#241056").s().p("AgDAiQgEgEAAgHIAAgmIgJAAIAAgJIAJAAIAAgOIAJAAIAAAOIAPAAIAAAJIgPAAIAAAlQAAAIAIABQAEgBADgBIAAAJQgDABgFAAQgIAAgEgFg");
	this.shape_29.setTransform(22.275,8);

	this.shape_30 = new cjs.Shape();
	this.shape_30.graphics.f("#241056").s().p("AgTAYQgJgJAAgOIAAgBQAAgNAIgJQAJgKAMABQAMAAAHAHQAJAIAAAQIAAACIgvAAQABAWATAAQAOAAACgLIAKAAQgBAJgIAGQgHAEgLAAQgMAAgIgIgAATgFQgCgSgQAAQgHAAgFAFQgFAFgBAIIAkAAIAAAAg");
	this.shape_30.setTransform(17.175,8.65);

	this.shape_31 = new cjs.Shape();
	this.shape_31.graphics.f("#241056").s().p("AgcAgQgKgMgBgTIAAgBQAAgTAMgMQAMgMARAAQAOAAAJAHQAKAGACAOIgLAAQgDgTgUAAQgOAAgJAKQgHAKgBAPIAAABQAAAQAIAJQAIAKAOAAQANgBAHgHQAHgIAAgLIgZAAIAAgJIAkAAIAAAGQAAASgLALQgKAJgRAAQgSAAgMgMg");
	this.shape_31.setTransform(9.45,7.5);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_31},{t:this.shape_30},{t:this.shape_29},{t:this.shape_28},{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.copy1a, new cjs.Rectangle(0,0,120,16), null);


(lib.Purplepointedline = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#6633CC").s().p("Ay4CqIhkioIBkirMAnVAAAIAAFTg");
	this.shape.setTransform(130.875,17);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Purplepointedline, new cjs.Rectangle(0,0,261.8,34), null);


(lib.LogoTrade = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("EAp0AKCIAAz7IVHAAIAADmIwTAAIAAEWILMAAIAADlIrMAAIAAEpIQpAAIAADxgANsKCIAAz7IMvAAQF1AADDCiQDGCiAAE4QAAFfkrC4QirBol4AAgASlGGIF6AAQE/AAB5hIQCOhSAAjuQAAmGnFAAIn7AAgAGsKCIifj8ItKAAIicD8Ik0AAILrz7IEwAAIL4T7gAm5CRIJFAAIkcoDgA3EKCIk2nFIpDAAIAAHFIkxAAIAAz7IQGAAQDWAACDBzQCBBzAAC7QAAEzkgBMIFBHbgEgk9gA2IK0AAQBgAAA3gsQA2gvAAhPQAAhKg2gsQg3gshgAAIq0AAgEg7RAKCIAAwKIpkAAIAAjxIX/AAIAADxIpnAAIAAQKgEBBigGuQgjgkAAg0QAAg0AjgkQAkgjA0AAQA0AAAkAjQAkAkAAA0QAAA0gkAkQgkAkg0AAQg0AAgkgkgEBBwgJQQgeAeAAAsQAAAsAeAeQAeAeAsAAQAsAAAegeQAfgeAAgsQAAgsgfgeQgegegsAAQgsAAgeAegEBDegHBQgTgkgGgFQgLgRgNAAIgOAAIAAA6IgWAAIAAiHIA3AAQAxAAAAAnQAAANgLALQgOALgNAAQAQAJAeA0gEBCfgILIAbAAQAeAAAAgWQAAgTgeAAIgbAAg");
	this.shape.setTransform(-435.425,0.325);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.LogoTrade, new cjs.Rectangle(-876,-63.9,881.2,128.5), null);


(lib.LogoE = function(mode,startPosition,loop,reversed) {
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
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AqsJ+IAAz7IVDAAIAADmIwQAAIAAEVILKAAIAADmIrKAAIAAEpIQmAAIAADxg");
	this.shape.setTransform(-67.6,0.65);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.LogoE, new cjs.Rectangle(-136.1,-63.1,137,127.6), null);


(lib.Greenpointedline = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#187ABB").s().p("Ay4CqIhkioIBkirMAnVAAAIAAFTg");
	this.shape.setTransform(130.875,17);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Greenpointedline, new cjs.Rectangle(0,0,261.8,34), null);


(lib.bigBtn = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#0066CC").s().p("A3bTiMAAAgnDMAu3AAAMAAAAnDg");
	this.shape.setTransform(150,149.9996,1,1.2);
	this.shape._off = true;

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3).to({_off:false},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(0,0,300,300);


(lib.etradelogobuildv2 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// timeline functions:
	this.frame_17 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(17).call(this.frame_17).wait(1));

	// Layer_3
	this.instance = new lib.logo_star();
	this.instance.setTransform(-3.15,-0.05,2.7999,2.7999,0,0,0,15.1,14.6);
	this.instance._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(4).to({_off:false},0).to({regY:14.7,scaleX:1.044,scaleY:1.044,x:-0.05,y:-0.2},7).wait(7));

	// purple line
	this.instance_1 = new lib.Purplepointedline();
	this.instance_1.setTransform(-370.8,0,1,1,0,0,180,130.8,17);

	this.timeline.addTween(cjs.Tween.get(this.instance_1).to({x:-126.65},4).to({regX:130.6,regY:16.9,scaleX:0.0639,scaleY:0.19,x:-4.4,y:-0.1},7).to({_off:true},1).wait(6));

	// green line
	this.instance_2 = new lib.Greenpointedline();
	this.instance_2.setTransform(370.8,0,1,1,0,0,0,130.8,17);

	this.timeline.addTween(cjs.Tween.get(this.instance_2).to({x:95.5},4).to({regX:130.6,regY:16.9,scaleX:0.0659,scaleY:0.19,x:5.1,y:-0.1},7).to({_off:true},1).wait(6));

	// Right Mask (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("At/CqIhjirIBhipIdkABIAAFUg");
	mask.setTransform(99.475,0.2);

	// Logo - Trade
	this.instance_3 = new lib.LogoTrade();
	this.instance_3.setTransform(-83.1,-0.1,0.19,0.19,0,0,0,-437.4,-0.2);
	this.instance_3._off = true;

	var maskedShapeInstanceList = [this.instance_3];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.instance_3).wait(9).to({_off:false},0).to({x:98.5},7,cjs.Ease.get(1)).wait(2));

	// Left Mask (mask)
	var mask_1 = new cjs.Shape();
	mask_1._off = true;
	mask_1.graphics.p("AviipIdkgBIBhCpIhjCrI9iABg");
	mask_1.setTransform(-99.475,0.2);

	// Logo - E
	this.instance_4 = new lib.LogoE();
	this.instance_4.setTransform(93.05,0.05,0.19,0.19,0,0,0,-68.2,0);
	this.instance_4._off = true;

	var maskedShapeInstanceList = [this.instance_4];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask_1;
	}

	this.timeline.addTween(cjs.Tween.get(this.instance_4).wait(9).to({_off:false},0).to({x:-29.45},7,cjs.Ease.get(1)).wait(2));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-501.7,-40.9,1003.5,82.4);


(lib.anime_all = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.etradelogobuildv2("synched",0,false);
	this.instance.setTransform(-9.85,-0.45,0.3,0.3,0,0,0,0.5,0.1);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(5).to({startPosition:5},0).to({regX:0.6,regY:0.2,scaleX:0.47,scaleY:0.47,x:-42.5,y:-0.4,startPosition:13},8).wait(32));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-160.4,-12.7,300.9,24.7);


// stage content:
(lib.ETrade_Buttons_ZeroCommissions_purple_120x60 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.actionFrames = [1,123];
	// timeline functions:
	this.frame_1 = function() {
		// Enable mouse interaction with the stage 
		stage.enableMouseOver();
		
		// Define variables used in the 
		var root = this;
		var bigBtn = root.bigBtn;
		//var cta = root.cta;
		//var ctaBase = root.cta.ctaBase;
		//var ctaText = root.cta.ctaText;
		
		// Add event listeners
		bigBtn.addEventListener("click", clickTag);
		
		
		function clickTag() {
			window.open(window.clickTag);
		}
	}
	this.frame_123 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(1).call(this.frame_1).wait(122).call(this.frame_123).wait(1));

	// bigBtn
	this.bigBtn = new lib.bigBtn();
	this.bigBtn.name = "bigBtn";
	this.bigBtn.setTransform(60,25.05,0.4,0.2,0,0,0,150,125.2);
	new cjs.ButtonHelper(this.bigBtn, 0, 1, 2, false, new lib.bigBtn(), 3);

	this.timeline.addTween(cjs.Tween.get(this.bigBtn).wait(124));

	// border
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#CCCCCC").ss(1,0,0,3).p("ApSkmISlAAIAAJNIylAAg");
	this.shape.setTransform(60,30);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(124));

	// copy2
	this.instance = new lib.copy2a();
	this.instance.setTransform(60,-7,1,1,0,0,0,60,8);
	this.instance._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(92).to({_off:false},0).to({y:16},10,cjs.Ease.quadOut).wait(22));

	// Get $0 commissions
	this.instance_1 = new lib.copy1a();
	this.instance_1.setTransform(60,-22,1,1,0,0,0,60,8);
	this.instance_1._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(3).to({_off:false},0).to({y:9},9,cjs.Ease.quadOut).wait(67).to({y:-18},8,cjs.Ease.quadIn).to({_off:true},1).wait(36));

	// Other fees apply
	this.instance_2 = new lib.copy1b();
	this.instance_2.setTransform(60,21.5,1,1,0,0,0,60,6.5);
	this.instance_2.alpha = 0;
	this.instance_2._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_2).wait(27).to({_off:false},0).to({alpha:1},13).wait(39).to({alpha:0},10,cjs.Ease.none).to({_off:true},1).wait(34));

	// Layer_3
	this.instance_3 = new lib.anime_all("synched",0,false);
	this.instance_3.setTransform(61.1,37.4,1,1,0,0,0,-9.9,-0.6);
	this.instance_3._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_3).wait(13).to({_off:false},0).wait(111));

	// Layer_5
	this.instance_4 = new lib.logo_ms();
	this.instance_4.setTransform(71.9,51.8,1,1,0,0,0,34.9,3.8);
	this.instance_4.alpha = 0;
	this.instance_4._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_4).wait(13).to({_off:false},0).to({alpha:1},9).wait(102));

	// bkgd
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#241056").s().p("ApXEsIAApXISvAAIAAJXg");
	this.shape_1.setTransform(60,30);

	this.timeline.addTween(cjs.Tween.get(this.shape_1).wait(124));

	this._renderFirstFrame();

}).prototype = p = new lib.AnMovieClip();
p.nominalBounds = new cjs.Rectangle(-29.4,0,240.9,60.5);
// library properties:
lib.properties = {
	id: '4A3FB32C3C8D44DE90778EF3F28D5A73',
	width: 120,
	height: 60,
	fps: 30,
	color: "#FFFFFF",
	opacity: 1.00,
	manifest: [],
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
an.compositions['4A3FB32C3C8D44DE90778EF3F28D5A73'] = {
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