(function () {

    app.controller("DashboardController", ['$scope', '$http', function ($scope, $http) {
            // object to hold all the data for the dashboard data
            $scope.pageviews = [];
            var mc;

            $http.post(site_url + "/admin/get_pageviews").success(function (response) {
                $scope.pageviews = response.pageviews;
            });

            $scope.drawMap = function ($users) {
                geocoder = new google.maps.Geocoder();
                var latlng = new google.maps.LatLng(21.0000, 78.0000);
                var myOptions = {
                    zoom: 1,
                    center: latlng,
                    mapTypeControl: true,
                    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
                    navigationControl: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById("usersMap"), myOptions);
                mc = new MarkerClusterer(map, [], myOptions);
                if (geocoder) {
                    $.each($users, function (key, addRess) {
                        var infoContent = '<div class="map-location-view">';
                        infoContent += '<div class="location-thumb"><img src=' + addRess.userProfilePic + ' alt=' + addRess.userProfilePic + ' width=50 height=50 />';
                        infoContent += '</div>';
                        infoContent += '<div class="location-details">';
                        infoContent += '<p>' + addRess.name + '</p>';
                        infoContent += '<address>' + (addRess.city) + ', ' + (addRess.state) + ', ' + (addRess.country) + '</address>';
                        infoContent += '</div>';
                        infoContent += '</div>';
                        $scope.geoLocation(addRess.latitude, addRess.longitude, infoContent);
                    });

                }
            }

            $scope.geoLocation = function (lat, lng, infoContent) {
                var marker = $scope.createMarker(lat, lng, infoContent);
                mc.addMarker(marker);
            }

            $scope.createMarker = function (lat, lng, content) {
                return $scope.infoContent(lat, lng, content);
            };

            $scope.infoContent = function (lat, lng, content) {
                var infowindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(lat, lng),
                    animation: google.maps.Animation.DROP
                });
                google.maps.event.addListener(marker, 'click', function () {
                    infowindow.close();
                    infowindow.setContent(content);
                    infowindow.open(map, marker);
                });
                return marker;
            };

            $scope.populateMap = function () {
                $http.post(site_url + "/admin/get_map_data").success(function (response) {
                    $scope.drawMap(response.mapdata);
                });
            }
            // map functions end here

            $scope.gd = function (year) {
                return new Date(year).getFullYear();
            };

            $scope.showTooltip = function (x, y, color, contents) {
                angular.element('<div id="tooltip">' + contents + '</div>').css({
                    position: 'absolute',
                    display: 'none',
                    top: y - 40,
                    left: x - 120,
                    border: '2px solid ' + color,
                    padding: '3px',
                    'font-size': '9px',
                    'border-radius': '5px',
                    'background-color': '#fff',
                    'font-family': 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                    opacity: 0.9
                }).appendTo("body").fadeIn(200);
            };

            $scope.loadFlotChart = function () {
                $http.post(site_url + "/admin/get_dashboard_data").success(function (response) {
                    var seriesData = [];
                    var obj = response.users_per_day;
                    var obj2 = response.visitors_counter;

                    for (var prop in obj) {
                        seriesData.push({label: ' Chat Requests Per Day', data: $.map(obj[prop], function (i, j) {
                                return [[new Date(i[0], i[1] - 1, i[2]).getTime(), i[3]]];
                            })});
                    }

                    for (var prop in obj2) {
                        seriesData.push({label: ' Visitors Per Day', data: $.map(obj2[prop], function (i, j) {
                                return [[new Date(i[0], i[1] - 1, i[2]).getTime(), i[3]]];
                            })});
                    }

                    // helper for returning the weekends in a period
                    function weekendAreas(axes) {
                        var markings = [];
                        var d1 = new Date(axes.xaxis.min);
                        // go to the first Saturday
                        d1.setUTCDate(d1.getUTCDate() - ((d1.getUTCDay() + 1) % 1))
                        d1.setUTCSeconds(0);
                        d1.setUTCMinutes(0);
                        d1.setUTCHours(0);
                        var i = d1.getTime();
                        do {
                            // when we don't set yaxis, the rectangle automatically
                            // extends to infinity upwards and downwards
                            markings.push({
                                xaxis: {
                                    from: i,
                                    to: i + 2 * 24 * 60 * 60 * 1000
                                }
                            });
                            i += 1 * 24 * 60 * 60 * 1000;
                        } while (i < axes.xaxis.max);

                        return markings;
                    }

                    $scope.fcOptions = {
                        colors: ["#edc240", "#5eb95e"],
                        series: {
                            lines: {
                                show: true,
                                lineWidth: 4,
                                fill: true
                            },
                            points: {
                                show: true,
                                fillColor: "rgba(0,0,0,0.35)",
                                radius: 3.5,
                                lineWidth: 1.5
                            },
                            grow: {
                                active: false
                            },
                            shadowSize: 2
                        },
                        legend: {
                            margin: 8,
                            position: "nw"
                        },
                        xaxis: {
                            tickColor: "#CCCCCC",
                            mode: "time",
                            axisLabel: "Months",
                            axisLabelUseCanvas: false,
                            axisLabelFontSizePixels: 12,
                            axisLabelFontFamily: 'Verdana, Arial',
                            axisLabelPadding: 50,
                            tickLength: 5
                        },
                        yaxis: {
                            tickColor: "#CCC",
                            autoscaleMargin: 0.1
                        },
                        selection: {
                            mode: "x"
                        },
                        grid: {
                            tickColor: "rgba(255,255,255,0.05)",
                            markingsColor: "rgba(255,255,255,0.05)",
                            markings: weekendAreas,
                            // interactive stuff
                            clickable: true,
                            hoverable: true
                        }
                    };
                    $scope.previousPoint = null;
                    $scope.previousLabel = null;
                    $scope.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var plot = angular.element.plot(angular.element("#placeholder"), seriesData, $scope.fcOptions);

                    var overview = angular.element.plot(angular.element("#placeholder_overview"), seriesData, {
                        colors: ["#edc240", "#5eb95e"],
                        series: {
                            bars: {
                                show: true,
                                lineWidth: 5,
                                fillColor: "#5eb95e"
                            },
                            shadowSize: 2,
                            grow: {
                                active: false
                            }
                        },
                        legend: {
                            show: false
                        },
                        xaxis: {
                            ticks: [],
                            mode: "time"
                        },
                        yaxis: {
                            ticks: [],
                            min: 0,
                            autoscaleMargin: 0.1
                        },
                        selection: {
                            mode: "x"
                        },
                        grid: {
                            color: "#D6D8DB",
                            markings: weekendAreas,
                            markingsColor: "rgba(255,255,255,0.05)",
                            backgroundColor: {
                                colors: ["rgba(54,58,60,0.05)", "rgba(0,0,0,0.2)"]
                            }
                        }
                    });

                    angular.element("#placeholder").bind("plotselected", function (event, ranges) {
                        // do the zooming
                        plot = angular.element.plot(angular.element("#placeholder"), seriesData,
                                angular.element.extend(true, {}, $scope.fcOptions, {
                                    xaxis: {
                                        min: ranges.xaxis.from,
                                        max: ranges.xaxis.to
                                    }
                                }));

                        // don't fire event on the overview to prevent eternal loop
                        overview.setSelection(ranges, true);
                    });

                    angular.element("#placeholder_overview").bind("plotselected", function (event, ranges) {
                        plot.setSelection(ranges);
                    });

                    // Bind the plot hover
                    $scope.UseTooltip = function () {
                        angular.element("#placeholder").bind("plothover", function (event, pos, item) {
                            if (item) {
                                if (($scope.previousLabel != item.series.label) || ($scope.previousPoint != item.dataIndex)) {
                                    $scope.previousPoint = item.dataIndex;
                                    $scope.previousLabel = item.series.label;
                                    angular.element("#tooltip").remove();

                                    var x = item.datapoint[0];
                                    var y = (item.datapoint[1] <= 0) ? 0 : $.formatNumber(item.datapoint[1], {format: "#,###", locale: "us"});

                                    var color = item.series.color;
                                    var day = new Date(x).getDate();
                                    var month = $scope.monthNames[new Date(x).getMonth()];
                                    var year = $scope.gd(x);

                                    $scope.showTooltip(item.pageX,
                                            item.pageY,
                                            color,
                                            day + ' ' + month + ',' + year
                                            + " : <strong>" + y +
                                            "</strong>");
                                }
                            } else {
                                angular.element("#tooltip").remove();
                                $scope.previousPoint = null;
                            }
                        });
                    };

                    $scope.claerChart = function (event) {
                        event.preventDefault();
                        overview.clearSelection();
                        angular.element.plot(angular.element("#placeholder"), seriesData, $scope.fcOptions);
                    }
                });
            }
        }]);
})();