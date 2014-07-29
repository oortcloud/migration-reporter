Versions = new Meteor.Collection('versions')

if (Meteor.isClient) {
  Meteor.subscribe('counts');
  Meteor.subscribe('errorVersions');
  
  UI.registerHelper('count', function(name) {
    return Counts.get(name);
  });
  
  UI.registerHelper('truncateLines', function(message) {
    var lines = _.filter(message.split('\n'), function(line) {
      return ! line.match(/^\s*$/);
    });
    return lines.splice(0,2).join('\n');
  })
  
  Template.errorVersionsTable.helpers({
    versions: function() {
      return Versions.find({error: {$exists: true}});
    },
    
    expand: function() {
      return Session.equals('expanded', EJSON.stringify(_.pick(this, 'name', 'version')));
    }
  });
  
  Template.errorVersionsTable.events({
    'click tr': function() {
      Session.set('expanded', EJSON.stringify(_.pick(this, 'name', 'version')));
    }
  })
}

if (Meteor.isServer) {
  Versions._ensureIndex({name: 1, version: 1}, {unique: true});
  
  Meteor.publish('counts', function() {
    publishCount(this, 'allVersions', Versions.find({}, {fields: {_id: true}}));
    publishCount(this, 'completeVersions', Versions.find({complete: true}, {fields: {_id: true}}));
    publishCount(this, 'errorVersions', Versions.find({error: {$exists: true}}, {fields: {_id: true}}));
  });
  
  Meteor.publish('errorVersions', function() {
    return Versions.find({error: {$exists: true}});
  });
}
