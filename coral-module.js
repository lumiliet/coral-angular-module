(function() {
	'use strict';

	var module = angular.module('coral', []);

	module.factory('coral', function() {
		var webSocket;

		var coral = {
			connect: function(options, callback) {
				if (options.networkName && options.className && options.webSocketUrl) {
					webSocket = new WebSocket(options.webSocketUrl);

					webSocket.onmessage = function(event) {
						messageHandlers.mainHandler(event.data);
					};

					webSocket.onopen = function () {
						var temp = {
							type: "register",
							networkName: options.networkName,
							className: options.className,
							name: options.name
						};
						send(temp);

						callback();
					};
				}
				else {
					console.error('Cannot connect, missing parameters');
				}
			}
		};

		var messageHandlers = {
			list: {},
			mainHandler: function(data) {
				var dataArray = data.split("\n");
				var message;
				for (var d = 0; d < dataArray.length; d++) {
					if (dataArray[d].length) {
						var parsingFailed = false;
						try {
							message = JSON.parse(dataArray[d]);
						}
						catch (e) {
							parsingFailed = true;
							console.error("parsing failed");
						}
						if (!parsingFailed) {
							if (message.type && this.list[message.type]) {
								messageHandlers.list[message.type](message);
								return;
							}
							else {
								//console.log(message);
							}
						}
					}
				}
			},

			addHandler: function(handler, type) {
				this.list[type] = handler;
			}
		};

		coral.addHandler = function(handler, type) {
			messageHandlers.addHandler(handler, type);
		};


		function send(object) {
			webSocket.send(JSON.stringify(object) + "\n");
		}

		coral.sendMessage = function(message, to) {
			var temp = {
				type: "message",
				message: message,
				to: to,
			};
			send(temp);
		};

		return coral;
	});

})();
