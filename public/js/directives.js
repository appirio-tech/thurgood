/**
 * Angular directives
 */
var thurgood = angular.module('thurgoodDirectives', []);

/**
 * Directive for the top navigation bar
 */
thurgood.directive("bootstrapNavbar", function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    templateUrl: 'views/directives/navbar.html'
  };
});

/**
 * Directive for the footer
 */
thurgood.directive("bootstrapFooter", function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    templateUrl: 'views/directives/footer.html'
  };
});
