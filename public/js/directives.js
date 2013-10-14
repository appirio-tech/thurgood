'use strict';

/* Directives */

var module = angular.module('thurgoodApp.directives', []);

module.directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        scope.$apply(function() {
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
});

module.directive('loadingContainer', function() {
  return {
    restrict: 'A',
    scope: false,
    link: function(scope, element, attrs) {
      var loadingLayer = $('<div class="loading"></div>').appendTo(element);
      $(element).addClass('loading-container');
      scope.$watch(attrs.loadingContainer, function(value) {
        loadingLayer.toggle(value);
      });
    }
  };
})