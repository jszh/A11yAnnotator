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



(lib.BG = function() {
	this.initialize(img.BG);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,300,104);


(lib.img02 = function() {
	this.initialize(img.img02);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,301,170);


(lib.IMG_1 = function() {
	this.initialize(img.IMG_1);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,301,170);


(lib.IMG_3 = function() {
	this.initialize(img.IMG_3);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,301,170);


(lib.unistudios_orlandoresort_rgb = function() {
	this.initialize(img.unistudios_orlandoresort_rgb);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,200,103);// helper functions:

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


(lib.uor = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.unistudios_orlandoresort_rgb();
	this.instance.setTransform(-100,-51.5);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.rf(["#000000","#000000","rgba(0,0,0,0)"],[0,0.6,1],0.1,0.1,0,0.1,0.1,57.8).s().p("AmQGRQilimAAjrQAAjqClimQCmimDqAAQDrAACmCmQClCmABDqQgBDrilCmQimCmjrAAQjqAAimimg");
	this.shape.setTransform(-1.05,-0.825);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.uor, new cjs.Rectangle(-100,-57.5,200,113.4), null);


(lib.udxBLUE = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.BG();
	this.instance.setTransform(-150,0);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.udxBLUE, new cjs.Rectangle(-150,0,300,104), null);


(lib.txt02 = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AguBHIAAiNIAuAAIAABkIAvAAIAAApg");
	this.shape.setTransform(76.2,-0.725);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AgvBHIAAiNIAwAAIAABkIAvAAIAAApg");
	this.shape_1.setTransform(65.25,-0.725);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AgXBHIAAiNIAvAAIAACNg");
	this.shape_2.setTransform(55.5,-0.725);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AAKBHIgagzIgBAAIAAAzIgvAAIAAiNIA9AAQAKAAAKACQAKACAJAGQAIAFAFAJQAFAJAAANQAAANgHAKQgGAJgMAFIAkA6gAgSgKIAKAAIAFAAIAEgCQADgBABgDQACgCAAgEQAAgEgBgCIgEgDIgEgCIgEAAIgMAAg");
	this.shape_3.setTransform(45.325,-0.725);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AATBHIAAg2IglAAIAAA2IgwAAIAAiNIAwAAIAAAwIAlAAIAAgwIAwAAIAACNg");
	this.shape_4.setTransform(29.55,-0.725);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AgXBHIAAhlIgiAAIAAgoIB0AAIAAAoIgjAAIAABlg");
	this.shape_5.setTransform(15.55,-0.725);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AgeBFQgOgFgLgKQgKgKgHgOQgFgOgBgQQABgRAFgOQAHgNAKgKQAKgJAPgGQAOgFAQAAQARAAAOAFQAOAGALAJQALAKAFANQAHAOAAARQAAAQgHAOQgFAOgLAKQgLAKgOAFQgOAGgRAAQgQAAgOgGgAgKgcQgFACgEAEQgEAEgCAGQgCAFAAAHQAAAGACAGQACAGAEAEQAEAEAFACQAFADAFAAQAGAAAFgDQAFgCAEgEQADgEADgGQACgGAAgGQAAgHgCgFQgDgGgDgEQgEgEgFgCQgFgCgGAAQgFAAgFACg");
	this.shape_6.setTransform(-4,-0.725);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AgXBHIAAhlIgiAAIAAgoIB0AAIAAAoIgjAAIAABlg");
	this.shape_7.setTransform(-18.55,-0.725);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AgyBHIAAiNIBhAAIAAAoIg0AAIAAAMIAxAAIAAAkIgxAAIAAANIA3AAIAAAog");
	this.shape_8.setTransform(-35.25,-0.725);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("AApBHIAChPIgBAAIgbBPIggAAIgahPIgBAAIACBPIgtAAIAAiNIA/AAIAYBLIABAAIAXhLIBAAAIAACNg");
	this.shape_9.setTransform(-51.675,-0.725);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("AgXBHIAAiNIAvAAIAACNg");
	this.shape_10.setTransform(-65.45,-0.725);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FFFFFF").s().p("AgXBHIAAhlIgiAAIAAgoIBzAAIAAAoIgiAAIAABlg");
	this.shape_11.setTransform(-75.15,-0.725);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.txt02, new cjs.Rectangle(-83.2,-15.6,166.4,31.299999999999997), null);


(lib.txt01 = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AguBHIAAiNIAvAAIAABkIAuAAIAAApg");
	this.shape.setTransform(70.05,-0.725);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AguBHIAAiNIAuAAIAABkIAvAAIAAApg");
	this.shape_1.setTransform(59.1,-0.725);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AgXBHIAAiNIAvAAIAACNg");
	this.shape_2.setTransform(49.35,-0.725);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AAUBHIAAg2IgmAAIAAA2IgwAAIAAiNIAwAAIAAAwIAmAAIAAgwIAvAAIAACNg");
	this.shape_3.setTransform(37.65,-0.725);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AgTBFQgOgFgKgKQgKgKgGgOQgGgNAAgRQAAgQAGgOQAGgOAKgJQAKgKAOgGQAPgFAPAAQAQAAAPAFQAPAGAJAJIgdAjQgEgFgGgDQgGgDgIAAQgFAAgFACQgFADgDAEQgEAEgDAFQgCAGAAAGQAAAHACAFQADAGAEAEQAEAEAEACQAFACAFAAQAJAAAGgDQAFgEAEgEIAdAjQgJAJgPAGQgNAGgSAAQgPAAgPgGg");
	this.shape_4.setTransform(23.05,-0.725);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AgfBFQgOgFgKgKQgLgKgFgOQgHgOAAgQQAAgRAHgOQAFgNALgKQAKgJAOgGQAPgFAQAAQARAAAOAFQAPAGAKAJQAKAKAGANQAGAOABARQgBAQgGAOQgGAOgKAKQgKAKgPAFQgOAGgRAAQgQAAgPgGgAgKgcQgGACgDAEQgEAEgCAGQgCAFAAAHQAAAGACAGQACAGAEAEQADAEAGACQAFADAFAAQAGAAAFgDQAFgCAEgEQADgEADgGQACgGAAgGQAAgHgCgFQgDgGgDgEQgEgEgFgCQgFgCgGAAQgFAAgFACg");
	this.shape_5.setTransform(2.2,-0.725);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AgXBHIAAhlIgiAAIAAgoIB0AAIAAAoIgjAAIAABlg");
	this.shape_6.setTransform(-12.35,-0.725);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AgyBHIAAiNIBhAAIAAAoIg0AAIAAAMIAxAAIAAAkIgxAAIAAANIA3AAIAAAog");
	this.shape_7.setTransform(-29.05,-0.725);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AApBHIAChPIgBAAIgbBPIggAAIgahPIgBAAIACBPIgtAAIAAiNIA/AAIAYBLIABAAIAXhLIBAAAIAACNg");
	this.shape_8.setTransform(-45.475,-0.725);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("AgXBHIAAiNIAvAAIAACNg");
	this.shape_9.setTransform(-59.25,-0.725);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("AgXBHIAAhlIgiAAIAAgoIB0AAIAAAoIgjAAIAABlg");
	this.shape_10.setTransform(-68.95,-0.725);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.txt01, new cjs.Rectangle(-77,-15.6,154.1,31.299999999999997), null);


(lib.img03 = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.IMG_3();

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.img03, new cjs.Rectangle(0,0,301,170), null);


(lib.img02_1 = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.img02();

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.img02_1, new cjs.Rectangle(0,0,301,170), null);


(lib.img01 = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.IMG_1();

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.img01, new cjs.Rectangle(0,0,301,170), null);


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

	// Layer_3
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AhFDcQgXgFgVgIQgVgIgSgNQgSgMgMgQIBKg8QAMATAZAMQAYAMAaAAIAYgDQAMgDAKgGQAJgGAGgKQAGgKAAgOQAAgWgSgNQgSgNgdgKIgngQQgTgJgNgMQgOgOgIgSQgIgSAAgaQAAggAOgaQANgaAYgTQAXgSAfgKQAegKAkAAQASAAATAEQAUADARAHQASAHAPAKQAPAKAKAOIhDA8QgMgRgTgIQgRgIgXAAIgVACQgMADgJAGQgIAHgHAJQgGAKAAAOQAAASAOAKQANALAZAJQAcAJAWAMQAVAMAPAOQAPAPAIATQAIATAAAYQAAAmgQAbQgQAbgZARQgZARggAIQgfAIgdAAQgXAAgXgEg");
	this.shape.setTransform(240.075,101.225);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AhTDTQglgNgbgYQgagYgPgiQgPgiAAgrQAAg2ATgwQATgwAigkQAigjAugUQAugVA1AAQAyAAApAQQApAQAYAfIhJBBQgMgRgVgMQgUgLggAAQgfAAgaANQgbANgTAXQgUAWgLAeQgLAdAAAgQAAAYAHAUQAHAUAPAPQAOAPAVAHQAVAJAaAAIAigEQAPgCANgHIAOhQIhTAAIAPhRICvAAIgnDfQghARgoAKQgpALgqAAQgtAAgmgNg");
	this.shape_1.setTransform(202.025,101.225);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AAnDVIh0kaIgBAAIgwEaIhiAAIBKmpIBxAAIBzEYIABAAIAwkYIBjAAIhLGpg");
	this.shape_2.setTransform(157.35,101.2);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AhWDVIBKmpIBjAAIhKGpg");
	this.shape_3.setTransform(126.9,101.2);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#FFFFFF").s().p("AiSDVIhBmpIBrAAIAhEvIACAAIClkvIB0AAIj9Gpg");
	this.shape_4.setTransform(101.625,101.2);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AB3DVIgOhVIijAAIgzBVIhyAAIEOmpIBhAAIBQGpgABfAvIgXiVIhXCVIBuAAg");
	this.shape_5.setTransform(58.175,101.2);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFFFF").s().p("AhFDcQgXgFgVgIQgVgIgSgNQgSgMgMgQIBKg8QAMATAZAMQAYAMAaAAIAYgDQAMgDAKgGQAJgGAGgKQAGgKAAgOQAAgWgSgNQgSgNgdgKIgngQQgTgJgNgMQgOgOgIgSQgIgSAAgaQAAggAOgaQANgaAYgTQAXgSAfgKQAegKAkAAQASAAATAEQAUADARAHQASAHAPAKQAPAKAKAOIhDA8QgMgRgTgIQgRgIgXAAIgVACQgMADgJAGQgIAHgHAJQgGAKAAAOQAAASAOAKQANALAZAJQAcAJAWAMQAVAMAPAOQAPAPAIATQAIATAAAYQAAAmgQAbQgQAbgZARQgZARggAIQgfAIgdAAQgXAAgXgEg");
	this.shape_6.setTransform(21.075,101.225);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AA2DVIhHirIgoAAIgdCrIhhAAIBLmoICQAAQBGAAAnAeQAnAdAAA1QAAA0gcAhQgcAggwAMIBXC3gAgsgdIAsAAQAngBAXgNQAWgNAAgcQAAgagTgKQgTgJgfAAIgpAAg");
	this.shape_7.setTransform(242.875,50.2);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("AisDVIBLmoIEOAAIgPBVIivAAIgOBSICnAAIgPBPIinAAIgPBbIDAAAIgPBXg");
	this.shape_8.setTransform(207.375,50.2);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("ABqDVIA4kwIgDAAIijEwIhHAAIg4kwIgCAAIgzEwIheAAIBLmoICLAAIAyESIACAAICOkSICVAAIhLGog");
	this.shape_9.setTransform(162.9,50.2);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("ABqDVIA4kwIgDAAIijEwIhHAAIg4kwIgCAAIgzEwIheAAIBLmoICLAAIAyESIACAAICOkSICVAAIhLGog");
	this.shape_10.setTransform(107.2,50.2);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FFFFFF").s().p("AhqDRQgfgKgWgRQgWgRgLgYQgMgZAAgfIABgRIACgTIAvkKIBjAAIguEBIgBAMIgBANQAAANAEALQAEAMAJAKQAIAJAOAFQAOAGATAAQAZAAAQgIQAQgJALgMQAKgOAFgPIAJggIAukCIBiAAIguEMQgHAmgPAfQgPAegYAWQgZAWghAMQgiAMgrAAQgmAAgfgJg");
	this.shape_11.setTransform(59.225,50.75);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#FFFFFF").s().p("AhFDcQgXgFgVgIQgVgIgSgNQgSgMgMgQIBKg8QAMATAZAMQAYAMAaAAIAYgDQAMgDAKgGQAJgGAGgKQAGgKAAgOQAAgWgSgNQgSgNgdgKIgngQQgTgJgNgMQgOgOgIgSQgIgSAAgaQAAggAOgaQANgaAYgTQAXgSAfgKQAegKAkAAQASAAATAEQAUADARAHQASAHAPAKQAPAKAKAOIhDA8QgMgRgTgIQgRgIgXAAIgVACQgMADgJAGQgIAHgHAJQgGAKAAAOQAAASAOAKQANALAZAJQAcAJAWAMQAVAMAPAOQAPAPAIATQAIATAAAYQAAAmgQAbQgQAbgZARQgZARggAIQgfAIgdAAQgXAAgXgEg");
	this.shape_12.setTransform(16.775,50.225);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#FFFFFF").s().p("Ag3BVIAAipIBsAAIAAAVIhUAAIAAAzIBPAAIAAATIhPAAIAAA5IBXAAIAAAVg");
	this.shape_13.setTransform(184.975,12);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#FFFFFF").s().p("AAgBVIgqhLIgaAAIAABLIgYAAIAAipIA3AAQALAAALADQALACAJAGQAIAFAFAJQAEAJAAANQAAATgLALQgMALgSADIAwBOgAgkgJIAbAAQAJAAAGgCQAHgCAGgCQAFgEADgFQADgFAAgIQAAgHgDgGQgDgFgFgDQgFgDgHgBIgOgCIgdAAg");
	this.shape_14.setTransform(168.375,12);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#FFFFFF").s().p("AgjBTQgRgHgLgLQgMgMgHgRQgHgQAAgUQAAgTAHgQQAHgRAMgLQALgMARgHQARgGASAAQATAAARAGQAQAHAMAMQAMALAHARQAHAQAAATQAAAUgHAQQgHARgMAMQgMALgQAHQgRAGgTABQgSgBgRgGgAgag+QgLAGgJAJQgIAJgFANQgEAMAAANQAAAOAEANQAFAMAIAJQAIAJAMAGQAMAFAOAAQAOAAAMgFQAMgGAJgJQAIgJAFgMQAEgNAAgOQAAgNgEgMQgFgNgIgJQgJgJgMgGQgMgFgOgBQgOABgMAFg");
	this.shape_15.setTransform(147.75,12);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#FFFFFF").s().p("AgxBVIAAipIAYAAIAACUIBLAAIAAAVg");
	this.shape_16.setTransform(130.725,12);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f("#FFFFFF").s().p("Ag3BVIAAipIA0AAQAMAAAMADQALACAIAHQAIAFAEAJQAEAJAAANQAAAMgEAJQgFAJgIAGQgJAFgLADQgLACgMABIgbAAIAABKgAgfgJIAZAAQAIAAAHgBQAHgCAFgDQAGgEADgFQACgFAAgHQAAgIgDgGQgDgEgFgEQgFgDgHgBQgHgCgIAAIgZAAg");
	this.shape_17.setTransform(115.175,12);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#FFFFFF").s().p("AAuBVIguhIIguBIIgdAAIA9hZIg2hQIAcAAIAoA/IAog/IAcAAIg2BQIA+BZg");
	this.shape_18.setTransform(97.3,12);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#FFFFFF").s().p("Ag3BVIAAipIBsAAIAAAVIhUAAIAAAzIBPAAIAAATIhPAAIAAA5IBXAAIAAAVg");
	this.shape_19.setTransform(79.875,12);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup, new cjs.Rectangle(-2,-5.5,266.9,151.9), null);


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

	// Layer_3
	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#162B75").s().p("AgKAqIAAgkIgfgvIAZAAIARAfIASgfIAXAAIggAvIAAAkg");
	this.shape_20.setTransform(71.65,10.25);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#162B75").s().p("AAXAqIgHgQIggAAIgGAQIgWAAIAjhTIATAAIAjBTgAAKAJIgKgcIgKAcIAUAAg");
	this.shape_21.setTransform(63.325,10.25);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#162B75").s().p("AARAqIgRg4IgQA4IgUAAIgZhTIAXAAIANA3IAAAAIAQg3IAUAAIAPA3IAAAAIAOg3IAWAAIgZBTg");
	this.shape_22.setTransform(52.8,10.25);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#162B75").s().p("AAXAqIgHgQIggAAIgGAQIgWAAIAjhTIATAAIAjBTgAAKAJIgKgcIgKAcIAUAAg");
	this.shape_23.setTransform(42.325,10.25);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#162B75").s().p("AgJAqIAAhCIgYAAIAAgRIBDAAIAAARIgYAAIAABCg");
	this.shape_24.setTransform(31.475,10.25);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#162B75").s().p("AgcAqIAAhTIA4AAIAAARIglAAIAAAQIAjAAIAAAPIgjAAIAAASIAmAAIAAARg");
	this.shape_25.setTransform(24.6,10.25);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#162B75").s().p("AgLAqQgJgEgGgFQgGgGgDgJQgEgIAAgKQAAgJAEgJQADgIAGgFQAHgHAIgCQAIgDAJgBQAKABAJADQAIACAGAGIgNAOQgDgDgFgCQgFgCgGgBQgGABgDACQgFACgDADQgDAEgCAEQgCAFAAAFQAAAGACAFQABAFAEADQADADAFACQAEACAGAAIAHAAIAGgCIAAgPIgRAAIAAgPIAkAAIAAAsQgHADgIABQgIACgKAAQgJAAgJgCg");
	this.shape_26.setTransform(16.025,10.25);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#E1F8FE").s().p("AlQBoQgsABgegfQgfgfAAgrQAAgrAfgeQAegeAsgBIKhAAQArABAfAeQAfAeAAArQAAArgfAfQgfAfgrgBg");
	this.shape_27.setTransform(44.175,10.45);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup_1, new cjs.Rectangle(-1.2,0,89.7,20.9), null);


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

	// FlashAICB
	this.instance = new lib.ClipGroup();
	this.instance.setTransform(109.8,52.6,0.7772,0.7772,0,0,0,131.6,72.8);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ClipGroup_2, new cjs.Rectangle(6,-8.2,207.4,118), null);


// stage content:
(lib._300x250 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = false; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.actionFrames = [149];
	// timeline functions:
	this.frame_149 = function() {
		this.stop()
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(149).call(this.frame_149).wait(1));

	// border
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#CCCCCC").ss(1,1,1).p("A3WzcMAutAAAMAAAAm5MgutAAAg");
	this.shape.setTransform(150,125);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(150));

	// CTA
	this.instance = new lib.ClipGroup_1();
	this.instance.setTransform(239.65,233.65,0.8688,0.8683,0,0,0,45,11.5);
	this.instance.alpha = 0;
	this.instance._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(134).to({_off:false},0).to({alpha:1},9,cjs.Ease.get(1)).wait(7));

	// offer
	this.instance_1 = new lib.ClipGroup_2();
	this.instance_1.setTransform(94.05,190.9,0.6974,0.6961,0,0,0,111.5,31.7);
	this.instance_1.alpha = 0;
	this.instance_1._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(119).to({_off:false},0).to({alpha:1},15,cjs.Ease.get(1)).wait(16));

	// uor
	this.instance_2 = new lib.uor();
	this.instance_2.setTransform(239.75,209.2,0.49,0.4894,0,0,0,0.4,0.6);

	this.timeline.addTween(cjs.Tween.get(this.instance_2).wait(99).to({y:186.95},20,cjs.Ease.get(-1)).wait(31));

	// text01
	this.instance_3 = new lib.txt01();
	this.instance_3.setTransform(96.95,208.95);

	this.timeline.addTween(cjs.Tween.get(this.instance_3).wait(44).to({y:155.7,alpha:0},15,cjs.Ease.get(1)).to({_off:true},1).wait(90));

	// text02
	this.instance_4 = new lib.txt02();
	this.instance_4.setTransform(94.5,283.65);
	this.instance_4._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_4).wait(44).to({_off:false},0).to({y:209.1},15,cjs.Ease.get(1)).wait(40).to({alpha:0},15).to({_off:true},1).wait(35));

	// udxBLUE
	this.instance_5 = new lib.udxBLUE();
	this.instance_5.setTransform(149.85,170);

	this.timeline.addTween(cjs.Tween.get(this.instance_5).wait(99).to({y:150},20).wait(31));

	// img03
	this.instance_6 = new lib.img03();
	this.instance_6.setTransform(0,201.05);
	this.instance_6._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_6).wait(99).to({_off:false},0).to({y:0},26,cjs.Ease.get(1)).wait(25));

	// img02
	this.instance_7 = new lib.img02_1();
	this.instance_7.setTransform(150.5,255,1,1,0,0,0,150.5,85);
	this.instance_7._off = true;

	this.timeline.addTween(cjs.Tween.get(this.instance_7).wait(44).to({_off:false},0).to({y:85},15,cjs.Ease.get(0.99)).wait(91));

	// img01
	this.instance_8 = new lib.img01();

	this.timeline.addTween(cjs.Tween.get(this.instance_8).wait(44).to({regX:1.6,regY:-0.1,x:1.6,y:-88.1},15).wait(91));

	this._renderFirstFrame();

}).prototype = p = new lib.AnMovieClip();
p.nominalBounds = new cjs.Rectangle(149.5,37,153,334.1);
// library properties:
lib.properties = {
	id: '764483616A084AC483D80530E5014F02',
	width: 300,
	height: 250,
	fps: 30,
	color: "#162B75",
	opacity: 1.00,
	manifest: [
		{src:"images/BG.jpg", id:"BG"},
		{src:"images/img02.jpg", id:"img02"},
		{src:"images/IMG_1.jpg", id:"IMG_1"},
		{src:"images/IMG_3.jpg", id:"IMG_3"},
		{src:"images/unistudios_orlandoresort_rgb.png", id:"unistudios_orlandoresort_rgb"}
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
an.compositions['764483616A084AC483D80530E5014F02'] = {
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