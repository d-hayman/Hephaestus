import Controller from '@ember/controller';
import {computed} from '@ember/object';
//import {observer} from '@ember/object';
import {scheduleOnce} from '@ember/runloop';
import {instrument} from '@ember/instrumentation';

//handles to 3rd party libs
var makerjs = window.require('makerjs');
var spz = window.panzoom;

//defaults
var dfScale = 0.5;
var dfPanX = 50;
var dfPanY = 50;
var dfHeight = 5.0;
var dfWidth = 5.0;
var dfDepth = 5.0;
var diRows = 1;
var diColumns = 1;
var dfRecess = 0.0;
var dbBottom = false;

//behind the scenes rendering vars
var woodThickness = .67;
var minThickness = .5;
var maxThickness = 1;
var scaleFactor = 1; //semi-deprecated due to finding a superior zoom library - keep at 1 unless a reason not to do so ever comes up
    
function generatesvg(height, width, depth, rows, columns, recess, bottom){
  //set scaled values from unscaled counterparts in case scaleFactor is ever used again
  var h = height*scaleFactor;
  var w = width*scaleFactor;
  var t = woodThickness * scaleFactor;

  //set up shelves object
  var shelves = {
    models: {
      //debug: new generateshelf([0, 0], h, w, t, true, false)
    },
    units: makerjs.unitType.Inch
  };
  
  //generate shelves
  for(var c = 0; c <= columns; c++){
    shelves.models["wall"+c] =  makerjs.$(new makerjs.models.Rectangle( t, (t+h)*rows+(bottom?t:0) ))
               .move([(w+t)*c, 0])
               .$result;
  }
  for(var r = (bottom?0:1); r <= rows; r++){
    shelves.models["shelf"+r] = makerjs.$(new makerjs.models.Rectangle((t+w)*columns+t, t))
               .move([0, (h+t)*r - (bottom?0:t) ]) //for a fun time, reintroduce rendering bugs by removing "- (bottom?0:t)" and commenting out the cleanup steps below. This is a good way to demonstrate how cleanup fixes it.
               .$result;
  }
  
  //generate measurements
  shelves.paths = {
    "heightguide": new makerjs.paths.Line([-1, 0], [-1, (t+h)*rows+(bottom?t:0)]),
    "widthguide": new makerjs.paths.Line([0, -1], [(t+w)*columns+t, -1])
  };

  //generate bounding box
  //var bbox = makerjs.$(new makerjs.models.Rectangle(shelves, 5)).moveRelative([4,-4]).$result;
  //shelves.models.bbox = bbox;
  
  /* Clean up model for rendering
   * This seems to also serve as an alternate fix to the missing points bug that was fixed when the rendering logic was rewritten
   * so if the old rendering logic is brought back re-add this to it to keep the bug fixed
   */
  makerjs.model.originate(shelves);
  makerjs.model.simplify(shelves);

  return  makerjs.exporter.toSVG(shelves);
}

//begin core controller logic
export default Controller.extend(Ember.TargetActionSupport, {
  showsvgout: false,
  hidesvgout: computed('showsvgout', function() {
    let showsvgout = this.get('showsvgout');
    return showsvgout?'':'hideme';
  }),
  
  spzInstance: 'w',

  height: dfHeight,
  width: dfWidth,
  depth: dfDepth,
  rows: diRows,
  columns: diColumns,
  recess: dfRecess,
  bottom: dbBottom,
  
  heightRange: computed('height', 'rows', 'bottom', function() {
    let height = parseFloat(this.get('height'));
    let rows = parseInt(this.get('rows'));
    let bottom = this.get('bottom');
	var minHeight = (minThickness+height)*rows+(bottom?minThickness:0);
	var maxHeight = (maxThickness+height)*rows+(bottom?maxThickness:0);
	return ''+minHeight+' - '+maxHeight+' Inches';
  }),
  widthRange: computed('width', 'columns', function() {
    let width = parseFloat(this.get('width'));
    let columns = parseInt(this.get('columns'));
	var minWidth = (minThickness+width)*columns+minThickness;
	var maxWidth = (maxThickness+width)*columns+maxThickness;
    return ''+minWidth+' - '+maxWidth+' Inches';
  }),

  svg: computed('height', 'width', 'depth', 'rows', 'columns', 'recess', 'bottom', function() {
    let height = this.get('height');
    let width = this.get('width');
    let depth = this.get('depth');
    let rows = this.get('rows');
    let columns = this.get('columns');
    let recess = this.get('recess');
    let bottom = this.get('bottom');
    return generatesvg(parseFloat(height),
                       parseFloat(width),
                       parseFloat(depth),
                       parseInt(rows),
                       parseInt(columns),
                       parseFloat(recess),
                       bottom);
  }),

  init: function () {//set SVGPanZoom after svg has finished rendering
    this._super();
    scheduleOnce("afterRender",this,function() {
      this.set('spzInstance',spz(document.querySelector('#svgView')));
      document.body.addEventListener('zoom', function(e) {
        instrument('zoom', e);// We can't just access controller data here so tell route to tell controller to change the text size
      }, true);
      this.triggerAction({
        action:'resetViewer',
        target: this
      });
    });
  },

  actions: {
    resetViewer() {//reset button action
      var tmp = this.get('spzInstance');
      tmp.zoomAbs(dfPanX, dfPanY, dfScale);
      tmp.moveTo(dfPanX, dfPanY);
    },
	zoom(/*context*/){
		var tmp = this.get('spzInstance');
		document.querySelector('.svglabel-left').style.fontSize = ''+(14/tmp.getTransform().scale)+'pt';
		document.querySelector('.svglabel-bottom').style.fontSize = ''+(14/tmp.getTransform().scale)+'pt';
	}
  }
});
