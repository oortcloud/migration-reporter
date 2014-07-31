Versions = new Meteor.Collection('versions')

var KNOWN_ERROR_REGEXPS = {
  registeredAtAtmosphere: [ /Package already registered/ ],
  registeredAtTroposphere: [ /Version already exists/ ],
  awaitingDep: [ /No troposphere version of/ ],
  gitFailed: [ 
    /is this a git repository/, 
    /remote: Repository not found/, 
    /Could not find remote branch/,
    /The requested URL returned error/
  ],
  nonStandardPackageLibDir: [
    /No such file or directory - source\/smart.json/
  ],
  dependencyGone: [
    /couldn't find version/
  ],
  nonAtmosphereDeps: [
    /Can't migrate packages with non atmosphere dependencies/
  ],
  depNotInSmartJson: [
    /Cannot find anything about package/,
    // weak dependency
    /You must specify a version constraint for the following packages/
  ],
  badNpmDep: [
    /couldn't install npm package/
  ],
  buildError: [
    /While building the package/
  ],
  nonSemverVersion: [
    /The package version \(specified with Package.describe\) must be valid semver/
  ]
}

var errorMatches = function(regexps) {
  return {$or: _.map(regexps, function(r) { return {error: r}})};
}

var errorNotMatches = function(regexps) {
  return {$and: _.map(regexps, function(r) { return {error: {$not: r}}})};
}

if (Meteor.isClient) {
  Meteor.subscribe('counts');
  Meteor.subscribe('errorVersions');
  
  UI.registerHelper('count', function(name) {
    console.log(name.toString())
    return Counts.get(name.toString());
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
    
    knownErrorTypes: _.keys(KNOWN_ERROR_REGEXPS),
    
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
    var self = this;
    publishCount(this, 'allVersions', Versions.find({}, {fields: {_id: true}}));
    publishCount(this, 'completeVersions', Versions.find({complete: true}, {fields: {_id: true}}));
    _.each(KNOWN_ERROR_REGEXPS, function(regexps, name) {
      publishCount(self, name, 
        Versions.find(errorMatches(regexps)), {fields: {_id: true}});
    })
  });
  
  Meteor.publish('errorVersions', function() {
    var matcher = {$and: _.map(KNOWN_ERROR_REGEXPS, errorNotMatches)};
    return Versions.find(_.extend({error: {$exists: true}}, matcher));
  });
}
