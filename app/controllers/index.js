import Controller from '@ember/controller';
import {computed} from '@ember/object';
//import {observer} from '@ember/object';
import {scheduleOnce} from '@ember/runloop';

//import makerjs from 'browser.maker';
var makerjs = window.require('makerjs');
var spz = window.panzoom;
var oType = window.opentype;

//get the font object for total measurements and then alert the controller to update the render
var measureFont = null;
function initFont(controller){
  oType.load('./assets/fonts/Roboto-Black.ttf', function (err, font) {
    if (err) {
      //alert("failed to load measureFont");
    } else {
      measureFont = font;
      controller.set('mfFlag', true);
    }
  });
}

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
  
  if(measureFont){//friendly reminder to use scaled values (just in case) for actual coords but unscaled in text strings
    var minHeight = (minThickness+height)*rows+(bottom?minThickness:0);
	var maxHeight = (maxThickness+height)*rows+(bottom?maxThickness:0);
	var minWidth = (minThickness+width)*columns+minThickness;
	var maxWidth = (maxThickness+width)*columns+maxThickness;
    shelves.models.vertical = makerjs.$(new makerjs.models.Text(measureFont, ''+minHeight+' - '+maxHeight+' Inches', .3))
               .move([-4, ((t+h)*rows+(bottom?t:0))/2 ])
               .$result;
    shelves.models.horizontal = makerjs.$(new makerjs.models.Text(measureFont, ''+minWidth+' - '+maxWidth+'Inches', .3))
               .move([((t+w)*columns+t)/2, -1.5 ])
               .$result;
  }

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


//document.write(svg);

export default Controller.extend({
  showsvgout: false,
  hidesvgout: computed('showsvgout', function() {
    let showsvgout = this.get('showsvgout');
    return showsvgout?'':'hideme';
  }),
  
  spzInstance: 'w',
  mfFlag:false,

  height: 5,
  width: 5,
  depth: 5,
  rows: 1,
  columns: 1,
  recess: 0,
  bottom: false,

  svg: computed('mfFlag','height', 'width', 'depth', 'rows', 'columns', 'recess', 'bottom', function() {
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
      this.set('spzInstance',spz(document.querySelector('#svgView div')));
      this.get('spzInstance').zoomAbs(30, 50, 0.5);
      initFont(this);
    });
  },

  actions: {
    resetViewer() {//reset button action
      var tmp = this.get('spzInstance');
      tmp.zoomAbs(30, 50, 0.5);
      tmp.moveTo(30,50);
    }
  }
});
