import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  hangover: DS.attr('number'),
  bottomhang: DS.attr('boolean'),
  shelfUnits: DS.hasMany('shelf-unit')
});
