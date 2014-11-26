(function() {
	'use strict';

	var module = angular.module('coral', []);

	module.factory('coral', function() {
		var webSocket, debug;

		var coral = {
			myId: "",
		};

		coral.connect = function(options, callback) {
			debug = options.debug;

			function initWebSocket() {
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

			coral.on('server_ack', function(message) {
				if (message.value === 'register') {
					coral.myId = message.yourId;
				}
			});

			function startWebSocket() {
				webSocket = new WebSocket(options.wsUrl);
				initWebSocket();
			}
			function startSecureWebSocket() {
				webSocket = new WebSocket(options.wssUrl);
				webSocket.onerror = startWebSocket;
			}

			if (options.networkName && options.className && options.wsUrl) {
				if (options.wssUrl) {
					startSecureWebSocket();
				}
				else {
					startWebSocket();
				}
			}
			else {
				console.error('Cannot connect, missing parameters');
			}
		};

		coral.on = function(type, handler) {
			if (debug) {
				console.log("on", type);
			}
			messageHandlers.addHandler(type, handler);
		};

		coral.sendMessage = function(to, message) {
			if (debug) {
				console.log("sending message", to, message);
			}
			var temp = {
				type: "message",
				message: message,
				to: to,
			};
			send(temp);
		};

		coral.subscribe = function(type, to, value) {
			if (debug) {
				console.log("subscribe", type, to, value);
			}
			var temp = {
				type: "subscribe",
				subscribe: {
					type: type,
					to: to,
					value: value,
				}
			};
			send(temp);
		};

		coral.broadcast = function(message) {
			if (debug) {
				console.log("broadcast: ", message);
			}
			var temp = {
				type: "broadcast",
				message: message
			};
			send(temp);
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
							if (debug) {
								console.log("receiving message", message);
							}

							if (message.type && this.list[message.type]) {
								messageHandlers.list[message.type](message);
								return;
							}
						}
					}
				}
			},

			addHandler: function(type, handler) {
				if (this.list[type]) {
					return console.error('Cannot add handler. Already exists');
				}

				this.list[type] = handler;
			}
		};

		function send(object) {
			if (webSocket) {
				webSocket.send(JSON.stringify(object) + "\n");
			}
			else {
				console.error('Sending failed. Not connected');
			}
		}

		return coral;
	});

})();
