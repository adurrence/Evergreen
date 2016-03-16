/**
  * UI tools and directives.
  */
angular.module('egUiMod', ['egCoreMod', 'ui.bootstrap'])


/**
 * <input focus-me="iAmOpen"/>
 * $scope.iAmOpen = true;
 */
.directive('focusMe', 
       ['$timeout','$parse', 
function($timeout , $parse) {
    return {
        link: function(scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function(value) {
                if(value === true) 
                    $timeout(function() {element[0].focus()});
            });
            element.bind('blur', function() {
                scope.$apply(model.assign(scope, false));
            })
        }
    };
}])

/**
 * <input blur-me="pleaseBlurMe"/>
 * $scope.pleaseBlurMe = true
 * Useful for de-focusing when no other obvious focus target exists
 */
.directive('blurMe', 
       ['$timeout','$parse', 
function($timeout , $parse) {
    return {
        link: function(scope, element, attrs) {
            var model = $parse(attrs.blurMe);
            scope.$watch(model, function(value) {
                if(value === true) 
                    $timeout(function() {element[0].blur()});
            });
            element.bind('focus', function() {
                scope.$apply(model.assign(scope, false));
            })
        }
    };
}])


// <input select-me="iWantToBeSelected"/>
// $scope.iWantToBeSelected = true;
.directive('selectMe', 
       ['$timeout','$parse', 
function($timeout , $parse) {
    return {
        link: function(scope, element, attrs) {
            var model = $parse(attrs.selectMe);
            scope.$watch(model, function(value) {
                if(value === true) 
                    $timeout(function() {element[0].select()});
            });
            element.bind('blur', function() {
                scope.$apply(model.assign(scope, false));
            })
        }
    };
}])


// 'reverse' filter 
// <div ng-repeat="item in items | reverse">{{item.name}}</div>
// http://stackoverflow.com/questions/15266671/angular-ng-repeat-in-reverse
// TODO: perhaps this should live elsewhere
.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
})


/**
 * egAlertDialog.open({message : 'hello {{name}}'}).result.then(
 *     function() { console.log('alert closed') });
 */
.factory('egAlertDialog', 

        ['$uibModal','$interpolate',
function($uibModal , $interpolate) {
    var service = {};

    service.open = function(message, msg_scope) {
        return $uibModal.open({
            templateUrl: './share/t_alert_dialog',
            controller: ['$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                    $scope.message = $interpolate(message)(msg_scope);
                    $scope.ok = function() {
                        if (msg_scope && msg_scope.ok) msg_scope.ok();
                        $uibModalInstance.close()
                    }
                }
            ]
        });
    }

    return service;
}])

/**
 * egConfirmDialog.open("some message goes {{here}}", {
 *  here : 'foo', ok : function() {}, cancel : function() {}},
 *  'OK', 'Cancel');
 */
.factory('egConfirmDialog', 
    
       ['$uibModal','$interpolate',
function($uibModal, $interpolate) {
    var service = {};

    service.open = function(title, message, msg_scope, ok_button_label, cancel_button_label) {
        return $uibModal.open({
            templateUrl: './share/t_confirm_dialog',
            controller: ['$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                    $scope.title = $interpolate(title)(msg_scope);
                    $scope.message = $interpolate(message)(msg_scope);
                    $scope.ok_button_label = $interpolate(ok_button_label || '')(msg_scope);
                    $scope.cancel_button_label = $interpolate(cancel_button_label || '')(msg_scope);
                    $scope.ok = function() {
                        if (msg_scope.ok) msg_scope.ok();
                        $uibModalInstance.close()
                    }
                    $scope.cancel = function() {
                        if (msg_scope.cancel) msg_scope.cancel();
                        $uibModalInstance.dismiss();
                    }
                }
            ]
        })
    }

    return service;
}])

/**
 * egPromptDialog.open(
 *    "prompt message goes {{here}}", 
 *    promptValue,  // optional
 *    {
 *      here : 'foo',  
 *      ok : function(value) {console.log(value)}, 
 *      cancel : function() {console.log('prompt denied')}
 *    }
 *  );
 */
