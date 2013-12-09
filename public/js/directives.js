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


thurgood.directive('accessLevel', ['Auth', function(Auth) {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      var prevDisp = element.css('display');
      var access = Auth.accessLevels[attrs.accessLevel];

      $scope.user = Auth.user;
      $scope.$watch('user', function(user) {
        updateCSS();
      }, true);

      function updateCSS() {
        if(!Auth.isAccessible(access))
            element.css('display', 'none');
        else
            element.css('display', prevDisp);
      }
    }
  };
}]);