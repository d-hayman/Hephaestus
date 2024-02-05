import DS from 'ember-data';

export default DS.Model.extend({
  height: DS.attr('number'),
  width: DS.attr('number'),
  depth: DS.attr('number'),
  rows: DS.attr('number'),
  columns: DS.attr('number'),
  recess: DS.attr('number'),
  bottom: DS.attr('boolean'),
  position: DS.attr('number'),
  
  shelfSeries: DS.belongsTo('shelf-series')
});
