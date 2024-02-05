import Controller from '@ember/controller';
import {computed} from '@ember/object';

//import makerjs from 'browser.maker';
var makerjs = window.require('makerjs');
    
	//dump(mjs);
	function generatesvg(rectw, recth, ovalw, ovalh){
function mjexample(origin,rectw, recth, ovalw, ovalh) {
    this.models = {
        rect: new makerjs.models.Rectangle(rectw, recth),
        oval: makerjs.model.move(new makerjs.models.Oval(ovalw, ovalh), [50, 25])
    };
    this.origin = origin;
}

var mjexamples = {
    models: {
        x1: new mjexample([0, 0],rectw, recth, ovalw, ovalh),
        x2: new mjexample([200, 0],rectw, recth, ovalw, ovalh),
        x3: new mjexample([400, 0],rectw, recth, ovalw, ovalh),
        x4: new mjexample([500, 0],rectw, recth, ovalw, ovalh)
    }
};

//save us some typing :)
var x = mjexamples.models;

makerjs.model.combine(x.x2.models.rect, x.x2.models.oval, false, true, false, true);
makerjs.model.combine(x.x3.models.rect, x.x3.models.oval, false, true, true, false);
makerjs.model.combine(x.x4.models.rect, x.x4.models.oval, true, false, true, false);
//var test = makerjs.exporter.toSVG(mjexamples);
return  makerjs.exporter.toSVG(mjexamples);
	}
	

//document.write(svg);

export default Controller.extend({
	rectw: 100,
	recth: 50,
	ovalw: 100,
	ovalh: 50,
	svg: computed('rectw', 'recth', 'ovalw', 'ovalh', function() {
		let rectw = this.get('rectw');
		let recth = this.get('recth');
		let ovalw = this.get('ovalw');
		let ovalh = this.get('ovalh');
		return generatesvg(parseInt(rectw),parseInt(recth),parseInt(ovalw),parseInt(ovalh));
	})
});
