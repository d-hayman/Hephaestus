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
var tempidC = 1;

//configure new shelf unit
function configureUnit(sUnit){
  sUnit.set('height', dfHeight);
  sUnit.set('width', dfWidth);
  sUnit.set('depth', dfDepth);
  sUnit.set('rows', diRows);
  sUnit.set('columns', diColumns);
  sUnit.set('recess', dfRecess);
  sUnit.set('bottom', dbBottom);
  sUnit.set('position', tempidC++);
}

//behind the scenes rendering vars
var woodThickness = .67;
var minThickness = .5;
var maxThickness = 1;
    
function generatesvg(model, selected){
  var t = woodThickness;
  
  function generateshelfUnit(height, width, rows, columns, bottom){
	this.models = {};
	//generate shelves
    for(var c = 0; c <= columns; c++){
      this.models["wall"+c] =  makerjs.$(new makerjs.models.Rectangle( t, (t+height)*rows+(bottom?t:0) ))
               .move([(width+t)*c, 0])
               .$result;
    }
    for(var r = (bottom?0:1); r <= rows; r++){
      this.models["shelf"+r] = makerjs.$(new makerjs.models.Rectangle((t+width)*columns+t, t))
               .move([0, (height+t)*r - (bottom?0:t) ])
               .$result;
    }
  }
  
  function makeArrow(x, y){
    var temp = {
      paths: {
        left: new makerjs.paths.Line([x - 1, y+2], [x, y+1]),
        right: new makerjs.paths.Line([x, y+1], [x+1, y+2])
      }
    };
	this.models = {
      arrow: makerjs.model.expandPaths(temp, 0.25)
	}
  }

  //set up shelves object
  var shelves = {
    models: {},
	paths:{},
    units: makerjs.unitType.Inch
  };
  
  //generate shelf units and collect size data
  var totalWidth = 0;
  var totalHeight = 0;
  var minHeight = 0;
  var maxHeight = 0;
  var minWidth = 0;
  var maxWidth = 0;
  var shelfUnits = model.get('shelfUnits');
  var unitCenter = null;
  var highlightedSection = null;
  shelfUnits.forEach((shelfUnit, index) => {
	let height = parseFloat(shelfUnit.get('height'));
	let width = parseFloat(shelfUnit.get('width'));
	let rows = parseInt(shelfUnit.get('rows'));
	let columns = parseInt(shelfUnit.get('columns'));
	let bottom = shelfUnit.get('bottom');
    shelves.models["unit"+index] = makerjs.model.move(new generateshelfUnit(height, width, rows, columns, bottom), [totalWidth, 0]);
	if(index == selected-1){
      unitCenter = totalWidth+((t+width)*columns+t)/2;
	  highlightedSection = makerjs.cloneObject(shelves.models["unit"+index]);
      highlightedSection.layer = "blue";
	}
	//collect measurements
	totalWidth += (width+t) * columns;
	totalHeight = Math.max(totalHeight, (height+t) * rows + (bottom?t:0));
	minHeight = Math.max(minHeight, (height+minThickness) * rows + (bottom?minThickness:0));
	maxHeight = Math.max(maxHeight, (height+maxThickness) * rows + (bottom?maxThickness:0));
	minWidth += (parseFloat(shelfUnit.get('width'))+minThickness) * parseInt(shelfUnit.get('columns'));
	maxWidth += (parseFloat(shelfUnit.get('width'))+maxThickness) * parseInt(shelfUnit.get('columns'));
  });
  //add last wall to measurements
  totalWidth+=t; minWidth+=minThickness; maxWidth+=maxThickness;
  
  //generate visual guides
  shelves.paths["heightguide"] = new makerjs.paths.Line([-1, 0], [-1, totalHeight]);
  shelves.paths["widthguide"] = new makerjs.paths.Line([0, -1], [totalWidth, -1]);
  if(unitCenter != null){
    shelves.models['arrow'] = new makeArrow(unitCenter, totalHeight);
	shelves.models.arrow.layer = "blue";
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
  
  if(highlightedSection != null)
    shelves.models['highlighted'] = highlightedSection;

  return  {svg: makerjs.exporter.toSVG(shelves), minHeight: minHeight, maxHeight: maxHeight, minWidth: minWidth, maxWidth: maxWidth};
}

//begin core controller logic
export default Controller.extend(Ember.TargetActionSupport, {
  showsvgout: false,
  hidesvgout: computed('showsvgout', function() {
    let showsvgout = this.get('showsvgout');
    return showsvgout?'':'hideme';
  }),
  
  spzInstance: 'w',
  
  currentUnit: null,
  
  heightRange: computed('renderData.{minHeight,maxHeight}', function() { 
    return ''+this.get('renderData').minHeight+' - '+this.get('renderData').maxHeight+' Inches';
  }),
  widthRange: computed('renderData.{minWidth,maxWidth}', function() { 
    return ''+this.get('renderData').minWidth+' - '+this.get('renderData').maxWidth+' Inches'; 
  }),
  svg: computed('renderData.svg', function() { return this.get('renderData').svg; }),
  renderData: computed('model.shelfUnits.@each.{height,width,depth,rows,columns,recess,bottom}', 'currentUnit', function() {
    let model = this.get('model');
	let currentUnit = this.get('currentUnit');
    return generatesvg(model, currentUnit);
  }),

  init: function () {//set SVGPanZoom after svg has finished rendering
    this._super();
    scheduleOnce("afterRender",this,function() {
      this.set('spzInstance',spz(document.querySelector('#svgView')));
      document.body.addEventListener('zoom', function(e) {
        instrument('zoom', e);// We can't just access controller data here so tell route to tell controller to change the text size
      }, true);
      this.triggerAction({
        action:'addUnit',
        target: this
      });
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
	},
	addUnit(){//creates a new shelf unit with default values
      let sSeries = this.get('model');
      let sUnit = this.store.createRecord('shelf-unit');
      configureUnit(sUnit);
      sSeries.get('shelfUnits').addObject(sUnit);
      scheduleOnce("afterRender",this,function() {
        this.send('setSelection', sUnit.position);
      });
	},
	removeUnit(){//removes selected units, rolls back the counter, and updates positions of subsequent units
      let pos = this.get('currentUnit');
      let shelfUnits = this.get('model').get('shelfUnits');
      let found = null;
      shelfUnits.forEach((shelfUnit) => {
        if(shelfUnit.position == pos){
          found = shelfUnit;
          tempidC--;
		}
		else if (found != null){
			shelfUnit.set('position', shelfUnit.position-1);
		}
      });
      shelfUnits.removeObject(found);
      scheduleOnce("afterRender",this,function() {
        this.send('setSelection', pos-1);
      });
	},
	insertUnit(){//inserts a unit after the selected unit, cleans all positions
      let pos = this.get('currentUnit');
      if(pos < 1)
        return;
      let sUnit = this.store.createRecord('shelf-unit');
      configureUnit(sUnit);
      let shelfUnits = this.get('model').get('shelfUnits');
      shelfUnits.insertAt(pos,sUnit);
      shelfUnits.forEach((shelfUnit, index) => {
        shelfUnit.set('position',index+1);
      });
      scheduleOnce("afterRender",this,function() {
        this.send('setSelection', parseInt(pos)+1 );
      });
	},
	setSelection(selected){
      this.set('currentUnit', selected);
      let shelfUnits = this.get('model').get('shelfUnits');
      shelfUnits.forEach((shelfUnit) => {
        if(shelfUnit.position != selected)
          shelfUnit.set('hideUnselected', "hideme");
        else
          shelfUnit.set('hideUnselected', "");
      });
	}
  }
});
