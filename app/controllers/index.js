import Controller from '@ember/controller';
import {computed} from '@ember/object';
//import {observer} from '@ember/object';
import {scheduleOnce} from '@ember/runloop';

//import makerjs from 'browser.maker';
var makerjs = window.require('makerjs');
var spz = window.panzoom;
//var spzInstance = '';

var woodThickness = .67;
var scaleFactor = 1; //deprecated due to finding a superior zoom library
    
function generatesvg(height, width, depth, rows, columns, recess, bottom){
  var h = height*scaleFactor;
  var w = width*scaleFactor;
  var t = woodThickness * scaleFactor;
  
  /*
   * Generates a "shelf" for the display model, which is at least a top and a right side
   * The leftmost column in a stack should have left set to true so that the leftmost wall generates
   * All shelves with a bottom should have bottom set to true and be positioned to overlap said bottom by thickness
   * The only shelves that don't have a bottom are bottom row shelves when bottom is unchecked for the whole unit
   */
  function generateshelf(origin, height, width, thickness, left, bottom) {
    this.models = {
      recttop: makerjs.$(new makerjs.models.Rectangle(width+(2*thickness), thickness))
               .move([0, height+(bottom?thickness:0) ])
               .$result,
      rectright: makerjs.$(new makerjs.models.Rectangle( thickness, height+(bottom?2*thickness:thickness) ))
               .move([width+thickness,0])
               .$result
    };
    if(left){
      this.models.rectleft = makerjs.$(new makerjs.models.Rectangle(thickness, height+(bottom?2*thickness:thickness) ))
               .move([0,0])
               .$result
    }
    this.origin = origin;
  }

  //set up shelves object
  var shelves = {
    models: {
      //debug: new generateshelf([0, 0], h, w, t, true, false)
    },
    units: makerjs.unitType.Inch
  };
  
  //generate shelves
  if(bottom){
    var bshelf = makerjs.$(new makerjs.models.Rectangle(columns*(w+t)+t,t)).move([0,0]).$result;
    shelves.models.bottomshelf = bshelf;
  }
  for(var c = 0; c < columns; c++){
    for(var r = 0; r < rows; r++){
      shelves.models["c"+c+"r"+r] = new generateshelf([(w+t)*c, r>0?((h+t)*r):bottom?0:t], h, w, t, c==0, r>0 || bottom)
	}
  }

  //generate bounding box
  //var bbox = makerjs.$(new makerjs.models.Rectangle(shelves, 5)).moveRelative([4,-4]).$result;
  //shelves.models.bbox = bbox;

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

  height: 5,
  width: 5,
  depth: 5,
  rows: 1,
  columns: 1,
  recess: 0,
  bottom: false,

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
      this.set('spzInstance',spz(document.querySelector('#svgView div')));
      this.get('spzInstance').zoomAbs(30, 50, 0.5);
    });
  },

  actions: {
    resetViewer() {
      var tmp = this.get('spzInstance');
      tmp.zoomAbs(30, 50, 0.5);
      tmp.moveTo(30,50);
    }
  }
});
