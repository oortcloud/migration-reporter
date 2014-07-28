Versions = new Meteor.Collection('versions')

if (Meteor.isClient) {
  Meteor.subscribe('counts');
  Meteor.subscribe('errorVersions');
  
  UI.registerHelper('count', function(name) {
    console.log(name)
    return Counts.get(name);
  });
  
  Template.errorVersionsTable.helpers({
    versions: function() {
      return Versions.find({error: {$exists: true}});
    }
  })
}

if (Meteor.isServer) {
  Versions._ensureIndex({name: 1, version: 1}, {unique: true});
  
  Meteor.publish('counts', function() {
    publishCount(this, 'allVersions', Versions.find({}, {fields: {_id: true}}));
    publishCount(this, 'completeVersions', Versions.find({complete: true}, {fields: {_id: true}}));
    publishCount(this, 'errorVersions', Versions.find({errors: {$exists: true}}, {fields: {_id: true}}));
  });
  
  Meteor.publish('errorVersions', function() {
    return Versions.find({errors: {$exists: true}});
  });
}
