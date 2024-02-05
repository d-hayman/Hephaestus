import Route from '@ember/routing/route';
import {subscribe} from '@ember/instrumentation';

export default Route.extend({
  model(){
		return this.store.createRecord('shelf-unit');
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    subscribe("zoom", {
      before: function(name, timestamp, payload) {
        //console.log('Recieved ', name, ' at ' + timestamp + ' with payload: ', payload);
        controller.send('zoom', payload);//tell the controller that the controller told the route to tell the controller that a zoom done did happen
      },
      after: function() {}
    });
  }
});
