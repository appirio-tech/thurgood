'use strict';

/* Directives */

var module = angular.module('thurgoodApp.directives', []);


/*
 * catches enter key event and execute function.
 * Example : 
 *   <input type="text" ng-model="query" ng-enter="search()">
 */
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

/*
 * adds loading overlay to the element and shows while the value is true
 * Example : 
 *   <div loading-container="loading">
 *      ...
 *   </div>
 *   => shows loading overlay while $scope.loading is true.
 */
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