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
               .move([0, (h+t)*r - (bottom?0:t) ])
               .$result;
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
