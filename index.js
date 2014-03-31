
/**
 * Module dependencies.
 */

var debug = require('debug')('mydb-reconnect');

/**
 * Module exports.
 */

module.exports = Reconnect;

/**
 * Reconnect mydb.
 *
 * @param {mydb#Manager} manager
 * @api private
 */

function Reconnect(db, opts){
  if (!(this instanceof Reconnect)) {
    return new Reconnect(db, opts);
  }

  opts = opts || {};
  this.db = db;
  this.retryTimeout = opts.retryTimeout || 10000;
  this.connectTimeout = opts.connectTimeout || 10000;

  // bound methods
  this.onconnect = this.onconnect.bind(this);
  this.onerror = this.onerror.bind(this);
  this.ontimeout = this.ontimeout.bind(this);
  this.ondisconnect = this.ondisconnect.bind(this);

  // reconnection state
  this.reconnecting = false;
  this.attempts = 0;

  // if we're connecting, set timeout
  if (!db.connected) this.setConnectTimeout();

  // set connect timeout every time we disconnect
  db.on('disconnect', this.ondisconnect);
}

/**
 * Set connect timeout.
 *
 * @api private
 */

Reconnect.prototype.setConnectTimeout = function(){
  debug('setting connect timeout');
  this.connectTimer = setTimeout(this.ontimeout, this.connectTimeout);
  this.db.once('connect', this.onconnect);
  this.db.once('connect_error', this.onerror);
};

/**
 * Called upon connection.
 *
 * @api private
 */

Reconnect.prototype.onconnect = function(){
  debug('connected');
  this.attempts = 0;
  var wasReconnecting = this.reconnecting;
  this.reconnecting = false;
  this.cancel();
  if (wasReconnecting) this.db.emit('reconnect');
};

/**
 * Called upon connection timeout.
 *
 * @api private
 */

Reconnect.prototype.ontimeout = function(){
  debug('timeout (%dms)', this.connectTimeout);
  this.cancel();
  this.retry();
};

/**
 * Attempts to reconnect.
 *
 * @api private
 */

Reconnect.prototype.retry = function(){
  if (this.retrying) {
    console.warn('retry overlap');
    return;
  }

  debug('retrying in %dms', this.retryTimeout);

  var self = this;
  setTimeout(function(){
    debug('retrying');
    self.setConnectTimeout();
    self.db.reconnect();
  }, this.retryTimeout);

  this.reconnecting = true;
  this.retrying = true;
};

/**
 * Cancel ongoing retry.
 *
 * @api private
 */

Reconnect.prototype.cancel = function(){
  // in case we were retrying
  this.retrying = false;

  debug('clearing connect timeout');
  clearTimeout(this.connectTimer);

  this.db.off('connect', this.onconnect);
  this.db.off('connect_error', this.onerror);

  if (this.connectTimer) delete this.connectTimer;
};

/**
 * Called upon disconnection.
 *
 * @api private
 */

Reconnect.prototype.ondisconnect = function(){
  debug('disconnected');
  this.retry();
};

/**
 * Called upon connection error.
 *
 * @api private
 */

Reconnect.prototype.onerror = function(){
  debug('connection error');
  this.cancel();
  this.retry();
};
