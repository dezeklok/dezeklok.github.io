(function () {
    var app = angular.module("cmodule", ['ngSanitize', 'angularRangeSlider', 'cmodule.filters', 'ngRoute'], function ($httpProvider) {
        // Use x-www-form-urlencoded Content-Type
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

        /**
         * The workhorse; converts an object to x-www-form-urlencoded serialization.
         * @param {Object} obj
         * @return {String}
         */
        var param = function (obj) {
            var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

            for (name in obj) {
                value = obj[name];

                if (value instanceof Array) {
                    for (i = 0; i < value.length; ++i) {
                        subValue = value[i];
                        fullSubName = name + '[' + i + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value instanceof Object) {
                    for (subName in value) {
                        subValue = value[subName];
                        fullSubName = name + '[' + subName + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value !== undefined && value !== null)
                    query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
            }

            return query.length ? query.substr(0, query.length - 1) : query;
        };

        // Override $http service's default transformRequest
        $httpProvider.defaults.transformRequest = [function (data) {
                return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
            }];
    });

    app.config(function ($routeProvider) {
        $routeProvider
                // route for the home page
                .otherwise({
                    templateUrl: site_url + 'visitors/chatbox/getbox',
                    controller: 'BodyController'
                })
    });

    app.controller("BodyController", function ($http, $scope, $interval, $timeout, $location, $document) {
        $scope.windowTitle = $document[0].title;
        $scope.chatboxTitle = '';
        $scope.chatboxState = '';

        $scope.user_agent = 'browser';
        $scope.message_stored = [];
        $scope.settings = {'theme': ''};
        $scope.custom_styles = '';
        $scope.visible_widget = 'start';
        $scope.is_agents_online = false;
        $scope.is_scroll_start = false;
        $scope.is_scrollable = true;
        $scope.is_typing = false;
        $scope.is_waiting = false;
        $scope.minimized = false;
        $scope.offline_request_sent = false;
        $scope.feedback_sent = false;
        $scope.ask_for_transcript = 'no';
        $scope.ask_to_confirm = 'no';
        $scope.confirm_close_session = 'no';
        $scope.last_id = 0;
        $scope.miliseconds = new Date().getTime();
        $scope.time_difference = 0;
        $scope.display_loader = true;

        $scope.showError = false;
        $scope.errors = '';
        $scope.showMessage = false;
        $scope.success_message = '';

        $scope.form_title = '';
        $scope.tags = [];

        $scope.show_chat_start_button = false;

        $scope.visitor = {};
        $scope.agent = {name: ''};
        $scope.chat_session = {};
        $scope.online_agents = '';

        $scope.new_msg_indecator = false;
        $scope.blink_chatbox = false;
        $scope.messages = [];
        $scope.new_message = '';
        $scope.heartbeat_status = ['requested', 'forward', 'open', 'on-hold', 'disconnected'];
        $scope.chatHeartbeatTime = 3000;
        $scope.message_box_id = "#message_box";

        $scope.colors = ['#f16364', '#f58559', '#f9a43e', '#e4c62e', '#67bf74', '#59a2be', '#2093cd', '#ad62a7', '#805781', '#e57373', '#f06292', '#a1887f'
                    , '#ba68c8', '#9575cd', '#7986cb', '#64b5f6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#ff8a65', '#d4e157', '#ffd54f', '#ffb74d', '#90a4ae'];

        $scope.rand_color = '';

        //Play Standart
        $scope.play = function () {
            var audio = document.getElementById("audio1");
            audio.play();
        }

        // watch the chatbox state
        $scope.$watch("chatboxState", function (newState, oldState) {
            if (newState === 'focus') {
                $document[0].title = $scope.windowTitle;
                angular.element('#chat-cmodule-header').removeClass('blinking');
                $scope.blink_chatbox = false;
            }
        });

        /*
         * This function will return a random color
         * @returns {undefined}
         */
        $scope.getColor = function () {
            var rand_color = $scope.colors[Math.floor((Math.random() * 26) + 1)];
            return rand_color;
        }

        $scope.feedback = {'rating': 4};
        $scope.rating_status = {1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent'};

        $scope.appkey = 'bullchat';
        var stop_heartbeat = undefined;
        var stop_users_request = undefined;

        /*
         * This function will show chatbox
         */
        $scope.show_chatbox = function () {
            angular.element("#chat-cmodule-mainContainer").show();
        }

        $scope.$on('onRepeatLast', function (scope, element, attrs) {
            //work your magic
            if ($scope.chatboxState === '') {
                angular.element("#message").focus();
            }

            $timeout(function () {
                $scope.scroll_chat();
            }, 100);
        });

        //hide new message indecator
        var past_scrolled = 0;
        $scope.current_page = {'page_url': $location.absUrl(), 'page_title': angular.element("title").text()};

        // reset data
        $scope.reset = function () {
            $scope.message_stored = [];
            $scope.visitor = {};
            $scope.agent = {};
            $scope.chat_session = {};

            $scope.new_msg_indecator = false;
            $scope.blink_chatbox = false;
            $scope.messages = [];
            $scope.new_message = '';

            $scope.visible_widget = 'start';
            $scope.is_scroll_start = false;
            $scope.is_scrollable = true;
            $scope.is_typing = false;
            $scope.is_waiting = false;
            $scope.minimized = false;
            $scope.offline_request_sent = false;
            $scope.feedback_sent = false;
            $scope.ask_for_transcript = 'no';
            $scope.ask_to_confirm = 'no';
            $scope.confirm_close_session = 'no';
            $scope.last_id = 0;
            $scope.display_loader = false;

            $scope.showError = false;
            $scope.errors = '';
            $scope.showMessage = false;
            $scope.success_message = '';

            $scope.feedback = {'rating': 1};
            $scope.form_title = $scope.settings.chat_start_title;
            $scope.show_chat_start_button = true;

            $http.post(site_url + "visitors/chat/get_session/" + $scope.appkey, $scope.current_page).success(function (response) {
                $scope.settings = response.settings;
                $scope.tags = response.tags;
            });

            $scope.offlineForm.$setPristine();
            $scope.onlineForm.$setPristine();
            $scope.feedbackForm.$setPristine();
        }

        // get server currant time in milliseconds
        $http.post(site_url + "visitors/chat/get_server_time").success(function (response) {
            if (response.result == 'success') {
                $scope.miliseconds = new Date().getTime();
                $scope.time_difference = parseInt(response.milliseconds) - $scope.miliseconds;
            }
        });

        //get currant time
        $scope.currant_time = function () {
            $scope.miliseconds = new Date().getTime();
            var miliseconds = ($scope.miliseconds + $scope.time_difference).toString();
            $scope.message_stored.push(miliseconds);

            return miliseconds;
        }

        // get online agents
        $scope.get_online_agents = function () {
            // get online users
            $http.get(site_url + "visitors/chat/get_online_agents/" + $scope.appkey).success(function (response) {
                if (response.result == 'success') {
                    $scope.online_agents = response.online_agents;
                    if (angular.isArray($scope.online_agents) && $scope.show_chat_start_button) {
                        $scope.is_agents_online = false;

                        if ($scope.form_title == '' || $scope.form_title == $scope.settings.chat_start_title) {
                            $scope.form_title = $scope.settings.offline_form_title;
                        }

                        if ($scope.visible_widget == 'online-widget') {
                            $scope.visible_widget = 'offline-widget';
                            $scope.form_title = $scope.settings.offline_form_title;
                        }
                    } else if (angular.isObject($scope.online_agents) && $scope.show_chat_start_button) {
                        $scope.is_agents_online = true;

                        if ($scope.form_title == '' || $scope.form_title == $scope.settings.offline_form_title) {
                            $scope.form_title = $scope.settings.chat_start_title;
                        }

                        if ($scope.visible_widget == 'offline-widget') {
                            $scope.form_title = $scope.settings.online_form_title;
                            $scope.visible_widget = 'online-widget';
                        }
                    }
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                }
            });
        }

        $scope.visible_form = function () {
            if ($scope.user_agent != 'browser') {
                window.location = site_url + 'visitors/chatbox';
                return false;
            }

            $scope.showError = false;
            $scope.showMessage = false;

            if ($scope.is_agents_online) {
                $scope.visible_widget = 'online-widget';
                $scope.form_title = $scope.settings.online_form_title;
            } else {
                $scope.visible_widget = 'offline-widget';
                $scope.form_title = $scope.settings.offline_form_title;
            }
        }

        // check if session exists.
        $http.post(site_url + "visitors/chat/get_session/" + $scope.appkey, $scope.current_page).success(function (response) {
            $scope.settings = response.settings;
            $scope.form_title = $scope.settings.chat_start_title;
            $scope.user_agent = response.user_agent;
            $scope.minimized = response.data.minimized;

            if ($scope.settings.theme == 'classic') {
                $scope.message_box_id = '#classic_message_box';
            }

            if (response.result == 'success') {
                $scope.visitor = response.data.visitor;
                $scope.agent = response.data.agent;
                $scope.chat_session = response.data.chat_session;
                $scope.messages = response.data.chatHistory;
                $scope.last_id = response.data.last_id;
                $scope.message_stored = response.data.message_stored;

                $timeout(function () {
                    $scope.scroll_chat();
                }, 100);

                if (response.data.show_feedback_form == 'yes' && $scope.chat_session.session_status == 'closed') {
                    $scope.visible_widget = 'feedback-widget';
                    $scope.form_title = 'Give Feedback';
                } else if ($scope.chat_session) {
                    $scope.visible_widget = 'chatting-widget';
                    $scope.form_title = 'Welcome';

                    if (response.data.agent.id) {
                        $scope.form_title = $scope.agent.name;

                        if ($scope.agent.profile_pic) {
                            $scope.settings.default_avatar = $scope.agent.profilePic;
                        } else {
                            $scope.settings.default_avatar = '';
                        }

                        $scope.is_typing = ($scope.agent.is_typing > 0) ? true : false;

                        if ($scope.chat_session.session_status == 'closed') {
                            $scope.showError = true;
                            $scope.errors = 'Your chat session is closed.';
                            $scope.new_message = $scope.errors;

                            $timeout(function () {
                                $scope.showError = false;
                                $scope.errors = '';
                            }, 2500);
                        }
                    } else {
                        $scope.is_waiting = true;
                    }
                }

                //start chat
                $scope.start_chat();
            } else if (response.result == 'no-session') {
                $scope.tags = response.tags;
                $scope.show_chat_start_button = true;

                stop_users_request = $interval(function () {
                    $scope.get_online_agents();
                }, $scope.chatHeartbeatTime);
            } else if (response.result == 'failed') {
                $scope.displayError(response);
            }

            angular.element($scope.message_box_id).mCustomScrollbar({
                callbacks: {
                    onScrollStart: function () {
                        $scope.is_scroll_start = true;
                        past_scrolled = this.mcs.topPct;
                    },
                    onScroll: function () {
                        if (past_scrolled > this.mcs.topPct) {
                            $scope.is_scrollable = false;
                        }
                    },
                    onTotalScroll: function () {
                        $scope.is_total_scrolled = true;
                        $scope.is_scrollable = true;
                        $scope.new_msg_indecator = false;
                    }
                }
            });

            $scope.display_loader = false;

            //$scope.custom_styles = ".chat-cmodule, .chat-cmodule * { color: " + $scope.settings.text_color + " !important; }";
            $scope.custom_styles = ".chat-cmodule-header, .chatnox-btn-default, .chat-cmodule-header *, .chat-cmodule-header, .chat-cmodule-widget-head, .cmodule-window-widget-title { color: " + $scope.settings.title_color + " !important; }";
            $scope.custom_styles += ".chat-cmodule-header, .chatnox-btn-default, .chat-cmodule-header, .chat-cmodule-widget-head { background-color: " + $scope.settings.background_color + " !important; }";
        });

        //send request
        $scope.send_request = function (event) {
            event.preventDefault();
            $scope.display_loader = true;

            $scope.visitor.sort_order = $scope.currant_time();
            $http.post(site_url + "visitors/chat/request/" + $scope.appkey, $scope.visitor).success(function (response) {
                if (response.result == 'success') {
                    $scope.display_loader = false;
                    $scope.visitor = response.data.visitor;
                    $scope.agent = response.data.agent;
                    $scope.chat_session = response.data.chat_session;
                    $scope.messages = response.data.chatHistory;
                    $scope.last_id = response.data.last_id;
                    $scope.message_stored = response.data.message_stored;

                    $scope.visible_widget = 'chatting-widget';
                    $scope.is_waiting = true;

                    $scope.start_chat();
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                }
            });
        }

        // send offline request
        $scope.send_offline_request = function (event) {
            event.preventDefault();
            $scope.display_loader = true;

            $http.post(site_url + "visitors/orequests/request/" + $scope.appkey, $scope.visitor).success(function (response) {
                if (response.result == 'success') {
                    $scope.showMessage = true;
                    $scope.success_message = $scope.settings.offline_submission_message;

                    $timeout(function () {
                        $scope.reset();
                    }, 2500);
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                }
            });
        }

        // start chatting.
        $scope.start_chat = function () {
            if ($scope.chat_session && angular.element.inArray($scope.chat_session.session_status, $scope.heartbeat_status) != -1) {
                if (angular.isDefined(stop_users_request)) {
                    $interval.cancel(stop_users_request);
                    stop_users_request = undefined;
                }

                stop_heartbeat = $interval(function () {
                    $scope.get_online_agents();
                    $scope.chatHeartbeat();
                }, $scope.chatHeartbeatTime);
            } else {
                if (angular.isDefined(stop_users_request)) {
                    $interval.cancel(stop_users_request);
                    stop_users_request = undefined;
                }

                if (angular.isDefined(stop_heartbeat)) {
                    $interval.cancel(stop_heartbeat);
                    stop_heartbeat = undefined;
                }

                stop_heartbeat = $interval(function () {
                    $scope.get_online_agents();
                }, $scope.chatHeartbeatTime);
            }
        }

        //chatHeartbeat
        $scope.chatHeartbeat = function () {
            if ($scope.user_agent != 'browser') {
                window.location = site_url + 'visitors/chatbox';
                return false;
            }

            var typing = ($scope.new_message) ? 1 : 0;
            $http.post(site_url + "visitors/chat/chatHeartbeat/" + $scope.appkey + '/' + $scope.last_id + '/' + typing, $scope.visitor).success(function (response) {
                if (response.result == 'success') {
                    $scope.chat_session = response.chat_session;
                    $scope.agent = response.agent;
                    $scope.last_id = response.last_id;
                    $scope.form_title = 'Welcome';

                    if (response.agent.id) {
                        $scope.chatboxTitle = response.agent.name + ' says...';
                        $scope.form_title = $scope.agent.name;
                        if ($scope.agent.profile_pic) {
                            $scope.settings.default_avatar = $scope.agent.profilePic;
                        } else {
                            $scope.settings.default_avatar = '';
                        }

                        $scope.is_typing = ($scope.agent.is_typing > 0) ? true : false;
                        $scope.is_waiting = false;

                        if ($scope.chat_session.session_status == 'closed') {
                            $scope.showError = true;
                            $scope.errors = 'Your chat session is closed.';
                            $scope.new_message = 'Your chat session is closed.';

                            $timeout(function () {
                                $scope.showError = false;
                                $scope.errors = '';

                                if (angular.isDefined(stop_heartbeat)) {
                                    $interval.cancel(stop_heartbeat);
                                    stop_heartbeat = undefined;

                                    stop_users_request = $interval(function () {
                                        $scope.get_online_agents();
                                    }, $scope.chatHeartbeatTime);
                                }
                            }, 2500);
                        }
                    }

                    angular.forEach(response.chatMessagesData, function (row, key) {
                        if (angular.element.inArray(row.sort_order, $scope.message_stored) == -1 && angular.element.inArray(row.id, $scope.message_stored) == -1) {
                            $scope.messages.push(row);
                            $scope.message_stored.push(row.id);

                            if ($scope.is_scrollable) {
                                $scope.new_msg_indecator = false;
                            } else {
                                $scope.new_msg_indecator = true;
                            }

                            if (row.sender_id !== $scope.visitor.id) {
                                $scope.playSound = true;
                                $scope.blink_chatbox = true;
                            }
                        }
                        //$scope.blink_chatbox = false;
                    });

                    if ($scope.playSound) {
                        $scope.play();
                        $scope.playSound = false;
                    }

                    /*if ($scope.blink_chatbox) {
                     $document[0].title = $scope.chatboxTitle;
                     angular.element('#chat-cmodule-header').toggleClass('blinking');
                     }*/

                    if (response.chatMessagesData.length > 0) {
                        $scope.scroll_chat();
                    }
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                }
            });
        }

        // submit message on enter key press
        $scope.submit_message = function (event) {
            if (event.keyCode == 13 && $scope.new_message) {
                if (!event.shiftKey) {
                    $scope.send_message(event);
                }
            } else if (event.keyCode == 13) {
                event.preventDefault();
            }
        }

        // sending new message 
        $scope.send_message = function (event) {
            event.preventDefault();
            if ($scope.new_message) {
                if (!$scope.new_msg_indecator && $scope.is_scroll_start) {
                    $scope.is_scrollable = true;
                }

                //prepare json data
                var message_data = {
                    name: $scope.visitor.name,
                    chat_session_id: $scope.chat_session.id,
                    chat_message: $scope.new_message,
                    message_status: 'unread',
                    sender_id: $scope.visitor.id,
                    sort_order: $scope.currant_time(),
                    class: ''
                };

                $scope.messages.push(message_data);
                $scope.new_message = '';
                $scope.scroll_chat();
                // sending request to send message
                $http.post(site_url + "visitors/chat/send/" + $scope.appkey, message_data).success(function (response) {
                    if (response.result == 'success') {
                        //$scope.messages.push(response.message_row);
                        //$scope.new_message = '';

                        //$scope.scroll_chat();
                    } else if (response.result == 'failed') {
                        $scope.displayError(response);
                        $scope.new_message = message_data.chat_message;
                    }
                });
            }
        }

        //minimize_chat        
        $scope.minimize_chat = function (event) {
            event.preventDefault();
            $scope.minimized = 'yes';
            $http.post(site_url + "visitors/chat/minimize/" + $scope.appkey).success(function (response) {
                if (response.result == 'success') {
                    $scope.minimized = response.minimized;
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                    $scope.minimized = 'no';
                }
            });
        }

        //minimize_chat        
        $scope.maximize_chat = function (event) {
            event.preventDefault();
            $scope.minimized = 'no';
            $http.post(site_url + "visitors/chat/maximize/" + $scope.appkey).success(function (response) {
                if (response.result == 'success') {
                    $scope.minimized = response.minimized;
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                    $scope.minimized = 'yes';
                }
            });
        }

        // close chat 
        $scope.end_chat = function (event) {
            event.preventDefault();

            if ($scope.visible_widget == 'chatting-widget') {
                if ($scope.confirm_close_session == 'yes') {
                    if ($scope.settings.send_chat_transcript_to_visitor != 'ask_to_visiter') {
                        $scope.display_loader = true;

                        $http.post(site_url + "visitors/chat/end/" + $scope.appkey, {send_chat_transcript: $scope.settings.send_chat_transcript_to_visitor}).success(function (response) {
                            if (response.result == 'success') {
                                $scope.ask_for_transcript = 'no';
                                $scope.chat_session = response.chat_session;

                                if (response.show_feedback_form == 'yes') {
                                    $scope.visible_widget = 'feedback-widget';
                                    $scope.form_title = 'Give Feedback';
                                } else {
                                    $scope.tags = response.tags;
                                    $scope.reset();
                                }

                                if (angular.isDefined(stop_heartbeat)) {
                                    $interval.cancel(stop_heartbeat);
                                    stop_heartbeat = undefined;

                                    stop_users_request = $interval(function () {
                                        $scope.get_online_agents();
                                    }, $scope.chatHeartbeatTime);
                                }
                            } else if (response.result == 'failed') {
                                $scope.displayError(response);
                            }

                            $scope.display_loader = false;
                        });
                    } else {
                        if ($scope.minimized) {
                            $scope.maximize_chat(event);
                        }
                        $scope.ask_for_transcript = 'yes';
                    }
                } else {
                    if ($scope.minimized) {
                        $scope.maximize_chat(event);
                    }
                    $scope.ask_to_confirm = 'yes';
                }
            } else {
                $scope.reset();
            }
        }

        // send feedback
        $scope.send_feedback = function (event) {
            event.preventDefault();
            $scope.display_loader = true;

            $scope.feedback.chat_session_id = $scope.chat_session.id;
            $scope.feedback.feedback_by = $scope.visitor.id;
            $scope.feedback.feedback_to = $scope.agent.id;
            $scope.feedback.sort_order = $scope.currant_time();

            $http.post(site_url + "visitors/chat/send_feedback/" + $scope.appkey, $scope.feedback).success(function (response) {
                if (response.result == 'success') {
                    $scope.showMessage = true;
                    $scope.success_message = $scope.settings.feedback_submission_message;

                    $timeout(function () {
                        $scope.reset();
                    }, 2500);
                } else if (response.result == 'failed') {
                    $scope.displayError(response);
                }
            });
        }

        // scroll chat box
        $scope.scroll_chat = function () {
            if ($scope.is_scrollable) {
                //scrolling window to footer
                //angular.element($scope.message_box_id).animate({scrollTop: angular.element($scope.message_box_id)[0].scrollHeight}, 1000);

                angular.element($scope.message_box_id).mCustomScrollbar('scrollTo', 'bottom', {
                    scrollInertia: 100,
                    timeout: 10
                });
            }
        }

        // will display error is accur
        $scope.displayError = function (data) {
            $scope.showError = true;
            $scope.errors = data.error;

            $timeout(function () {
                $scope.display_loader = false;
                $scope.showError = false;
                $scope.errors = '';
            }, 2500);
        }

        // disable click
        $scope.disable_click = function (event) {
            event.preventDefault();
        }
    });

    angular.module('cmodule.filters', []).
            filter('oneCapLetter', function () {
                return function (input) {
                    return input.substring(0, 1).toLowerCase().replace(/\b[a-z]/g, function (letter) {
                        return letter.toUpperCase();
                    });
                };
            })
            .filter('newlines', function () {
                return function (text) {
                    return text.replace(/\n/g, '<br/>');
                }
            });

    // adding last repeat directive
    app.directive('onLastRepeat', function () {
        return function (scope, element, attrs) {
            if (scope.$last) {
                setTimeout(function () {
                    scope.$emit('onRepeatLast', element, attrs);
                }, 1);
            }
        };
    });

    /*
     This directive allows us to pass a function in on an enter key to do what we want.
     */
    app.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
})();