.factory('egPromptDialog', 
    
       ['$uibModal','$interpolate',
function($uibModal, $interpolate) {
    var service = {};

    service.open = function(message, promptValue, msg_scope) {
        return $uibModal.open({
            templateUrl: './share/t_prompt_dialog',
            controller: ['$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                    $scope.message = $interpolate(message)(msg_scope);
                    $scope.args = {value : promptValue || ''};
                    $scope.focus = true;
                    $scope.ok = function() {
                        if (msg_scope.ok) msg_scope.ok($scope.args.value);
                        $uibModalInstance.close()
                    }
                    $scope.cancel = function() {
                        if (msg_scope.cancel) msg_scope.cancel();
                        $uibModalInstance.dismiss();
                    }
                }
            ]
        })
    }

    return service;
}])

/**
 * Warn on page unload and give the user a chance to avoid navigating
 * away from the current page.  
 * Only one handler is supported per page.
 * NOTE: we can't use an egUnloadDialog as the dialog builder, because
 * it renders asynchronously, which allows the page to redirect before
 * the dialog appears.
 */
.factory('egUnloadPrompt', [
        '$window','egStrings', 
function($window , egStrings) {
    var service = {attached : false};

    // attach a page/scope unload prompt
    service.attach = function($scope, msg) {
        if (service.attached) return;
        service.attached = true;

        // handle page change
        $($window).on('beforeunload', function() { 
            service.clear();
            return msg || egStrings.EG_UNLOAD_PAGE_PROMPT_MSG;
        });

        if (!$scope) return;

        // If a scope was provided, attach a scope-change handler,
        // similar to the page-page prompt.
        service.locChangeCancel = 
            $scope.$on('$locationChangeStart', function(evt, next, current) {
            if (confirm(msg || egStrings.EG_UNLOAD_CTRL_PROMPT_MSG)) {
                // user allowed the page to change.  
                // Clear the unload handler.
                service.clear();
            } else {
                evt.preventDefault();
            }
        });
    };

    // remove the page unload prompt
    service.clear = function() {
        $($window).off('beforeunload');
        if (service.locChangeCancel)
            service.locChangeCancel();
        service.attached = false;
    }

    return service;
}])

.directive('aDisabled', function() {
    return {
        restrict : 'A',
        compile: function(tElement, tAttrs, transclude) {
            //Disable ngClick
            tAttrs["ngClick"] = ("ng-click", "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")");

            //Toggle "disabled" to class when aDisabled becomes true
            return function (scope, iElement, iAttrs) {
                scope.$watch(iAttrs["aDisabled"], function(newValue) {
                    if (newValue !== undefined) {
                        iElement.toggleClass("disabled", newValue);
                    }
                });

                //Disable href on click
                iElement.on("click", function(e) {
                    if (scope.$eval(iAttrs["aDisabled"])) {
                        e.preventDefault();
                    }
                });
            };
        }
    };
})

.directive('egBasicComboBox', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            list: "=", // list of strings
            selected: "=",
            egDisabled: "="
        },
        template:
            '<div class="input-group">'+
                '<input type="text" ng-disabled="egDisabled" class="form-control" ng-model="selected" ng-change="makeOpen()">'+
                '<div class="input-group-btn" dropdown ng-class="{open:isopen}">'+
                    '<button type="button" ng-click="showAll()" class="btn btn-default dropdown-toggle"><span class="caret"></span></button>'+
                    '<ul class="dropdown-menu dropdown-menu-right">'+
                        '<li ng-repeat="item in list|filter:selected"><a href ng-click="changeValue(item)">{{item}}</a></li>'+
                        '<li ng-if="all" class="divider"><span></span></li>'+
                        '<li ng-if="all" ng-repeat="item in list"><a href ng-click="changeValue(item)">{{item}}</a></li>'+
                    '</ul>'+
                '</div>'+
            '</div>',
        controller: ['$scope','$filter',
            function( $scope , $filter) {

                $scope.all = false;
                $scope.isopen = false;

                $scope.showAll = function () {
                    if ($scope.selected.length > 0)
                        $scope.all = true;
                }

                $scope.makeOpen = function () {
                    $scope.isopen = $filter('filter')(
                        $scope.list,
                        $scope.selected
                    ).length > 0 && $scope.selected.length > 0;
                    $scope.all = false;
                }

                $scope.changeValue = function (newVal) {
                    $scope.selected = newVal;
                    $scope.isopen = false;
                }

            }
        ]
    };
})

/**
 * Nested org unit selector modeled as a Bootstrap dropdown button.
 */
.directive('egOrgSelector', function() {
    return {
        restrict : 'AE',
        transclude : true,
        replace : true, // makes styling easier
        scope : {
            selected : '=', // defaults to workstation or root org,
                            // unless the nodefault attibute exists

            // Each org unit is passed into this function and, for
            // any org units where the response value is true, the
            // org unit will not be added to the selector.
            hiddenTest : '=',

            // Each org unit is passed into this function and, for
            // any org units where the response value is true, the
            // org unit will not be available for selection.
            disableTest : '=',

            // if set to true, disable the UI element altogether
            alldisabled : '@',

            // Caller can either $watch(selected, ..) or register an
            // onchange handler.
            onchange : '=',

            // optional primary drop-down button label
            label : '@',

            // optional name of settings key for persisting
            // the last selected org unit
            stickySetting : '@'
        },

        // any reason to move this into a TT2 template?
        template : 
            '<div class="btn-group eg-org-selector" dropdown>'
            + '<button type="button" class="btn btn-default dropdown-toggle" ng-disabled="disable_button">'
             + '<span style="padding-right: 5px;">{{getSelectedName()}}</span>'
             + '<span class="caret"></span>'
           + '</button>'
           + '<ul class="dropdown-menu scrollable-menu">'
             + '<li ng-repeat="org in orgList" ng-hide="hiddenTest(org.id)">'
               + '<a href ng-click="orgChanged(org)" a-disabled="disableTest(org.id)" '
                 + 'style="padding-left: {{org.depth * 10 + 5}}px">'
                 + '{{org.shortname}}'
               + '</a>'
             + '</li>'
           + '</ul>'
          + '</div>',

        controller : ['$scope','$timeout','egOrg','egAuth','egCore','egStartup',
              function($scope , $timeout , egOrg , egAuth , egCore , egStartup) {

            if ($scope.alldisabled) {
                $scope.disable_button = $scope.alldisabled == 'true' ? true : false;
            } else {
                $scope.disable_button = false;
            }

            $scope.egOrg = egOrg; // for use in the link function
            $scope.egAuth = egAuth; // for use in the link function
            $scope.hatch = egCore.hatch // for use in the link function

            // avoid linking the full fleshed tree to the scope by 
            // tossing in a flattened list.
            // --
            // Run-time code referencing post-start data should be run
            // from within a startup block, otherwise accessing this
            // module before startup completes will lead to failure.
            egStartup.go().then(function() {

                $scope.orgList = egOrg.list().map(function(org) {
                    return {
                        id : org.id(),
                        shortname : org.shortname(), 
                        depth : org.ou_type().depth()
                    }
                });

                if (!$scope.selected)
                    $scope.selected = egOrg.get(egAuth.user().ws_ou());
            });

            $scope.getSelectedName = function() {
                if ($scope.selected && $scope.selected.shortname)
                    return $scope.selected.shortname();
                return $scope.label;
            }

            $scope.orgChanged = function(org) {
                $scope.selected = egOrg.get(org.id);
                if ($scope.stickySetting) {
                    egCore.hatch.setLocalItem($scope.stickySetting, org.id);
                }
                if ($scope.onchange) $scope.onchange($scope.selected);
            }

        }],
        link : function(scope, element, attrs, egGridCtrl) {

            // boolean fields are presented as value-less attributes
            angular.forEach(
                ['nodefault'],
                function(field) {
                    if (angular.isDefined(attrs[field]))
                        scope[field] = true;
                    else
                        scope[field] = false;
                }
            );

            if (scope.stickySetting) {
                var orgId = scope.hatch.getLocalItem(scope.stickySetting);
                if (orgId) {
                    scope.selected = scope.egOrg.get(orgId);
                }
            }

            if (!scope.selected && !scope.nodefault)
                scope.selected = scope.egOrg.get(scope.egAuth.user().ws_ou());
        }

    }
})

/* http://eric.sau.pe/angularjs-detect-enter-key-ngenter/ */
.directive('egEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.egEnter);
                });
 
                event.preventDefault();
            }
        });
    };
})

/*
* Handy wrapper directive for uib-datapicker-popup
*/
.directive(
    'egDateInput', ['egStrings',
    function(egStrings) {
        return {
            scope : {
                closeText : '@',
                ngModel : '=',
                ngChange : '=',
                ngBlur : '=',
                ngDisabled : '=',
                ngRequired : '=',
                hideDatePicker : '='
            },
            require: 'ngModel',
            templateUrl: './share/t_datetime',
            replace: true,
            link : function(scope, elm, attrs) {
                if (!scope.closeText)
                    scope.closeText = egStrings.EG_DATE_INPUT_CLOSE_TEXT;

                if ('showTimePicker' in attrs)
                    scope.showTimePicker = true;
            }
        };
    }
])
