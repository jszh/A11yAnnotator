this.F9 = this.F9 || {};
this.F9.Chat = this.F9.Chat || {};
this.F9.Chat.Wrapper = (function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	/** Used as the `TypeError` message for "Functions" methods. */

	var FUNC_ERROR_TEXT$3 = 'Expected a function';
	/** Used to stand-in for `undefined` hash values. */

	var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';
	/** Used as references for various `Number` constants. */

	var INFINITY$3 = 1 / 0;
	/** `Object#toString` result references. */

	var funcTag$3 = '[object Function]',
	    genTag$3 = '[object GeneratorFunction]',
	    symbolTag$3 = '[object Symbol]';
	/** Used to match property names within property paths. */

	var reIsDeepProp$2 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp$2 = /^\w*$/,
	    reLeadingDot$2 = /^\./,
	    rePropName$2 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */

	var reRegExpChar$2 = /[\\^$.*+?()[\]{}|]/g;
	/** Used to match backslashes in property paths. */

	var reEscapeChar$2 = /\\(\\)?/g;
	/** Used to detect host constructors (Safari). */

	var reIsHostCtor$2 = /^\[object .+?Constructor\]$/;
	/** Detect free variable `global` from Node.js. */

	var freeGlobal$2 = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
	/** Detect free variable `self`. */

	var freeSelf$2 = typeof self == 'object' && self && self.Object === Object && self;
	/** Used as a reference to the global object. */

	var root$2 = freeGlobal$2 || freeSelf$2 || Function('return this')();
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */

	function getValue$2(object, key) {
	  return object == null ? undefined : object[key];
	}
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */


	function isHostObject$2(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;

	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }

	  return result;
	}
	/** Used for built-in method references. */


	var arrayProto$2 = Array.prototype,
	    funcProto$2 = Function.prototype,
	    objectProto$4 = Object.prototype;
	/** Used to detect overreaching core-js shims. */

	var coreJsData$2 = root$2['__core-js_shared__'];
	/** Used to detect methods masquerading as native. */

	var maskSrcKey$2 = function () {
	  var uid = /[^.]+$/.exec(coreJsData$2 && coreJsData$2.keys && coreJsData$2.keys.IE_PROTO || '');
	  return uid ? 'Symbol(src)_1.' + uid : '';
	}();
	/** Used to resolve the decompiled source of functions. */


	var funcToString$2 = funcProto$2.toString;
	/** Used to check objects for own properties. */

	var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */

	var objectToString$4 = objectProto$4.toString;
	/** Used to detect if a method is native. */

	var reIsNative$2 = RegExp('^' + funcToString$2.call(hasOwnProperty$3).replace(reRegExpChar$2, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
	/** Built-in value references. */

	var Symbol$2 = root$2.Symbol,
	    splice$2 = arrayProto$2.splice;
	/* Built-in method references that are verified to be native. */

	var Map$3 = getNative$2(root$2, 'Map'),
	    nativeCreate$2 = getNative$2(Object, 'create');
	/** Used to convert symbols to primitives and strings. */

	var symbolProto$2 = Symbol$2 ? Symbol$2.prototype : undefined,
	    symbolToString$2 = symbolProto$2 ? symbolProto$2.toString : undefined;
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function Hash$2(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */


	function hashClear$2() {
	  this.__data__ = nativeCreate$2 ? nativeCreate$2(null) : {};
	}
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function hashDelete$2(key) {
	  return this.has(key) && delete this.__data__[key];
	}
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function hashGet$2(key) {
	  var data = this.__data__;

	  if (nativeCreate$2) {
	    var result = data[key];
	    return result === HASH_UNDEFINED$2 ? undefined : result;
	  }

	  return hasOwnProperty$3.call(data, key) ? data[key] : undefined;
	}
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function hashHas$2(key) {
	  var data = this.__data__;
	  return nativeCreate$2 ? data[key] !== undefined : hasOwnProperty$3.call(data, key);
	}
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */


	function hashSet$2(key, value) {
	  var data = this.__data__;
	  data[key] = nativeCreate$2 && value === undefined ? HASH_UNDEFINED$2 : value;
	  return this;
	} // Add methods to `Hash`.


	Hash$2.prototype.clear = hashClear$2;
	Hash$2.prototype['delete'] = hashDelete$2;
	Hash$2.prototype.get = hashGet$2;
	Hash$2.prototype.has = hashHas$2;
	Hash$2.prototype.set = hashSet$2;
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function ListCache$2(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */


	function listCacheClear$2() {
	  this.__data__ = [];
	}
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function listCacheDelete$2(key) {
	  var data = this.__data__,
	      index = assocIndexOf$2(data, key);

	  if (index < 0) {
	    return false;
	  }

	  var lastIndex = data.length - 1;

	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice$2.call(data, index, 1);
	  }

	  return true;
	}
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function listCacheGet$2(key) {
	  var data = this.__data__,
	      index = assocIndexOf$2(data, key);
	  return index < 0 ? undefined : data[index][1];
	}
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function listCacheHas$2(key) {
	  return assocIndexOf$2(this.__data__, key) > -1;
	}
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */


	function listCacheSet$2(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf$2(data, key);

	  if (index < 0) {
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }

	  return this;
	} // Add methods to `ListCache`.


	ListCache$2.prototype.clear = listCacheClear$2;
	ListCache$2.prototype['delete'] = listCacheDelete$2;
	ListCache$2.prototype.get = listCacheGet$2;
	ListCache$2.prototype.has = listCacheHas$2;
	ListCache$2.prototype.set = listCacheSet$2;
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function MapCache$2(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */


	function mapCacheClear$2() {
	  this.__data__ = {
	    'hash': new Hash$2(),
	    'map': new (Map$3 || ListCache$2)(),
	    'string': new Hash$2()
	  };
	}
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function mapCacheDelete$2(key) {
	  return getMapData$2(this, key)['delete'](key);
	}
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function mapCacheGet$2(key) {
	  return getMapData$2(this, key).get(key);
	}
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function mapCacheHas$2(key) {
	  return getMapData$2(this, key).has(key);
	}
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */


	function mapCacheSet$2(key, value) {
	  getMapData$2(this, key).set(key, value);
	  return this;
	} // Add methods to `MapCache`.


	MapCache$2.prototype.clear = mapCacheClear$2;
	MapCache$2.prototype['delete'] = mapCacheDelete$2;
	MapCache$2.prototype.get = mapCacheGet$2;
	MapCache$2.prototype.has = mapCacheHas$2;
	MapCache$2.prototype.set = mapCacheSet$2;
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */

	function assocIndexOf$2(array, key) {
	  var length = array.length;

	  while (length--) {
	    if (eq$2(array[length][0], key)) {
	      return length;
	    }
	  }

	  return -1;
	}
	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */


	function baseGet(object, path) {
	  path = isKey$2(path, object) ? [path] : castPath$2(path);
	  var index = 0,
	      length = path.length;

	  while (object != null && index < length) {
	    object = object[toKey$2(path[index++])];
	  }

	  return index && index == length ? object : undefined;
	}
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */


	function baseIsNative$2(value) {
	  if (!isObject$4(value) || isMasked$2(value)) {
	    return false;
	  }

	  var pattern = isFunction$3(value) || isHostObject$2(value) ? reIsNative$2 : reIsHostCtor$2;
	  return pattern.test(toSource$2(value));
	}
	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */


	function baseToString$2(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }

	  if (isSymbol$3(value)) {
	    return symbolToString$2 ? symbolToString$2.call(value) : '';
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$3 ? '-0' : result;
	}
	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast property path array.
	 */


	function castPath$2(value) {
	  return isArray$3(value) ? value : stringToPath$2(value);
	}
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */


	function getMapData$2(map, key) {
	  var data = map.__data__;
	  return isKeyable$2(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
	}
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */


	function getNative$2(object, key) {
	  var value = getValue$2(object, key);
	  return baseIsNative$2(value) ? value : undefined;
	}
	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */


	function isKey$2(value, object) {
	  if (isArray$3(value)) {
	    return false;
	  }

	  var type = typeof value;

	  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol$3(value)) {
	    return true;
	  }

	  return reIsPlainProp$2.test(value) || !reIsDeepProp$2.test(value) || object != null && value in Object(object);
	}
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */


	function isKeyable$2(value) {
	  var type = typeof value;
	  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
	}
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */


	function isMasked$2(func) {
	  return !!maskSrcKey$2 && maskSrcKey$2 in func;
	}
	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */


	var stringToPath$2 = memoize$2(function (string) {
	  string = toString$2(string);
	  var result = [];

	  if (reLeadingDot$2.test(string)) {
	    result.push('');
	  }

	  string.replace(rePropName$2, function (match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar$2, '$1') : number || match);
	  });
	  return result;
	});
	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */

	function toKey$2(value) {
	  if (typeof value == 'string' || isSymbol$3(value)) {
	    return value;
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$3 ? '-0' : result;
	}
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */


	function toSource$2(func) {
	  if (func != null) {
	    try {
	      return funcToString$2.call(func);
	    } catch (e) {}

	    try {
	      return func + '';
	    } catch (e) {}
	  }

	  return '';
	}
	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */


	function memoize$2(func, resolver) {
	  if (typeof func != 'function' || resolver && typeof resolver != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT$3);
	  }

	  var memoized = function () {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }

	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result);
	    return result;
	  };

	  memoized.cache = new (memoize$2.Cache || MapCache$2)();
	  return memoized;
	} // Assign cache to `_.memoize`.


	memoize$2.Cache = MapCache$2;
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */

	function eq$2(value, other) {
	  return value === other || value !== value && other !== other;
	}
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */


	var isArray$3 = Array.isArray;
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */

	function isFunction$3(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject$4(value) ? objectToString$4.call(value) : '';
	  return tag == funcTag$3 || tag == genTag$3;
	}
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */


	function isObject$4(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */


	function isObjectLike$4(value) {
	  return !!value && typeof value == 'object';
	}
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */


	function isSymbol$3(value) {
	  return typeof value == 'symbol' || isObjectLike$4(value) && objectToString$4.call(value) == symbolTag$3;
	}
	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */


	function toString$2(value) {
	  return value == null ? '' : baseToString$2(value);
	}
	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */


	function get(object, path, defaultValue) {
	  var result = object == null ? undefined : baseGet(object, path);
	  return result === undefined ? defaultValue : result;
	}

	var lodash_get = get;

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	/** Used as the `TypeError` message for "Functions" methods. */

	var FUNC_ERROR_TEXT$2 = 'Expected a function';
	/** Used to stand-in for `undefined` hash values. */

	var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';
	/** Used as references for various `Number` constants. */

	var INFINITY$2 = 1 / 0,
	    MAX_SAFE_INTEGER$2 = 9007199254740991;
	/** `Object#toString` result references. */

	var argsTag$1 = '[object Arguments]',
	    funcTag$2 = '[object Function]',
	    genTag$2 = '[object GeneratorFunction]',
	    symbolTag$2 = '[object Symbol]';
	/** Used to match property names within property paths. */

	var reIsDeepProp$1 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp$1 = /^\w*$/,
	    reLeadingDot$1 = /^\./,
	    rePropName$1 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */

	var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;
	/** Used to match backslashes in property paths. */

	var reEscapeChar$1 = /\\(\\)?/g;
	/** Used to detect host constructors (Safari). */

	var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;
	/** Used to detect unsigned integer values. */

	var reIsUint$2 = /^(?:0|[1-9]\d*)$/;
	/** Detect free variable `global` from Node.js. */

	var freeGlobal$1 = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
	/** Detect free variable `self`. */

	var freeSelf$1 = typeof self == 'object' && self && self.Object === Object && self;
	/** Used as a reference to the global object. */

	var root$1 = freeGlobal$1 || freeSelf$1 || Function('return this')();
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */

	function getValue$1(object, key) {
	  return object == null ? undefined : object[key];
	}
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */


	function isHostObject$1(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;

	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }

	  return result;
	}
	/** Used for built-in method references. */


	var arrayProto$1 = Array.prototype,
	    funcProto$1 = Function.prototype,
	    objectProto$3 = Object.prototype;
	/** Used to detect overreaching core-js shims. */

	var coreJsData$1 = root$1['__core-js_shared__'];
	/** Used to detect methods masquerading as native. */

	var maskSrcKey$1 = function () {
	  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
	  return uid ? 'Symbol(src)_1.' + uid : '';
	}();
	/** Used to resolve the decompiled source of functions. */


	var funcToString$1 = funcProto$1.toString;
	/** Used to check objects for own properties. */

	var hasOwnProperty$2 = objectProto$3.hasOwnProperty;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */

	var objectToString$3 = objectProto$3.toString;
	/** Used to detect if a method is native. */

	var reIsNative$1 = RegExp('^' + funcToString$1.call(hasOwnProperty$2).replace(reRegExpChar$1, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
	/** Built-in value references. */

	var Symbol$1 = root$1.Symbol,
	    propertyIsEnumerable$1 = objectProto$3.propertyIsEnumerable,
	    splice$1 = arrayProto$1.splice;
	/* Built-in method references that are verified to be native. */

	var Map$2 = getNative$1(root$1, 'Map'),
	    nativeCreate$1 = getNative$1(Object, 'create');
	/** Used to convert symbols to primitives and strings. */

	var symbolProto$1 = Symbol$1 ? Symbol$1.prototype : undefined,
	    symbolToString$1 = symbolProto$1 ? symbolProto$1.toString : undefined;
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function Hash$1(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */


	function hashClear$1() {
	  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
	}
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function hashDelete$1(key) {
	  return this.has(key) && delete this.__data__[key];
	}
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function hashGet$1(key) {
	  var data = this.__data__;

	  if (nativeCreate$1) {
	    var result = data[key];
	    return result === HASH_UNDEFINED$1 ? undefined : result;
	  }

	  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
	}
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function hashHas$1(key) {
	  var data = this.__data__;
	  return nativeCreate$1 ? data[key] !== undefined : hasOwnProperty$2.call(data, key);
	}
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */


	function hashSet$1(key, value) {
	  var data = this.__data__;
	  data[key] = nativeCreate$1 && value === undefined ? HASH_UNDEFINED$1 : value;
	  return this;
	} // Add methods to `Hash`.


	Hash$1.prototype.clear = hashClear$1;
	Hash$1.prototype['delete'] = hashDelete$1;
	Hash$1.prototype.get = hashGet$1;
	Hash$1.prototype.has = hashHas$1;
	Hash$1.prototype.set = hashSet$1;
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function ListCache$1(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */


	function listCacheClear$1() {
	  this.__data__ = [];
	}
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function listCacheDelete$1(key) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);

	  if (index < 0) {
	    return false;
	  }

	  var lastIndex = data.length - 1;

	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice$1.call(data, index, 1);
	  }

	  return true;
	}
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function listCacheGet$1(key) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);
	  return index < 0 ? undefined : data[index][1];
	}
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function listCacheHas$1(key) {
	  return assocIndexOf$1(this.__data__, key) > -1;
	}
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */


	function listCacheSet$1(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);

	  if (index < 0) {
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }

	  return this;
	} // Add methods to `ListCache`.


	ListCache$1.prototype.clear = listCacheClear$1;
	ListCache$1.prototype['delete'] = listCacheDelete$1;
	ListCache$1.prototype.get = listCacheGet$1;
	ListCache$1.prototype.has = listCacheHas$1;
	ListCache$1.prototype.set = listCacheSet$1;
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function MapCache$1(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */


	function mapCacheClear$1() {
	  this.__data__ = {
	    'hash': new Hash$1(),
	    'map': new (Map$2 || ListCache$1)(),
	    'string': new Hash$1()
	  };
	}
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function mapCacheDelete$1(key) {
	  return getMapData$1(this, key)['delete'](key);
	}
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function mapCacheGet$1(key) {
	  return getMapData$1(this, key).get(key);
	}
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function mapCacheHas$1(key) {
	  return getMapData$1(this, key).has(key);
	}
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */


	function mapCacheSet$1(key, value) {
	  getMapData$1(this, key).set(key, value);
	  return this;
	} // Add methods to `MapCache`.


	MapCache$1.prototype.clear = mapCacheClear$1;
	MapCache$1.prototype['delete'] = mapCacheDelete$1;
	MapCache$1.prototype.get = mapCacheGet$1;
	MapCache$1.prototype.has = mapCacheHas$1;
	MapCache$1.prototype.set = mapCacheSet$1;
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */

	function assocIndexOf$1(array, key) {
	  var length = array.length;

	  while (length--) {
	    if (eq$1(array[length][0], key)) {
	      return length;
	    }
	  }

	  return -1;
	}
	/**
	 * The base implementation of `_.has` without support for deep paths.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {Array|string} key The key to check.
	 * @returns {boolean} Returns `true` if `key` exists, else `false`.
	 */


	function baseHas(object, key) {
	  return object != null && hasOwnProperty$2.call(object, key);
	}
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */


	function baseIsNative$1(value) {
	  if (!isObject$3(value) || isMasked$1(value)) {
	    return false;
	  }

	  var pattern = isFunction$2(value) || isHostObject$1(value) ? reIsNative$1 : reIsHostCtor$1;
	  return pattern.test(toSource$1(value));
	}
	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */


	function baseToString$1(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }

	  if (isSymbol$2(value)) {
	    return symbolToString$1 ? symbolToString$1.call(value) : '';
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$2 ? '-0' : result;
	}
	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast property path array.
	 */


	function castPath$1(value) {
	  return isArray$2(value) ? value : stringToPath$1(value);
	}
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */


	function getMapData$1(map, key) {
	  var data = map.__data__;
	  return isKeyable$1(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
	}
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */


	function getNative$1(object, key) {
	  var value = getValue$1(object, key);
	  return baseIsNative$1(value) ? value : undefined;
	}
	/**
	 * Checks if `path` exists on `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @param {Function} hasFunc The function to check properties.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 */


	function hasPath(object, path, hasFunc) {
	  path = isKey$1(path, object) ? [path] : castPath$1(path);
	  var result,
	      index = -1,
	      length = path.length;

	  while (++index < length) {
	    var key = toKey$1(path[index]);

	    if (!(result = object != null && hasFunc(object, key))) {
	      break;
	    }

	    object = object[key];
	  }

	  if (result) {
	    return result;
	  }

	  var length = object ? object.length : 0;
	  return !!length && isLength$1(length) && isIndex$2(key, length) && (isArray$2(object) || isArguments$1(object));
	}
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */


	function isIndex$2(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER$2 : length;
	  return !!length && (typeof value == 'number' || reIsUint$2.test(value)) && value > -1 && value % 1 == 0 && value < length;
	}
	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */


	function isKey$1(value, object) {
	  if (isArray$2(value)) {
	    return false;
	  }

	  var type = typeof value;

	  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol$2(value)) {
	    return true;
	  }

	  return reIsPlainProp$1.test(value) || !reIsDeepProp$1.test(value) || object != null && value in Object(object);
	}
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */


	function isKeyable$1(value) {
	  var type = typeof value;
	  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
	}
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */


	function isMasked$1(func) {
	  return !!maskSrcKey$1 && maskSrcKey$1 in func;
	}
	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */


	var stringToPath$1 = memoize$1(function (string) {
	  string = toString$1(string);
	  var result = [];

	  if (reLeadingDot$1.test(string)) {
	    result.push('');
	  }

	  string.replace(rePropName$1, function (match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar$1, '$1') : number || match);
	  });
	  return result;
	});
	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */

	function toKey$1(value) {
	  if (typeof value == 'string' || isSymbol$2(value)) {
	    return value;
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$2 ? '-0' : result;
	}
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */


	function toSource$1(func) {
	  if (func != null) {
	    try {
	      return funcToString$1.call(func);
	    } catch (e) {}

	    try {
	      return func + '';
	    } catch (e) {}
	  }

	  return '';
	}
	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */


	function memoize$1(func, resolver) {
	  if (typeof func != 'function' || resolver && typeof resolver != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT$2);
	  }

	  var memoized = function () {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }

	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result);
	    return result;
	  };

	  memoized.cache = new (memoize$1.Cache || MapCache$1)();
	  return memoized;
	} // Assign cache to `_.memoize`.


	memoize$1.Cache = MapCache$1;
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */

	function eq$1(value, other) {
	  return value === other || value !== value && other !== other;
	}
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */


	function isArguments$1(value) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject$1(value) && hasOwnProperty$2.call(value, 'callee') && (!propertyIsEnumerable$1.call(value, 'callee') || objectToString$3.call(value) == argsTag$1);
	}
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */


	var isArray$2 = Array.isArray;
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */

	function isArrayLike$1(value) {
	  return value != null && isLength$1(value.length) && !isFunction$2(value);
	}
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */


	function isArrayLikeObject$1(value) {
	  return isObjectLike$3(value) && isArrayLike$1(value);
	}
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */


	function isFunction$2(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject$3(value) ? objectToString$3.call(value) : '';
	  return tag == funcTag$2 || tag == genTag$2;
	}
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */


	function isLength$1(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
	}
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */


	function isObject$3(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */


	function isObjectLike$3(value) {
	  return !!value && typeof value == 'object';
	}
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */


	function isSymbol$2(value) {
	  return typeof value == 'symbol' || isObjectLike$3(value) && objectToString$3.call(value) == symbolTag$2;
	}
	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */


	function toString$1(value) {
	  return value == null ? '' : baseToString$1(value);
	}
	/**
	 * Checks if `path` is a direct property of `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 * @example
	 *
	 * var object = { 'a': { 'b': 2 } };
	 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
	 *
	 * _.has(object, 'a');
	 * // => true
	 *
	 * _.has(object, 'a.b');
	 * // => true
	 *
	 * _.has(object, ['a', 'b']);
	 * // => true
	 *
	 * _.has(other, 'a');
	 * // => false
	 */


	function has(object, path) {
	  return object != null && hasPath(object, path, baseHas);
	}

	var lodash_has = has;

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	/** Used as the `TypeError` message for "Functions" methods. */

	var FUNC_ERROR_TEXT$1 = 'Expected a function';
	/** Used to stand-in for `undefined` hash values. */

	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	/** Used as references for various `Number` constants. */

	var INFINITY$1 = 1 / 0,
	    MAX_SAFE_INTEGER$1 = 9007199254740991;
	/** `Object#toString` result references. */

	var funcTag$1 = '[object Function]',
	    genTag$1 = '[object GeneratorFunction]',
	    symbolTag$1 = '[object Symbol]';
	/** Used to match property names within property paths. */

	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/,
	    reLeadingDot = /^\./,
	    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */

	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	/** Used to match backslashes in property paths. */

	var reEscapeChar = /\\(\\)?/g;
	/** Used to detect host constructors (Safari). */

	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	/** Used to detect unsigned integer values. */

	var reIsUint$1 = /^(?:0|[1-9]\d*)$/;
	/** Detect free variable `global` from Node.js. */

	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
	/** Detect free variable `self`. */

	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	/** Used as a reference to the global object. */

	var root = freeGlobal || freeSelf || Function('return this')();
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */

	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */


	function isHostObject(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;

	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }

	  return result;
	}
	/** Used for built-in method references. */


	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto$2 = Object.prototype;
	/** Used to detect overreaching core-js shims. */

	var coreJsData = root['__core-js_shared__'];
	/** Used to detect methods masquerading as native. */

	var maskSrcKey = function () {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? 'Symbol(src)_1.' + uid : '';
	}();
	/** Used to resolve the decompiled source of functions. */


	var funcToString = funcProto.toString;
	/** Used to check objects for own properties. */

	var hasOwnProperty$1 = objectProto$2.hasOwnProperty;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */

	var objectToString$2 = objectProto$2.toString;
	/** Used to detect if a method is native. */

	var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
	/** Built-in value references. */

	var Symbol = root.Symbol,
	    splice = arrayProto.splice;
	/* Built-in method references that are verified to be native. */

	var Map$1 = getNative(root, 'Map'),
	    nativeCreate = getNative(Object, 'create');
	/** Used to convert symbols to primitives and strings. */

	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolToString = symbolProto ? symbolProto.toString : undefined;
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function Hash(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */


	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	}
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function hashDelete(key) {
	  return this.has(key) && delete this.__data__[key];
	}
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function hashGet(key) {
	  var data = this.__data__;

	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }

	  return hasOwnProperty$1.call(data, key) ? data[key] : undefined;
	}
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? data[key] !== undefined : hasOwnProperty$1.call(data, key);
	}
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */


	function hashSet(key, value) {
	  var data = this.__data__;
	  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
	  return this;
	} // Add methods to `Hash`.


	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function ListCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */


	function listCacheClear() {
	  this.__data__ = [];
	}
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }

	  var lastIndex = data.length - 1;

	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }

	  return true;
	}
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	  return index < 0 ? undefined : data[index][1];
	}
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */


	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }

	  return this;
	} // Add methods to `ListCache`.


	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */

	function MapCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	  this.clear();

	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */


	function mapCacheClear() {
	  this.__data__ = {
	    'hash': new Hash(),
	    'map': new (Map$1 || ListCache)(),
	    'string': new Hash()
	  };
	}
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */


	function mapCacheDelete(key) {
	  return getMapData(this, key)['delete'](key);
	}
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */


	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */


	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */


	function mapCacheSet(key, value) {
	  getMapData(this, key).set(key, value);
	  return this;
	} // Add methods to `MapCache`.


	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */

	function assignValue(object, key, value) {
	  var objValue = object[key];

	  if (!(hasOwnProperty$1.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
	    object[key] = value;
	  }
	}
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */


	function assocIndexOf(array, key) {
	  var length = array.length;

	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }

	  return -1;
	}
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */


	function baseIsNative(value) {
	  if (!isObject$2(value) || isMasked(value)) {
	    return false;
	  }

	  var pattern = isFunction$1(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}
	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */


	function baseSet(object, path, value, customizer) {
	  if (!isObject$2(object)) {
	    return object;
	  }

	  path = isKey(path, object) ? [path] : castPath(path);
	  var index = -1,
	      length = path.length,
	      lastIndex = length - 1,
	      nested = object;

	  while (nested != null && ++index < length) {
	    var key = toKey(path[index]),
	        newValue = value;

	    if (index != lastIndex) {
	      var objValue = nested[key];
	      newValue = customizer ? customizer(objValue, key, nested) : undefined;

	      if (newValue === undefined) {
	        newValue = isObject$2(objValue) ? objValue : isIndex$1(path[index + 1]) ? [] : {};
	      }
	    }

	    assignValue(nested, key, newValue);
	    nested = nested[key];
	  }

	  return object;
	}
	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */


	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }

	  if (isSymbol$1(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$1 ? '-0' : result;
	}
	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast property path array.
	 */


	function castPath(value) {
	  return isArray$1(value) ? value : stringToPath(value);
	}
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */


	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
	}
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */


	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */


	function isIndex$1(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER$1 : length;
	  return !!length && (typeof value == 'number' || reIsUint$1.test(value)) && value > -1 && value % 1 == 0 && value < length;
	}
	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */


	function isKey(value, object) {
	  if (isArray$1(value)) {
	    return false;
	  }

	  var type = typeof value;

	  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol$1(value)) {
	    return true;
	  }

	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
	}
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */


	function isKeyable(value) {
	  var type = typeof value;
	  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
	}
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */


	function isMasked(func) {
	  return !!maskSrcKey && maskSrcKey in func;
	}
	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */


	var stringToPath = memoize(function (string) {
	  string = toString(string);
	  var result = [];

	  if (reLeadingDot.test(string)) {
	    result.push('');
	  }

	  string.replace(rePropName, function (match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
	  });
	  return result;
	});
	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */

	function toKey(value) {
	  if (typeof value == 'string' || isSymbol$1(value)) {
	    return value;
	  }

	  var result = value + '';
	  return result == '0' && 1 / value == -INFINITY$1 ? '-0' : result;
	}
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */


	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}

	    try {
	      return func + '';
	    } catch (e) {}
	  }

	  return '';
	}
	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */


	function memoize(func, resolver) {
	  if (typeof func != 'function' || resolver && typeof resolver != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT$1);
	  }

	  var memoized = function () {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }

	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result);
	    return result;
	  };

	  memoized.cache = new (memoize.Cache || MapCache)();
	  return memoized;
	} // Assign cache to `_.memoize`.


	memoize.Cache = MapCache;
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */

	function eq(value, other) {
	  return value === other || value !== value && other !== other;
	}
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */


	var isArray$1 = Array.isArray;
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */

	function isFunction$1(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject$2(value) ? objectToString$2.call(value) : '';
	  return tag == funcTag$1 || tag == genTag$1;
	}
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */


	function isObject$2(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */


	function isObjectLike$2(value) {
	  return !!value && typeof value == 'object';
	}
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */


	function isSymbol$1(value) {
	  return typeof value == 'symbol' || isObjectLike$2(value) && objectToString$2.call(value) == symbolTag$1;
	}
	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */


	function toString(value) {
	  return value == null ? '' : baseToString(value);
	}
	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */


	function set(object, path, value) {
	  return object == null ? object : baseSet(object, path, value);
	}

	var lodash_set = set;

	const state$1 = {
	  previewSettings: {},
	  tokenSettings: {},
	  chatDeploymentId: '',
	  chatConfigurationId: '',
	  name: '',
	  useNgchat: false,
	  debug: true,
	  useBusinessHours: false,
	  cdn: 'prod',
	  lang: 'en',
	  initialLanguageSelection: true,
	  l10n: {},
	  languages: {
	    enabled: false,
	    languages: []
	  },
	  prepopulatedFields: {},
	  messenger: {
	    soundNotificationEnabled: false
	  },
	  proactive: {},
	  conversationInProgress: false,
	  clearMessagesTimeout: 3,
	  isOpened: false
	};
	const getState = function (key = false) {
	  if (key !== false) {
	    return JSON.parse(JSON.stringify(lodash_get(state$1, key) ?? ''));
	  } else {
	    return JSON.parse(JSON.stringify(state$1) ?? '');
	  }
	};
	const mutate = function (key) {
	  if (lodash_has(state$1, key)) {
	    return newState => {
	      lodash_set(state$1, key, newState);
	    };
	  } else {
	    throw new Error('Store#mutate -- Invalid key: ' + key);
	  }
	};

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	/** Used as references for various `Number` constants. */

	var MAX_SAFE_INTEGER = 9007199254740991;
	/** `Object#toString` result references. */

	var argsTag = '[object Arguments]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	/** Used to detect unsigned integer values. */

	var reIsUint = /^(?:0|[1-9]\d*)$/;
	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */

	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }

	  return result;
	}
	/** Used for built-in method references. */


	var objectProto$1 = Object.prototype;
	/** Used to check objects for own properties. */

	var hasOwnProperty = objectProto$1.hasOwnProperty;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */

	var objectToString$1 = objectProto$1.toString;
	/** Built-in value references. */

	var propertyIsEnumerable = objectProto$1.propertyIsEnumerable;
	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */

	function arrayLikeKeys(value, inherited) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  // Safari 9 makes `arguments.length` enumerable in strict mode.
	  var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
	  var length = result.length,
	      skipIndexes = !!length;

	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
	      result.push(key);
	    }
	  }

	  return result;
	}
	/**
	 * The base implementation of `baseForOwn` which iterates over `object`
	 * properties returned by `keysFunc` and invokes `iteratee` for each property.
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */


	var baseFor = createBaseFor();
	/**
	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */

	function baseKeysIn(object) {
	  if (!isObject$1(object)) {
	    return nativeKeysIn(object);
	  }

	  var isProto = isPrototype(object),
	      result = [];

	  for (var key in object) {
	    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }

	  return result;
	}
	/**
	 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */


	function createBaseFor(fromRight) {
	  return function (object, iteratee, keysFunc) {
	    var index = -1,
	        iterable = Object(object),
	        props = keysFunc(object),
	        length = props.length;

	    while (length--) {
	      var key = props[fromRight ? length : ++index];

	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }

	    return object;
	  };
	}
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */


	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
	}
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */


	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$1;
	  return value === proto;
	}
	/**
	 * This function is like
	 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * except that it includes inherited enumerable properties.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */


	function nativeKeysIn(object) {
	  var result = [];

	  if (object != null) {
	    for (var key in Object(object)) {
	      result.push(key);
	    }
	  }

	  return result;
	}
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */


	function isArguments(value) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString$1.call(value) == argsTag);
	}
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */


	var isArray = Array.isArray;
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */

	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */


	function isArrayLikeObject(value) {
	  return isObjectLike$1(value) && isArrayLike(value);
	}
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */


	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject$1(value) ? objectToString$1.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */


	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */


	function isObject$1(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */


	function isObjectLike$1(value) {
	  return !!value && typeof value == 'object';
	}
	/**
	 * Iterates over own and inherited enumerable string keyed properties of an
	 * object and invokes `iteratee` for each property. The iteratee is invoked
	 * with three arguments: (value, key, object). Iteratee functions may exit
	 * iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forInRight
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forIn(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a', 'b', then 'c' (iteration order is not guaranteed).
	 */


	function forIn(object, iteratee) {
	  return object == null ? object : baseFor(object, typeof iteratee == 'function' ? iteratee : identity, keysIn);
	}
	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */


	function keysIn(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
	}
	/**
	 * This method returns the first argument it receives.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 *
	 * console.log(_.identity(object) === object);
	 * // => true
	 */


	function identity(value) {
	  return value;
	}

	var lodash_forin = forIn;

	var index_min = {exports: {}};

	(function (module, exports) {
	  !function (t, e) {
	    module.exports = e() ;
	  }(self, () => (() => {

	    var t = {
	      492: function (t, e, n) {
	        var i = this && this.__createBinding || (Object.create ? function (t, e, n, i) {
	          void 0 === i && (i = n);
	          var o = Object.getOwnPropertyDescriptor(e, n);
	          o && !("get" in o ? !e.__esModule : o.writable || o.configurable) || (o = {
	            enumerable: !0,
	            get: function () {
	              return e[n];
	            }
	          }), Object.defineProperty(t, i, o);
	        } : function (t, e, n, i) {
	          void 0 === i && (i = n), t[i] = e[n];
	        }),
	            o = this && this.__exportStar || function (t, e) {
	          for (var n in t) "default" === n || Object.prototype.hasOwnProperty.call(e, n) || i(e, t, n);
	        };

	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), o(n(228), e), o(n(568), e), o(n(197), e), o(n(112), e), o(n(290), e), o(n(776), e), o(n(282), e), o(n(591), e);
	      },
	      228: function (t, e, n) {
	        var i = this && this.__importDefault || function (t) {
	          return t && t.__esModule ? t : {
	            default: t
	          };
	        };

	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.ManagerAPI = void 0;

	        var o = n(112),
	            r = n(197),
	            s = n(581),
	            a = i(n(286)),
	            c = n(282),
	            u = function () {
	          function t() {
	            this.widgets = new Map(), this.postMessageTarget = window.location.origin, (0, s.onMessageListener)(this.onMessage.bind(this));
	          }

	          return t.prototype.getWidget = function (t) {
	            return this.widgets.get(t);
	          }, t.prototype.onMessage = function (t) {
	            var e = this;

	            if (t && t.data && t.data.eventName) {
	              console.log("Received message from widget", t);
	              var n = t.data,
	                  i = n.id,
	                  o = n.eventName,
	                  r = this.getWidget(i);
	              if ((null == r ? void 0 : r.getWindow()) != t.source) return void console.debug("Invalid widget source window", null == r ? void 0 : r.getWindow());

	              if (o === c.WidgetSubscribeEvent.EVENT_NAME) {
	                var s = t.data.subscribeTopicUrl;
	                a.default.subscribe(s, {
	                  id: i,
	                  callback: function (t, n) {
	                    var i = e.getWidget(t);
	                    i && i.sendEvent(n);
	                  }
	                });
	              } else if (o === c.WidgetUnsubscribeEvent.EVENT_NAME) {
	                var u = t.data.unsubscribeTopicUrl;
	                a.default.unsubscribe(u, i);
	              } else if (o === c.WidgetPublishEvent.EVENT_NAME) {
	                var l = t.data,
	                    d = l.publishTopicUrl,
	                    p = l.publishEvent;
	                a.default.publish(d, p);
	              } else console.error("unsupported remote pubsub event", t);
	            }
	          }, t.prototype.subscribe = function (t, e) {
	            a.default.subscribe(t, {
	              id: "managerId",
	              callback: e
	            });
	          }, t.prototype.unsubscribe = function (t, e) {
	            a.default.unsubscribe(t, e);
	          }, t.prototype.publish = function (t, e) {
	            a.default.publish(t, e);
	          }, t.prototype.createWidget = function (t, e) {
	            var n = new r.IFrameWidget(t, e);
	            return this.widgets.set(t, n), n;
	          }, t.prototype.createWindowWidget = function (t, e, n) {
	            var i = new o.WindowWidget(t, e, n);
	            return this.widgets.set(t, i), i;
	          }, t;
	        }();

	        e.ManagerAPI = u;
	      },
	      568: (t, e, n) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.WidgetAPI = void 0;

	        var i = n(282),
	            o = n(581),
	            r = n(591),
	            s = function () {
	          function t() {
	            var t, e;
	            this.parent = window == window.top ? window.opener : window.parent, this.postMessageTarget = "*", this.callbacks = new Map(), this.id = null !== (e = null === (t = window.frameElement) || void 0 === t ? void 0 : t.getAttribute("id")) && void 0 !== e ? e : window.name, (0, o.onMessageListener)(this.onMessage.bind(this));
	          }

	          return t.prototype.getId = function () {
	            return this.id;
	          }, t.prototype.setPostMessageTarget = function (t) {
	            console.log("Existing origin: ", this.postMessageTarget, " set origin to: ", t), "*" === this.postMessageTarget && (this.postMessageTarget = t);
	          }, t.prototype.onMessage = function (t) {
	            var e;

	            if (t && t.data && t.data.eventName) {
	              if (this.parent != t.source) return void console.error("Invalid parent source window");
	              var n = t.data;

	              if (console.log("Received event from manager ", t), n.eventName === i.DataExchangeEvent.EVENT_NAME) {
	                var o = null === (e = n.initData) || void 0 === e ? void 0 : e.parentOrigin;
	                this.setPostMessageTarget(o);
	              }

	              var s = this.callbacks.get((0, r.getWidgetTopicUrl)(this.id, n.eventName));
	              s ? s(this.id, n) : console.error("No callback found for", (0, r.getWidgetTopicUrl)(this.id, n.eventName));
	            }
	          }, t.prototype.subscribe = function (t, e) {
	            var n;
	            this.callbacks.set(t, e);
	            var o = new i.WidgetSubscribeEvent(this.id, t);
	            null === (n = this.parent) || void 0 === n || n.postMessage(o, this.postMessageTarget);
	          }, t.prototype.unsubscribe = function (t) {
	            var e;
	            this.callbacks.delete(t);
	            var n = new i.WidgetUnsubscribeEvent(this.id, t);
	            null === (e = this.parent) || void 0 === e || e.postMessage(n, this.postMessageTarget);
	          }, t.prototype.publish = function (t, e) {
	            var n,
	                o = new i.WidgetPublishEvent(this.id, t, e);
	            null === (n = this.parent) || void 0 === n || n.postMessage(o, this.postMessageTarget);
	          }, t;
	        }();

	        e.WidgetAPI = s;
	      },
	      591: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.getWidgetTopicUrl = void 0, e.getWidgetTopicUrl = function (t, e) {
	          return "".concat(e, ".").concat(t);
	        };
	      },
	      286: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        });
	        var n = new function () {
	          var t = this;
	          this.topics = new Map(), this.subscribe = function (e, n) {
	            var i = t.topics.get(e);
	            t.topics.set(e, (null != i ? i : []).filter(function (t) {
	              return t.id !== n.id;
	            }).concat([n]));
	          }, this.unsubscribe = function (e, n) {
	            var i = t.topics.get(e),
	                o = (null != i ? i : []).filter(function (t) {
	              return t.id !== n;
	            });
	            0 != o.length ? t.topics.set(e, o) : t.topics.delete(e);
	          }, this.publish = function (e, n) {
	            var i = t.topics.get(e);
	            null == i || i.forEach(function (t) {
	              t.callback(t.id, n);
	            });
	          };
	        }();
	        e.default = n;
	      },
	      776: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        });
	      },
	      290: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.deserializeData = e.serializeData = void 0, e.serializeData = function (t) {
	          return btoa(JSON.stringify(null != t ? t : {}));
	        }, e.deserializeData = function (t) {
	          return t ? JSON.parse(atob(t)) : {};
	        };
	      },
	      282: function (t, e) {
	        var n,
	            i = this && this.__extends || (n = function (t, e) {
	          return n = Object.setPrototypeOf || {
	            __proto__: []
	          } instanceof Array && function (t, e) {
	            t.__proto__ = e;
	          } || function (t, e) {
	            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	          }, n(t, e);
	        }, function (t, e) {
	          if ("function" != typeof e && null !== e) throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");

	          function i() {
	            this.constructor = t;
	          }

	          n(t, e), t.prototype = null === e ? Object.create(e) : (i.prototype = e.prototype, new i());
	        });
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.WidgetPublishEvent = e.WidgetUnsubscribeEvent = e.WidgetSubscribeEvent = e.ChatCustomEvent = e.DataExchangeEvent = e.AppStateEvent = e.WidgetFatalErrorEvent = e.WidgetReadyEvent = e.Event = void 0;

	        var o = function () {
	          function t(t, e, n) {
	            this.schema = "javascript_object", this.timestamp = new Date().toISOString(), this.version = t, this.eventName = e, this.id = n;
	          }

	          return t.prototype.getId = function () {
	            return this.id;
	          }, t.prototype.getEventName = function () {
	            return this.eventName;
	          }, t;
	        }();

	        e.Event = o;

	        var r = function (t) {
	          function e(n) {
	            return t.call(this, 1, e.EVENT_NAME, n) || this;
	          }

	          return i(e, t), e.EVENT_NAME = "WIDGET_READY", e;
	        }(o);

	        e.WidgetReadyEvent = r;

	        var s = function (t) {
	          function e(n, i, o) {
	            var r = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return r.errorCode = i, r.errorMessages = o, r;
	          }

	          return i(e, t), e.EVENT_NAME = "WIDGET_FATAL_ERROR", e;
	        }(o);

	        e.WidgetFatalErrorEvent = s;

	        var a = function (t) {
	          function e(n, i) {
	            var o = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return o.appState = i, o;
	          }

	          return i(e, t), e.EVENT_NAME = "APP_STATE_EVENT", e;
	        }(o);

	        e.AppStateEvent = a;

	        var c = function (t) {
	          function e(n, i) {
	            var o = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return o.initData = i, o;
	          }

	          return i(e, t), e.EVENT_NAME = "DATA_EXCHANGE_EVENT", e;
	        }(o);

	        e.DataExchangeEvent = c;

	        var u = function (t) {
	          function e(n, i) {
	            var o = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return o.eventData = i, o;
	          }

	          return i(e, t), e.EVENT_NAME = "CHAT_CUSTOM_EVENT", e;
	        }(o);

	        e.ChatCustomEvent = u;

	        var l = function (t) {
	          function e(n, i) {
	            var o = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return o.subscribeTopicUrl = i, o;
	          }

	          return i(e, t), e.EVENT_NAME = "WIDGET_SUBSCRIBE_EVENT", e;
	        }(o);

	        e.WidgetSubscribeEvent = l;

	        var d = function (t) {
	          function e(n, i) {
	            var o = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return o.unsubscribeTopicUrl = i, o;
	          }

	          return i(e, t), e.EVENT_NAME = "WIDGET_UNSUBSCRIBE_EVENT", e;
	        }(o);

	        e.WidgetUnsubscribeEvent = d;

	        var p = function (t) {
	          function e(n, i, o) {
	            var r = t.call(this, 1, e.EVENT_NAME, n) || this;
	            return r.publishTopicUrl = i, r.publishEvent = o, r;
	          }

	          return i(e, t), e.EVENT_NAME = "WIDGET_PUBLISH_EVENT", e;
	        }(o);

	        e.WidgetPublishEvent = p;
	      },
	      581: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.onMessageListener = void 0, e.onMessageListener = function (t) {
	          var e = window.addEventListener ? "addEventListener" : "attachEvent";
	          (0, window[e])("attachEvent" === e ? "onmessage" : "message", t, !1);
	        };
	      },
	      325: (t, e) => {
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.AbstractWidget = void 0;

	        var n = function () {
	          function t(t) {
	            this.id = t;
	          }

	          return t.prototype.getId = function () {
	            return this.id;
	          }, t;
	        }();

	        e.AbstractWidget = n;
	      },
	      197: function (t, e, n) {
	        var i,
	            o = this && this.__extends || (i = function (t, e) {
	          return i = Object.setPrototypeOf || {
	            __proto__: []
	          } instanceof Array && function (t, e) {
	            t.__proto__ = e;
	          } || function (t, e) {
	            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	          }, i(t, e);
	        }, function (t, e) {
	          if ("function" != typeof e && null !== e) throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");

	          function n() {
	            this.constructor = t;
	          }

	          i(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
	        });
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.IFrameWidget = void 0;

	        var r = function (t) {
	          function e(e, n) {
	            var i = t.call(this, e) || this;
	            i.element = document.createElement("IFRAME"), i.element.id = e, Object.keys(n).forEach(function (t) {
	              i.element[t] = n[t];
	            });
	            var o = new URL(i.element.src);
	            return i.element.src = o.toString(), i.postMessageTarget = o.origin, i;
	          }

	          return o(e, t), e.prototype.getHtmlElement = function () {
	            return this.element;
	          }, e.prototype.getWindow = function () {
	            var t, e;
	            return null !== (e = null === (t = this.element) || void 0 === t ? void 0 : t.contentWindow) && void 0 !== e ? e : void 0;
	          }, e.prototype.sendEvent = function (t) {
	            this.element.contentWindow && this.element.contentWindow.postMessage(t, this.postMessageTarget);
	          }, e;
	        }(n(325).AbstractWidget);

	        e.IFrameWidget = r;
	      },
	      112: function (t, e, n) {
	        var i,
	            o = this && this.__extends || (i = function (t, e) {
	          return i = Object.setPrototypeOf || {
	            __proto__: []
	          } instanceof Array && function (t, e) {
	            t.__proto__ = e;
	          } || function (t, e) {
	            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	          }, i(t, e);
	        }, function (t, e) {
	          if ("function" != typeof e && null !== e) throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");

	          function n() {
	            this.constructor = t;
	          }

	          i(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
	        });
	        Object.defineProperty(e, "__esModule", {
	          value: !0
	        }), e.WindowWidget = e.windowFeaturesToString = void 0;
	        var r = n(325);

	        function s(t) {
	          return t ? "yes" : "no";
	        }

	        function a(t) {
	          var e = t.height,
	              n = t.left,
	              i = t.top,
	              o = t.width,
	              r = t.resizable,
	              a = t.scrollbars,
	              c = t.status,
	              u = t.toolbar,
	              l = t.location;
	          return void 0 === r && (r = !1), void 0 === a && (a = !1), void 0 === c && (c = !1), void 0 === u && (u = !1), void 0 === l && (l = !1), ["height=".concat(e), "left=".concat(n), "resizable=".concat(s(r)), "scrollbars=".concat(s(a)), "status=".concat(s(c)), "toolbar=".concat(s(u)), "top=".concat(i), "width=".concat(o), "location=".concat(l)].join(",");
	        }

	        e.windowFeaturesToString = a;

	        var c = function (t) {
	          function e(e, n, i) {
	            var o = t.call(this, e) || this,
	                r = new URL(n, window.location.origin),
	                s = i ? a(i) : void 0,
	                c = window.open(r.href, e, s);
	            return c && (o.element = c), o.postMessageTarget = r.origin, o;
	          }

	          return o(e, t), e.prototype.getHtmlElement = function () {
	            return this.element;
	          }, e.prototype.getWindow = function () {
	            return this.element;
	          }, e.prototype.sendEvent = function (t) {
	            this.element && this.element.postMessage(t, this.postMessageTarget);
	          }, e;
	        }(r.AbstractWidget);

	        e.WindowWidget = c;
	      }
	    },
	        e = {};
	    return function n(i) {
	      var o = e[i];
	      if (void 0 !== o) return o.exports;
	      var r = e[i] = {
	        exports: {}
	      };
	      return t[i].call(r.exports, r, r.exports, n), r.exports;
	    }(492);
	  })());
	})(index_min);

	const managerAPI = new index_min.exports.ManagerAPI();

	const CDN = {
	  localhost: 'http://localhost',
	  int2: 'https://cdn.int2.us.five9nonprod.net/',
	  qetest2: 'https://cdn.qetest2.us.five9nonprod.net/',
	  'alpha-us': 'https://cdn.prod.us.five9.net/static/alpha/',
	  'alpha-ca': 'https://cdn.prod.ca.five9.net/static/alpha/',
	  'alpha-eu': 'https://cdn.prod.eu.five9.net/static/alpha/',
	  'alpha-uk': 'https://cdn.prod.uk.five9.net/static/alpha/',
	  prod: 'https://cdn.prod.us.five9.net/',
	  'prod-ca': 'https://cdn.prod.ca.five9.net/',
	  'prod-eu': 'https://cdn.prod.eu.five9.net/',
	  'prod-uk': 'https://cdn.prod.uk.five9.net/'
	};
	const NGCHAT_CDN = {
	  localhost: 'http://localhost',
	  int2: 'https://cdn.int2.us.five9nonprod.net/stable/',
	  qetest2: 'https://cdn.qetest2.us.five9nonprod.net/stable/',
	  'alpha-us': 'https://cdn.prod.us.five9.net/alpha/',
	  'alpha-ca': 'https://cdn.prod.ca.five9.net/alpha/',
	  'alpha-eu': 'https://cdn.prod.eu.five9.net/alpha/',
	  'alpha-uk': 'https://cdn.prod.uk.five9.net/alpha/',
	  prod: 'https://cdn.prod.us.five9.net/stable/',
	  'prod-ca': 'https://cdn.prod.ca.five9.net/stable/',
	  'prod-eu': 'https://cdn.prod.eu.five9.net/stable/',
	  'prod-in': 'https://cdn.prod.in.five9.net/stable/',
	  'prod-uk': 'https://cdn.prod.uk.five9.net/stable/'
	};
	const PROACTIVE_CDN = {
	  localhost: 'http://localhost',
	  int2: 'https://cdn.int2.us.five9nonprod.net/static/stable/',
	  qetest2: 'https://cdn.qetest2.us.five9nonprod.net/static/stable/',
	  'alpha-us': 'https://cdn.prod.us.five9.net/static/alpha/',
	  'alpha-ca': 'https://cdn.prod.ca.five9.net/static/alpha/',
	  'alpha-eu': 'https://cdn.prod.eu.five9.net/static/alpha/',
	  'alpha-uk': 'https://cdn.prod.uk.five9.net/static/alpha/',
	  prod: 'https://cdn.prod.us.five9.net/static/stable/',
	  'prod-ca': 'https://cdn.prod.ca.five9.net/static/stable/',
	  'prod-eu': 'https://cdn.prod.eu.five9.net/static/stable/',
	  'prod-in': 'https://cdn.prod.in.five9.net/static/stable/',
	  'prod-uk': 'https://cdn.prod.uk.five9.net/static/stable/'
	};
	const ADP_REST = {
	  localhost: 'https://qaapp01.five9lab.com',
	  int2: 'https://qaapp01.five9lab.com',
	  qetest2: 'https://qaapp11.five9lab.com',
	  'alpha-us': 'https://app.five9.com',
	  prod: 'https://app.five9.com',
	  'prod-ca': 'https://app.ca.five9.com',
	  'prod-eu': 'https://app.eu.five9.com',
	  'prod-in': 'https://app.in.five9.com',
	  'prod-uk': 'https://app-ldn.five9.eu'
	};
	const CONFIGURATION_CDN = {
	  localhost: 'http://localhost:7820',
	  int2: 'https://web-messenger.int2.us.five9nonprod.net',
	  qetest2: 'https://web-messenger.qetest2.us.five9nonprod.net',
	  'alpha-us': 'https://web-messenger.prod.us.five9.net',
	  'alpha-ca': 'https://web-messenger.prod.ca.five9.net',
	  'alpha-eu': 'https://web-messenger.prod.eu.five9.net',
	  'alpha-uk': 'https://web-messenger.prod.uk.five9.net',
	  prod: 'https://web-messenger.prod.us.five9.net',
	  'prod-ca': 'https://web-messenger.prod.ca.five9.net',
	  'prod-eu': 'https://web-messenger.prod.eu.five9.net',
	  'prod-in': 'https://web-messenger.prod.in.five9.net',
	  'prod-uk': 'https://web-messenger.prod.uk.five9.net'
	};
	const getProactiveCssUrl = cdn => {
	  const baseUrl = PROACTIVE_CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':8755/css/proactive.css';
	  }

	  return baseUrl + 'chat/proactive/css/proactive.css';
	};
	const getProactiveScriptUrl = cdn => {
	  const baseUrl = PROACTIVE_CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':8755/index.js';
	  }

	  return baseUrl + 'chat/proactive/index.js';
	};
	const getNgchatUrl = cdn => {
	  const baseUrl = NGCHAT_CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':5173?mock=true';
	  }

	  return baseUrl + 'chat/ngchat-app';
	};
	const getRestAPI = cdn => {
	  const baseUrl = ADP_REST[cdn];
	  return baseUrl;
	};
	const getConfigurationCdnHost = cdn => {
	  return CONFIGURATION_CDN[cdn];
	};
	const webMessenger = cdn => {
	  const baseUrl = CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':8731/';
	  }

	  if (cdn.indexOf('alpha-') !== -1) {
	    return baseUrl + 'chat/fivn/';
	  } else {
	    return baseUrl + 'static/stable/chat/fivn/';
	  }
	};
	const webMessengerWrapper = cdn => {
	  const baseUrl = CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':8733/';
	  }

	  if (cdn.indexOf('alpha-') !== -1) {
	    return baseUrl + 'chat/wrapper/';
	  } else {
	    return baseUrl + 'static/stable/chat/wrapper/';
	  }
	};
	const languageWidget = cdn => {
	  const baseUrl = CDN[cdn];

	  if (cdn === 'localhost') {
	    return baseUrl + ':8787/';
	  }

	  if (cdn.indexOf('alpha-') !== -1) {
	    return baseUrl + 'chat/language/';
	  } else {
	    return baseUrl + 'static/stable/chat/language/';
	  }
	};

	const applyRule = (element, className) => {
	  element === null || element === void 0 ? void 0 : element.classList.add(className);
	};
	const removeRule = (element, className) => {
	  element === null || element === void 0 ? void 0 : element.classList.remove(className);
	};
	const addProactiveStylesheet = () => {
	  const proactiveCssUrl = getProactiveCssUrl(getState('cdn'));
	  const style = document.createElement('link');
	  style.setAttribute('rel', 'stylesheet');
	  style.setAttribute('type', 'text/css');
	  style.setAttribute('href', proactiveCssUrl);
	  document.head.appendChild(style);
	};

	const getSizeOffset = unit => {
	  const units = ['rem', 'vh', 'vw'];
	  return units.includes(unit.trim().toLowerCase()) ? 3 : 30;
	};

	const convertSize = size => {
	  const match = size.match(/^(\d+)([a-zA-Z%]*)$/);
	  const unit = match && match[2] ? match[2] : 'px';
	  const number = (match ? Number(match[1]) : 58) + getSizeOffset(unit);
	  return number + unit;
	};

	const addNgchatStylesheet = options => {
	  var _options$messenger, _options$messenger2, _options$messenger3;

	  // for mobile
	  const meta = document.createElement('meta');
	  meta.setAttribute('name', 'viewport');
	  const setMaxScale = Boolean(options === null || options === void 0 ? void 0 : (_options$messenger = options.messenger) === null || _options$messenger === void 0 ? void 0 : _options$messenger.setViewportScale);
	  const metaOption = setMaxScale ? 'width=device-width, initial-scale=1, maximum-scale=1' : 'width=device-width, initial-scale=1';
	  meta.setAttribute('content', metaOption);
	  document.head.appendChild(meta);
	  const style = document.createElement('style');
	  const buttonWidth = convertSize((options === null || options === void 0 ? void 0 : (_options$messenger2 = options.messenger) === null || _options$messenger2 === void 0 ? void 0 : _options$messenger2.buttonWidth) ?? '58');
	  const buttonHeight = convertSize((options === null || options === void 0 ? void 0 : (_options$messenger3 = options.messenger) === null || _options$messenger3 === void 0 ? void 0 : _options$messenger3.buttonHeight) ?? '58');
	  style.innerHTML = `
  @keyframes keyframe1 {
    0% {
        width: 400px;
        height: 668px;
        right: 10px;
    }

    100% {
        width: 400px;
        height: 668px;
        right: 10px;
    }
}

@-webkit-keyframes keyframe1 {
    0% {
        width: 400px;
        height: 668px;
        right: 10px;
    }

    100% {
        width: 400px;
        height: 668px;
        right: 10px;
    }
}

@keyframes keyframe2 {
    0% {
        width: 374px;
        height: 504px;
        right: 10px;
    }
    100% {
        width: 374px;
        height: 504px;
        right: 10px;
    }
}

@-webkit-keyframes keyframe2 {
    0% {
        width: 374px;
        height: 504px;
        right: 10px;
    }
    100% {
        width: 374px;
        height: 504px;
        right: 10px;
    }
}

@keyframes keyframe3 {
    0% {
        width: 354px;
        height: 444px;
        right: 10px;
    }
    100% {
        width: 354px;
        height: 444px;
        right: 10px;
    }
}

@-webkit-keyframes keyframe3 {
    0% {
        width: 354px;
        height: 444px;
        right: 10px;
    }
    100% {
        width: 354px;
        height: 444px;
        right: 10px;
    }
}

@keyframes keyframe4 {
    0% {
        width: 100%;
        height: 100%;
        min-height: 300px
    }
    100% {
        width: 100%;
        height: 100%;
        min-height: 300px
    }
}

@-webkit-keyframes keyframe4 {
    0% {
        width: 100%;
        height: 100%;
        min-height: 300px
    }
    100% {
        width: 100%;
        height: 100%;
        min-height: 300px
    }
}

@keyframes keyframe5 {
    0% {
        width: 100%;
        height: 90%
    }
    100% {
        width: 100%;
        height: 90%
    }
}

@-webkit-keyframes keyframe5 {
    0% {
        width: 100%;
        height: 90%
    }
    100% {
        width: 100%;
        height: 90%
    }
}

@media (min-width:768px) and (min-height:668px) {
    .f9ChatOpened {
        -webkit-animation: keyframe1 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe1 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: .2s;
        animation-delay: .2s;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
    }
}

@media (max-width:768px) and (min-height:508px) {
    .f9ChatOpened {
        -webkit-animation: keyframe2 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe2 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: .2s;
        animation-delay: .2s;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
    }
}

@media (min-width:768px) and (max-height:507px) {
    .f9ChatOpened {
        -webkit-animation: keyframe3 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe3 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: .2s;
        animation-delay: .2s;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
    }
}

@media (max-width:767px) {
    .f9ChatOpened {
        -webkit-animation: keyframe4 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe4 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: 0;
        animation-delay: 0;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
    }
}

@media (max-width:767px) and (orientation: landscape) {
    .f9ChatOpened.f9ChatOpened {
        -webkit-animation: keyframe5 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe5 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: 0;
        animation-delay: 0;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
        overflow: auto;
        min-height: 250px;
    }
}

@media (min-width:768px) and (max-height:507px) and (orientation: landscape){
    .f9ChatOpened.f9ChatOpened {
        -webkit-animation: keyframe5 .4s cubic-bezier(.62, .28, .23, .99);
        animation: keyframe5 .4s cubic-bezier(.62, .28, .23, .99);
        -webkit-animation-delay: 0;
        animation-delay: 0;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both
        overflow: auto;
        min-height: 250px;
    }
}

@media (forced-colors: active) {
  .f9ChatOpened.f9ChatOpened, .f9ChatEmbedded.f9ChatEmbedded{
    border-width: 1px;
    border-color: transparent;
    border: solid;
  }
}

.f9ChatWidget {
    position: fixed;
    right: 14px;
    bottom: 20px;
    margin-bottom: -1px;
    z-index: 9996;
    border: none;
}

.f9ChatOpened {
    min-height: 560px;
    right: 0px;
    bottom: 3px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
    border-radius: 12px;
}

.f9ChatMinimizedButton {
    bottom: 20px;
    right: 20px;
    width: ${buttonWidth};
    height: ${buttonHeight};
    overflow: hidden;
}

.f9ChatMinimizedTab {
    bottom: 0px;
    width: 400px;
    height: 80px;
    overflow: hidden;
}

.f9ChatEmbedded {
    position: absolute;
    bottom: 4px;
    right: 0px;
    width: 100%;
    height: 99%;
    overflow: hidden;
}

.f9ChatPreviewWidth {
    width: 400px;
}

/* Dragging should not change visual appearance (avoid square/overlay artifacts) */
.f9-dragging {
    cursor: move !important;
    user-select: none;
    opacity: 1 !important;
    box-shadow: none !important;
    background: transparent !important;
}

.f9ChatWidget.f9ChatMinimizedButton,
.f9ChatWidget.f9ChatMinimizedTab {
    cursor: move;
}
  `;
	  document.head.append(style);
	};

	const DEBUG_NAMESPACE = 'F9.Chat.Wrapper';

	const isDebug = () => {
	  return getState('debug');
	};
	function debug (message, ...args) {
	  isDebug() && console.debug(`${DEBUG_NAMESPACE}: ${message}`, ...args);
	}

	const MessengerVersion = '2.1.1';
	const MessengerNamespace = 'FIVN';
	const ChatSystemEvents = ['conversationCreated', 'participantAccepted', 'participantJoined', 'participantLeft', 'transferredToParticipant', 'transferredToGroup', 'conversationTerminated'];
	const TRANSFORMS = {
	  HIDE: 'hide',
	  I18N: 'i18n',
	  I18NF: 'i18n_format'
	};
	const LANGUAGES = {
	  af: {
	    name: 'Afrikaans',
	    caption: 'Afrikaans'
	  },
	  am: {
	    name: 'Amharic',
	    caption: 'አማርኛ'
	  },
	  ang: {
	    name: 'Angal',
	    caption: 'Angal Heneng'
	  },
	  ar: {
	    name: 'Arabic',
	    caption: 'العربية'
	  },
	  az: {
	    name: 'Azerbaijani',
	    caption: 'Azərbaycanca / آذربايجان'
	  },
	  be: {
	    name: 'Belarusian',
	    caption: 'Беларуская'
	  },
	  bg: {
	    name: 'Bulgarian',
	    caption: 'Български'
	  },
	  bn: {
	    name: 'Bengali',
	    caption: 'বাংলা'
	  },
	  bs: {
	    name: 'Bosnian',
	    caption: 'Bosanski'
	  },
	  ca: {
	    name: 'Catalan',
	    caption: 'Català'
	  },
	  ceb: {
	    name: 'Cebuano',
	    caption: 'Sinugboanong Binisaya'
	  },
	  co: {
	    name: 'Corsican',
	    caption: 'Corsu'
	  },
	  cs: {
	    name: 'Czech',
	    caption: 'Česky'
	  },
	  cy: {
	    name: 'Welsh',
	    caption: 'Cymraeg'
	  },
	  da: {
	    name: 'Danish',
	    caption: 'Dansk'
	  },
	  de: {
	    name: 'German',
	    caption: 'Deutsch'
	  },
	  el: {
	    name: 'Greek',
	    caption: 'Ελληνικά'
	  },
	  en: {
	    name: 'English',
	    caption: 'English'
	  },
	  eo: {
	    name: 'Esperanto',
	    caption: 'Esperanto'
	  },
	  es: {
	    name: 'Spanish',
	    caption: 'Español'
	  },
	  et: {
	    name: 'Estonian',
	    caption: 'Eesti'
	  },
	  eu: {
	    name: 'Basque',
	    caption: 'Euskara'
	  },
	  fa: {
	    name: 'Persian',
	    caption: 'فارسی'
	  },
	  fi: {
	    name: 'Finnish',
	    caption: 'Suomi'
	  },
	  fr: {
	    name: 'French',
	    caption: 'Français'
	  },
	  fy: {
	    name: 'West Frisian',
	    caption: 'Frysk'
	  },
	  ga: {
	    name: 'Irish',
	    caption: 'Gaeilge'
	  },
	  gd: {
	    name: 'Scottish Gaelic',
	    caption: 'Gàidhlig'
	  },
	  gl: {
	    name: 'Galician',
	    caption: 'Galego'
	  },
	  gu: {
	    name: 'Gujarati',
	    caption: 'ગુજરાતી'
	  },
	  ha: {
	    name: 'Hausa',
	    caption: 'هَوُسَ'
	  },
	  haw: {
	    name: 'Hawaiian',
	    caption: 'Hawai`i'
	  },
	  he: {
	    name: 'Hebrew',
	    caption: 'עברית'
	  },
	  hi: {
	    name: 'Hindi',
	    caption: 'हिन्दी'
	  },
	  hr: {
	    name: 'Croatian',
	    caption: 'Hrvatski'
	  },
	  ht: {
	    name: 'Haitian',
	    caption: 'Krèyol ayisyen'
	  },
	  hu: {
	    name: 'Hungarian',
	    caption: 'Magyar'
	  },
	  hy: {
	    name: 'Armenian',
	    caption: 'Հայերեն'
	  },
	  id: {
	    name: 'Indonesian',
	    caption: 'Bahasa Indonesia'
	  },
	  ig: {
	    name: 'Igbo',
	    caption: 'Igbo'
	  },
	  is: {
	    name: 'Icelandic',
	    caption: 'Íslenska'
	  },
	  it: {
	    name: 'Italian',
	    caption: 'Italiano'
	  },
	  ja: {
	    name: 'Japanese',
	    caption: '日本語'
	  },
	  jv: {
	    name: 'Javanese',
	    caption: 'Basa Jawa'
	  },
	  ka: {
	    name: 'Georgian',
	    caption: 'ქართული'
	  },
	  kk: {
	    name: 'Kazakh',
	    caption: 'Қазақша'
	  },
	  km: {
	    name: 'Cambodian',
	    caption: 'ភាសាខ្មែរ'
	  },
	  kn: {
	    name: 'Kannada',
	    caption: 'ಕನ್ನಡ'
	  },
	  ko: {
	    name: 'Korean',
	    caption: '한국어'
	  },
	  ku: {
	    name: 'Kurdish (Kurmanji)',
	    caption: 'Kurdî'
	  },
	  ky: {
	    name: 'Kirghiz',
	    caption: 'Kırgızca / Кыргызча'
	  },
	  lb: {
	    name: 'Luxembourgish',
	    caption: 'Lëtzebuergesch'
	  },
	  lo: {
	    name: 'Laotian',
	    caption: 'ລາວ / Pha xa lao'
	  },
	  lt: {
	    name: 'Lithuanian',
	    caption: 'Lietuvių'
	  },
	  lv: {
	    name: 'Latvian',
	    caption: 'Latviešu'
	  },
	  mg: {
	    name: 'Malagasy',
	    caption: 'Malagasy'
	  },
	  mi: {
	    name: 'Māori',
	    caption: 'Māori'
	  },
	  mk: {
	    name: 'Macedonian',
	    caption: 'Македонски'
	  },
	  ml: {
	    name: 'Malayalam',
	    caption: 'മലയാളം'
	  },
	  mn: {
	    name: 'Mongolian',
	    caption: 'Монгол'
	  },
	  mr: {
	    name: 'Marathi',
	    caption: 'मराठी'
	  },
	  ms: {
	    name: 'Malay',
	    caption: 'Bahasa Melayu'
	  },
	  mt: {
	    name: 'Maltese',
	    caption: 'bil-Malti'
	  },
	  my: {
	    name: 'Burmese',
	    caption: 'Myanmasa'
	  },
	  ne: {
	    name: 'Nepali',
	    caption: 'नेपाली'
	  },
	  nl: {
	    name: 'Dutch',
	    caption: 'Nederlands'
	  },
	  no: {
	    name: 'Norwegian',
	    caption: 'Norsk (bokmål / riksmål)'
	  },
	  ny: {
	    name: 'Chichewa',
	    caption: 'Chi-Chewa'
	  },
	  or: {
	    name: 'Oriya',
	    caption: 'ଓଡ଼ିଆ'
	  },
	  pa: {
	    name: 'Panjabi / Punjabi',
	    caption: 'ਪੰਜਾਬੀ / پنجابی'
	  },
	  pl: {
	    name: 'Polish',
	    caption: 'Polski'
	  },
	  ps: {
	    name: 'Pashto',
	    caption: 'پښتو'
	  },
	  pt: {
	    name: 'Portuguese',
	    caption: 'Português'
	  },
	  ro: {
	    name: 'Romanian',
	    caption: 'Română'
	  },
	  ru: {
	    name: 'Russian',
	    caption: 'Русский'
	  },
	  rw: {
	    name: 'Rwandi',
	    caption: 'Kinyarwandi'
	  },
	  sd: {
	    name: 'Sindhi',
	    caption: 'सिंधी / سنڌي'
	  },
	  si: {
	    name: 'Sinhalese',
	    caption: 'සිංහල'
	  },
	  sk: {
	    name: 'Slovak',
	    caption: 'Slovenčina'
	  },
	  sl: {
	    name: 'Slovenian',
	    caption: 'Slovenščina'
	  },
	  sm: {
	    name: 'Samoan',
	    caption: 'Gagana Samoa'
	  },
	  sn: {
	    name: 'Shona',
	    caption: 'chiShona'
	  },
	  so: {
	    name: 'Somalia',
	    caption: 'Soomaaliga'
	  },
	  sq: {
	    name: 'Albanian',
	    caption: 'Shqip'
	  },
	  sr: {
	    name: 'Serbian',
	    caption: 'Српски'
	  },
	  st: {
	    name: 'Southern Sotho',
	    caption: 'Sesotho'
	  },
	  su: {
	    name: 'Sundanese',
	    caption: 'Basa Sunda'
	  },
	  sv: {
	    name: 'Swedish',
	    caption: 'Svenska'
	  },
	  sw: {
	    name: 'Swahili',
	    caption: 'Kiswahili'
	  },
	  ta: {
	    name: 'Tamil',
	    caption: 'தமிழ்'
	  },
	  te: {
	    name: 'Telugu',
	    caption: 'తెలుగు'
	  },
	  tg: {
	    name: 'Tajik',
	    caption: 'Тоҷикӣ'
	  },
	  th: {
	    name: 'Thai',
	    caption: 'ไทย / Phasa Thai'
	  },
	  tk: {
	    name: 'Turkmen',
	    caption: 'Туркмен / تركمن'
	  },
	  tl: {
	    name: 'Tagalog',
	    caption: 'Tagalog / ᜆᜄᜎᜓᜄ᜔'
	  },
	  tr: {
	    name: 'Turkish',
	    caption: 'Türkçe'
	  },
	  tt: {
	    name: 'Tatar',
	    caption: 'Tatarça'
	  },
	  ug: {
	    name: 'Uyghur',
	    caption: 'Uyƣurqə / ئۇيغۇرچە'
	  },
	  uk: {
	    name: 'Ukrainian',
	    caption: 'Українська'
	  },
	  ur: {
	    name: 'Urdu',
	    caption: 'اردو'
	  },
	  uz: {
	    name: 'Uzbek',
	    caption: 'Ўзбек'
	  },
	  vi: {
	    name: 'Vietnamese',
	    caption: 'Việtnam'
	  },
	  xh: {
	    name: 'Xhosa',
	    caption: 'isiXhosa'
	  },
	  yi: {
	    name: 'Yiddish',
	    caption: 'ייִדיש'
	  },
	  yo: {
	    name: 'Yoruba',
	    caption: 'Yorùbá'
	  },
	  'zh-CN': {
	    name: 'Chinese (Simplified)',
	    caption: '中文（简体）'
	  },
	  'zh-TW': {
	    name: 'Chinese (Traditional)',
	    caption: '中文（繁体）'
	  },
	  zu: {
	    name: 'Zulu',
	    caption: 'isiZulu'
	  }
	};

	/* eslint-disable no-sequences */
	function getSunshineInstance() {
	  return window[MessengerNamespace];
	}
	function sunshineLoader (f) {
	  const o = window;
	  const i = document;
	  const c = MessengerVersion;
	  const s = MessengerNamespace;
	  let p;
	  let a;
	  let u;
	  const h = [];
	  const l = [];

	  function e() {
	    const t = 'You must provide a supported major version.';

	    try {
	      if (!c) ;
	      let e;
	      const n = f;
	      const r = 'fivn';

	      if ((e = typeof this.response === 'string' ? JSON.parse(this.response) : this.response).url) {
	        const o = i.getElementsByTagName('script')[0];
	        const s = i.createElement('script');
	        s.async = !0;
	        const p = c.match(/([0-9]+)\.?([0-9]+)?\.?([0-9]+)?/);
	        const a = p && p[1];
	        if (p && p[3]) s.src = n + r + '.' + c + '.min.js';else {
	          if (!(a >= 9 && e['v' + a])) throw new Error(t);
	          s.src = e['v' + a];
	        }
	        o.parentNode.insertBefore(s, o);
	      }
	    } catch (e) {
	      e.message === t && console.error(e);
	    }
	  }

	  o[s] = {
	    init: function () {
	      p = arguments;
	      const t = {
	        then: function (e) {
	          return l.push({
	            type: 't',
	            next: e
	          }), t;
	        },
	        catch: function (e) {
	          return l.push({
	            type: 'c',
	            next: e
	          }), t;
	        }
	      };
	      return t;
	    },
	    on: function () {
	      h.push(arguments);
	    },
	    render: function () {
	      a = arguments;
	    },
	    destroy: function () {
	      u = arguments;
	    }
	  };

	  o.__onWebMessengerHostReady__ = function (e) {
	    if (delete o.__onWebMessengerHostReady__, o[s] = e, p) {
	      for (let t = e.init.apply(e, p), n = 0; n < l.length; n++) {
	        const r = l[n];
	        t = r.type === 't' ? t.then(r.next) : t.catch(r.next);
	      }
	    }

	    a && e.render.apply(e, a);
	    u && e.destroy.apply(e, u);

	    for (let n = 0; n < h.length; n++) e.on.apply(e, h[n]);
	  };

	  const t = new XMLHttpRequest();
	  t.addEventListener('load', e);
	  t.open('GET', f + 'loader.json', !0);
	  t.responseType = 'json';
	  t.send();
	} // (window, document, 'FIVN', '2', CdnUrl)

	function mitt (n) {
	  return {
	    all: n = n || new Map(),
	    on: function (t, e) {
	      var i = n.get(t);
	      i ? i.push(e) : n.set(t, [e]);
	    },
	    off: function (t, e) {
	      var i = n.get(t);
	      i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
	    },
	    emit: function (t, e) {
	      var i = n.get(t);
	      i && i.slice().map(function (n) {
	        n(e);
	      }), (i = n.get("*")) && i.slice().map(function (n) {
	        n(t, e);
	      });
	    }
	  };
	}

	const Events = {
	  MessengerReady: 'messenge:ready',
	  ProactiveChatReady: 'proactive:ready',
	  Ready: 'all:ready',
	  Destroy: 'all:destroy',
	  Opened: 'widget:opened',
	  Closed: 'widget:closed',
	  PopOut: 'widget:popOut',
	  Inited: 'ngchat:initialised',
	  ChatEvent: 'messenger:chat-event',
	  ChatSystemConversationCreated: 'conversationCreated',
	  ChatSystemParticipantAccepted: 'participantAccepted',
	  ChatSystemParticipantJoined: 'participantJoined',
	  ChatSystemParticipantLeft: 'participantLeft',
	  ChatSystemTransferredToParticipant: 'transferredToParticipant',
	  ChatSystemTransferredToGroup: 'transferredToGroup',
	  ChatSystemConversationTerminated: 'conversationTerminated',
	  ChatSystemTerminationRequested: 'terminationRequested',
	  ChatCaptureShown: 'messenger:capture',
	  ChatCaptureSubmitted: 'messenger:submitted',
	  ChatMessageSent: 'messenger:sent',
	  ChatMessageReceived: 'messenger:received',
	  ChatAdjustHeader: 'messenger:adjust-header',
	  LangChanged: 'language:changed',
	  LangSelectionCancelled: 'language:selectionCancelled',
	  LangHide: 'language:hide',
	  LangShow: 'language:show'
	};
	const emitter = mitt();

	class LanguageWidgetWrapper {
	  constructor() {
	    this.instance = null;
	    emitter.on(Events.Destroy, () => {
	      if (this.instance) {
	        this.instance.hideWidget();
	        delete this.instance;
	      }
	    });
	  }

	  init() {
	    // Support some limited A/B testing temporarily by showing older widget style only on 'button' mode
	    const isButtonMode = getState('messenger').displayStyle === 'button';

	    if (isButtonMode) {
	      this.load().then(() => {
	        this.configure();
	        emitter.on(Events.MessengerReady, () => {
	          this.instance.render();
	        });
	      });
	    }
	  }

	  load() {
	    return new Promise((resolve, reject) => {
	      const script = document.createElement('script');
	      const url = languageWidget(getState('cdn')) + 'widget.js';
	      document.body.appendChild(script);
	      debug('loading language widget from:', url);
	      script.src = url;
	      script.addEventListener('load', () => {
	        debug('language: script loaded');
	        resolve();
	      });
	      debug('language: script appended');
	    });
	  }

	  configure() {
	    debug('language: configuring...');
	    const options = getState('languages');
	    const cdn = getState('cdn');
	    const setLang = mutate('lang');
	    const setInitialLanguageSelection = mutate('initialLanguageSelection'); // eslint-disable-next-line no-undef

	    this.instance = new F9.Chat.LanguageSelection(Object.assign({}, options, {
	      cdn
	    }));
	    setLang(this.instance.defaultLang);
	    this.instance.emitter.on('select-language', lang => {
	      debug('language: changed', lang);
	      setLang(lang);
	      setInitialLanguageSelection(false);
	      emitter.emit(Events.LangChanged, lang);
	    });
	    emitter.on(Events.LangHide, () => {
	      this.instance.hideWidget();
	    });
	    emitter.on(Events.LangShow, () => {
	      this.instance.openWidget();
	    });
	    debug('language: configuration complete');
	  }

	  getNavigatorLanguage() {
	    const lang = window.navigator.language;
	    return lang.split('-').shift();
	  }

	  getDefaultLang() {
	    var _langArray$;

	    const options = getState('languages');
	    const langArray = options !== null && options !== void 0 && options.languages ? Object.values(options.languages) : [];
	    const configuredDefault = langArray.filter(value => value.default);

	    if (langArray.find(value => this.getNavigatorLanguage() === value.code)) {
	      return this.getNavigatorLanguage();
	    } else if (configuredDefault !== null && configuredDefault !== void 0 && configuredDefault.length) {
	      var _configuredDefault$po;

	      return (_configuredDefault$po = configuredDefault.pop()) === null || _configuredDefault$po === void 0 ? void 0 : _configuredDefault$po.code;
	    }

	    return (_langArray$ = langArray[0]) === null || _langArray$ === void 0 ? void 0 : _langArray$.code;
	  }

	  hasDisclaimer(code) {
	    const lang = getState('languages').languages.find(l => l.code === code);
	    return lang && lang.disclaimer;
	  }

	  getDisclaimer(code) {
	    const lang = getState('languages').languages.find(l => l.code === code);
	    return lang.disclaimer;
	  }

	}

	var language = new LanguageWidgetWrapper();

	const isHiddenMessage = message => {
	  return message.metadata && message.metadata.f9_transform === TRANSFORMS.HIDE;
	};
	const isSystemEventMessage = message => {
	  return message.metadata && message.metadata.f9_i18n && ChatSystemEvents.indexOf(message.metadata.f9_i18n) !== -1;
	};
	const isBusinessRole = message => {
	  return message.role === 'business';
	};
	const isUserRole = message => {
	  return message.role === 'user';
	};
	const isFormCompleted = message => {
	  return message.type === 'formResponse';
	};
	const isCaptureForm = message => {
	  return message.type === 'form' && message.metadata && message.metadata.f9_type === 'providerCaptureForm';
	};
	const isRequestTranscript = message => {
	  var _message$actions, _message$actions$, _message$actions$$ico;

	  return message === null || message === void 0 ? void 0 : (_message$actions = message.actions) === null || _message$actions === void 0 ? void 0 : (_message$actions$ = _message$actions[0]) === null || _message$actions$ === void 0 ? void 0 : (_message$actions$$ico = _message$actions$.iconUrl) === null || _message$actions$$ico === void 0 ? void 0 : _message$actions$$ico.includes('REQUEST_TRANSCRIPT_IMAGE_URL_YES');
	};
	const getL10nOptions = property => {
	  var _languageWidget$getDe;

	  const l10n = getState('l10n');
	  const lang = getState('lang');
	  const l10nLang = (l10n === null || l10n === void 0 ? void 0 : l10n[lang]) ?? (l10n === null || l10n === void 0 ? void 0 : l10n[language.getDefaultLang()]);
	  return (l10nLang === null || l10nLang === void 0 ? void 0 : l10nLang[property]) ?? ((_languageWidget$getDe = language.getDefaultLang()) === null || _languageWidget$getDe === void 0 ? void 0 : _languageWidget$getDe[property]);
	};
	const getWebMessengerOptions = () => {
	  var _getL10nOptions;

	  const currentLang = () => {
	    var _navigator, _navigator$language;

	    const languages = getState('languages');
	    const selectedLang = getState('lang');
	    const initial = getState('initialLanguageSelection');
	    const browserLocale = (_navigator = navigator) === null || _navigator === void 0 ? void 0 : (_navigator$language = _navigator.language) === null || _navigator$language === void 0 ? void 0 : _navigator$language.split('-')[0];

	    if (languages !== null && languages !== void 0 && languages.enabled && languages !== null && languages !== void 0 && languages.defaultToBrowserLocale && initial) {
	      var _languages$languages;

	      const langCodes = languages === null || languages === void 0 ? void 0 : (_languages$languages = languages.languages) === null || _languages$languages === void 0 ? void 0 : _languages$languages.map(language => language.code);

	      if ((langCodes === null || langCodes === void 0 ? void 0 : langCodes.indexOf(browserLocale)) !== -1) {
	        return browserLocale;
	      }
	    }

	    return selectedLang;
	  };

	  const lang = currentLang();
	  const customText = ((_getL10nOptions = getL10nOptions('messenger')) === null || _getL10nOptions === void 0 ? void 0 : _getL10nOptions.customText) ?? {};
	  return Object.assign({}, getState('messenger'), {
	    locale: lang,
	    canUserSeeConversationList: false,
	    soundNotificationEnabled: false,
	    transcriptPrintingEnabled: false,
	    customText
	  });
	};

	const delegates = function () {
	  return {
	    beforeDisplay(message, data) {
	      if (message.metadata && message.metadata.f9_transform) {
	        const transform = message.metadata.f9_transform;

	        if (transform === TRANSFORMS.HIDE) {
	          return false;
	        } else if (transform === TRANSFORMS.I18N || transform === TRANSFORMS.I18NF) {
	          const bundle = message.metadata.f9_i18n;
	          const systemMessages = getL10nOptions('systemMessages');

	          if (systemMessages && lodash_has(systemMessages, bundle)) {
	            const bundleString = systemMessages[bundle];
	            const substitutions = message.metadata.f9_i18n_substitutions ? JSON.parse(message.metadata.f9_i18n_substitutions) : false;
	            const text = substitutions ? bundleString.replace(/{(.+)}/g, (match, key) => substitutions[key]) : bundleString;
	            message.text = text;
	          } else {
	            return false;
	          }
	        }
	      }

	      return message;
	    }

	  };
	};

	class AudioPlayer {
	  constructor() {
	    this.sound = new Audio(webMessenger(getState('cdn')) + '6bbb422bbaa252a83fa431edd08804c8.mp3');
	  }

	  play() {
	    this.sound.play();
	  }

	}

	const createStyledComponent = (tag, style, children) => `<${tag} style="${style}">${children.join('')}</${tag}>`;

	const container$1 = children => createStyledComponent('div', `
    display: flex;  
    flex-flow: column nowrap;
    display: -webkit-box;
    display: -ms-flexbox;
    -webkit-box-orient: vertical;  
    -webkit-box-direction: normal;  
    -ms-flex-flow: column nowrap; 
    min-width: 400px;
    `, children);
	const conversationCloseRow = (...children) => createStyledComponent('div', `
    display: grid;
    max-width: 800px;
    max-height: 200px;
    padding-top: 6px;
    background-color: #f4f6f8;
    border-bottom: 1px solid rgba(71, 69, 123, .9);
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr;
    grid-template-areas:
    'closeText time';

    /* for IE */
    display: -ms-grid;
    -ms-grid-columns: 2fr 1fr;
    -ms-grid-rows: 1fr;
    `, children);
	const userRow = (...children) => createStyledComponent('div', `
    display: grid;
    max-width: 800px;
    max-height: 200px;
    padding: 6px;
    border-bottom: 1px solid rgba(71, 69, 123, .9);
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
    'name time'
    'text text';

    /* for IE */
    display: -ms-grid;
    -ms-grid-columns: 2fr 1fr;
    -ms-grid-rows: 1fr 1fr;
    `, children);
	const agentRow = (...children) => createStyledComponent('div', `
    display: grid;
    max-width: 800px;
    max-height: 200px;
    padding: 6px;
    background-color: #f4f6f8;
    border-bottom: 1px solid rgba(71, 69, 123, .9);
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
    'name time'
    'text text';

    /* for IE */
    display: -ms-grid;
    -ms-grid-columns: 2fr 1fr;
    -ms-grid-rows: 1fr 1fr;
    `, children);
	const userName = (...children) => createStyledComponent('div', `
    grid-area: name;
    padding: 6px;
    font-weight: bold;

    /* for IE */
    -ms-grid-row: 1;
    -ms-grid-column: 1;
    `, children);
	const agentName = (...children) => createStyledComponent('div', `
    grid-area: name;
    padding: 6px;
    font-weight: bold;

    /* for IE */
    -ms-grid-row: 1;
    -ms-grid-column: 1;
    `, children);
	const closeText = (...children) => createStyledComponent('div', `
    grid-area: closeText;
    padding: 5px;

    /* for IE */
    -ms-grid-row: 1;
    -ms-grid-column: 1;
    `, children);
	const text = (...children) => createStyledComponent('div', `
    grid-area: text;
    padding: 5px;

    /* for IE */
    -ms-grid-row: 2;
    -ms-grid-column: 1;
    -ms-grid-column-span: 2;
    `, children);
	const time = (...children) => createStyledComponent('div', `
    grid-area: time;
    padding: 5px;

    /* for IE */
    -ms-grid-row: 1;
    -ms-grid-column: 2;
    `, children);

	const agentNameComponent = content => content ? agentName(`<span>${content}</span>`) : undefined;
	const userNameComponent = content => content ? userName(`<span>${content}</span>`) : undefined;
	const textComponent = content => content ? text(`<span>${content}</span>`) : undefined;
	const closeTextComponent = content => content ? closeText(`<span>${content}</span>`) : undefined;
	const timeComponent = content => content ? time(`<span>${new Date(content * 1000).toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
})}</span>`) : undefined;

	const getTranscriptHtml = conversation => {
	  const styledMessages = conversation.messages.filter(message => !isHiddenMessage(message) && !isSystemEventMessage(message) && !isFormCompleted(message) && !isCaptureForm(message) && (isBusinessRole(message) || isUserRole(message))).map(message => isBusinessRole(message) ? agentRow(textComponent(message.text), timeComponent(message.received), agentNameComponent(message.displayName ?? 'Agent')) : userRow(textComponent(message.text), timeComponent(message.received), userNameComponent(message.displayName ?? 'User')));
	  const terminationMessage = conversation.messages.find(message => {
	    var _message$metadata;

	    return (message === null || message === void 0 ? void 0 : (_message$metadata = message.metadata) === null || _message$metadata === void 0 ? void 0 : _message$metadata.f9_type) === 'chatTerminated';
	  });
	  const {
	    customText
	  } = getWebMessengerOptions();
	  return container$1(terminationMessage ? styledMessages.concat(conversationCloseRow(closeTextComponent(`${(customText === null || customText === void 0 ? void 0 : customText.conversationClosedForTranscript) ?? 'Conversation closed'}`), timeComponent(terminationMessage.received))) : styledMessages);
	};

	const getHtml = conversation => {
	  let html = '<!DOCTYPE HTML>';
	  html += '<html>';
	  html += '<head></head>';
	  html += '<body>';
	  html += `${getTranscriptHtml(conversation)}`;
	  html += '<script>window.print();window.close()</script>';
	  html += '</body>';
	  return html;
	};

	const printTranscript = () => {
	  const sunshine = getSunshineInstance();

	  const getCurrentConversation = function () {
	    return new Promise(resolve => {
	      const conversations = sunshine.getConversations();

	      if (conversations.length) {
	        debug('printTranscript: getCurrentConversation conversation found, loading it', conversations);
	        sunshine.loadConversation(conversations[0].id).then(() => {
	          debug('printTranscript: getCurrentConversation conversation loaded', conversations[0]);
	          resolve(conversations[0]);
	        });
	      } else {
	        debug('printTranscript: No conversations found.');
	      }
	    });
	  };

	  getCurrentConversation().then(conversation => {
	    const w = window.open();
	    w.document.write(getHtml(conversation));
	  }).catch(error => {
	    debug('buildTranscript failed to get the current conversation', error);
	  });
	};

	const getPreCaptureForm = () => {
	  var _document$querySelect, _document$querySelect2;

	  const forms = (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : (_document$querySelect2 = _document$querySelect.contentDocument) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelectorAll('#mount > div > div> div > #conversation > .messages-container > .messages > .row-form > .msg-wrapper  > .msg-form > .message-form > form');
	  return (forms === null || forms === void 0 ? void 0 : forms.length) > 0 ? forms[forms.length - 1] : undefined;
	};

	const adjustDropdowns = form => {
	  var _dropdown$parentEleme;

	  const dropdown = form === null || form === void 0 ? void 0 : form.querySelector('#campaign');
	  const dropdownIcon = form === null || form === void 0 ? void 0 : form.querySelector('.select-dropdown-icon--select');
	  const cloned = dropdown === null || dropdown === void 0 ? void 0 : dropdown.cloneNode(true);

	  if (cloned) {
	    cloned.id = 'cloned-campaign';
	  }

	  dropdown === null || dropdown === void 0 ? void 0 : (_dropdown$parentEleme = dropdown.parentElement) === null || _dropdown$parentEleme === void 0 ? void 0 : _dropdown$parentEleme.insertBefore(cloned, dropdown.nextSibling);
	  dropdown === null || dropdown === void 0 ? void 0 : dropdown.setAttribute('style', 'display: none');
	  dropdownIcon === null || dropdownIcon === void 0 ? void 0 : dropdownIcon.setAttribute('style', 'display: none');
	};

	const getFieldButtons = form => {
	  return form === null || form === void 0 ? void 0 : form.querySelectorAll('.form-field-btn');
	};

	const getFieldInputs = form => {
	  return form === null || form === void 0 ? void 0 : form.querySelectorAll('input');
	};

	const getFormSubmitButton = form => {
	  return form === null || form === void 0 ? void 0 : form.querySelector('#five9-precapture-form-submit');
	};

	const createFormSubmitButton = () => {
	  const {
	    customText
	  } = getWebMessengerOptions();
	  const submitButton = `<button class="btn-primary" id="five9-precapture-form-submit" type="Button">${(customText === null || customText === void 0 ? void 0 : customText.startConversation) ?? 'Start'}</button>`;
	  const submitElement = document.createElement('div');
	  submitElement.innerHTML = submitButton;
	  submitElement.onclick = onSubmitForm;
	  submitElement.setAttribute('style', 'display: -webkit-box; display: -ms-flexbox; display: flex; -webkit-box-pack: center; -ms-flex-pack: center; justify-content: center');
	  return submitElement;
	};
	const disableFormSubmitButton = () => {
	  if (!formNotSubmitted()) {
	    const form = getPreCaptureForm();
	    const submitButton = getFormSubmitButton(form);
	    submitButton === null || submitButton === void 0 ? void 0 : submitButton.setAttribute('style', 'background-color: rgb(244, 246, 248); color: rgba(33, 43, 53, 0.65); cursor: not-allowed; box-shadow: none; border: 1px solid rgba(71,69,123,.12);');
	  }
	};
	const enableConversationScrollBar = () => {
	  if (!formNotSubmitted()) {
	    var _document$querySelect3, _document$querySelect4, _document$querySelect5;

	    (_document$querySelect3 = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect3 === void 0 ? void 0 : (_document$querySelect4 = _document$querySelect3.contentDocument) === null || _document$querySelect4 === void 0 ? void 0 : (_document$querySelect5 = _document$querySelect4.querySelector('#mount > div > div> div > #conversation')) === null || _document$querySelect5 === void 0 ? void 0 : _document$querySelect5.setAttribute('style', undefined);
	  }
	};

	const setDropdownValue = form => {
	  const dropdown = form === null || form === void 0 ? void 0 : form.querySelector('#campaign');
	  const cloned = form === null || form === void 0 ? void 0 : form.querySelector('#cloned-campaign');
	  cloned === null || cloned === void 0 ? void 0 : cloned.setAttribute('style', 'display: none');

	  if (dropdown) {
	    dropdown.value = cloned === null || cloned === void 0 ? void 0 : cloned.value;
	    const event = new Event('change', {
	      bubbles: true
	    });
	    dropdown.dispatchEvent(event);
	  }

	  dropdown === null || dropdown === void 0 ? void 0 : dropdown.setAttribute('style', undefined);
	};

	const onSubmitForm = () => {
	  const form = getPreCaptureForm();
	  setDropdownValue(form);
	  const fieldButtons = getFieldButtons(form);
	  fieldButtons === null || fieldButtons === void 0 ? void 0 : fieldButtons.forEach(button => {
	    button.click();
	  });
	};
	const formNotSubmitted = () => {
	  const form = getPreCaptureForm();
	  const fieldButtons = getFieldButtons(form);
	  return (fieldButtons === null || fieldButtons === void 0 ? void 0 : fieldButtons.length) > 0;
	};
	const adjustForm = () => {
	  const form = getPreCaptureForm();

	  if (!form) {
	    return;
	  }

	  const submitButton = getFormSubmitButton(form);

	  if (!submitButton) {
	    var _document$querySelect6, _document$querySelect7;

	    adjustDropdowns(form);
	    const fieldButtons = getFieldButtons(form);
	    fieldButtons === null || fieldButtons === void 0 ? void 0 : fieldButtons.forEach(button => {
	      button.setAttribute('hidden', true);
	    });
	    const fieldInputs = getFieldInputs(form);
	    fieldInputs === null || fieldInputs === void 0 ? void 0 : fieldInputs.forEach(fieldInput => {
	      fieldInput.setAttribute('style', 'border-radius: 20px; resize: none; padding-right: 12px;');
	    });
	    const submitElement = createFormSubmitButton();
	    form === null || form === void 0 ? void 0 : form.appendChild(submitElement); // set form vertical scroll bar

	    form === null || form === void 0 ? void 0 : form.setAttribute('style', 'max-height: 55vh; overflow-y: auto; overflow-x: hidden'); // disable conversation scroll bar

	    const conversation = (_document$querySelect6 = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect6 === void 0 ? void 0 : (_document$querySelect7 = _document$querySelect6.contentDocument) === null || _document$querySelect7 === void 0 ? void 0 : _document$querySelect7.querySelector('#mount > div > div> div > #conversation');
	    conversation === null || conversation === void 0 ? void 0 : conversation.setAttribute('style', 'overflow-y: hidden; margin-right: 12px'); // submit form for input's Enter button

	    const inputs = getFieldInputs(form);
	    inputs === null || inputs === void 0 ? void 0 : inputs.forEach(input => {
	      input.addEventListener('keypress', function (event) {
	        if (event.key === 'Enter') {
	          event.preventDefault();
	          submitElement.click();
	        }
	      });
	    });
	  }
	};

	const getHeader = () => {
	  var _document$querySelect, _document$querySelect2;

	  return (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : (_document$querySelect2 = _document$querySelect.contentDocument) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelector('#mount > div > div> div > #header');
	};

	const getCloseButton = () => {
	  var _getHeader;

	  return (_getHeader = getHeader()) === null || _getHeader === void 0 ? void 0 : _getHeader.querySelector('#close-conversation-button');
	};

	const showCloseButton = () => {
	  var _getCloseButton;

	  return (_getCloseButton = getCloseButton()) === null || _getCloseButton === void 0 ? void 0 : _getCloseButton.setAttribute('style', 'display:inline');
	};
	const hideCloseButton = () => {
	  var _getCloseButton2;

	  return (_getCloseButton2 = getCloseButton()) === null || _getCloseButton2 === void 0 ? void 0 : _getCloseButton2.setAttribute('style', 'display: none');
	};
	const removeCloseButton = () => {
	  const header = getHeader();
	  const closeButton = getCloseButton();

	  if (closeButton) {
	    header === null || header === void 0 ? void 0 : header.removeChild(closeButton);
	  }
	};
	const createCloseButtonElement = () => {
	  const button = '<svg class="close-icon" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="icons" stroke="none" fill="none"><g id="icon/close" fill="#FFFFFF"><path d="M6.707 5.293L12 10.585l5.293-5.292a1 1 0 011.414 1.414L13.415 12l5.292 5.293a1 1 0 01-1.414 1.414L12 13.415l-5.293 5.292a1 1 0 11-1.414-1.414L10.585 12 5.293 6.707a1 1 0 011.414-1.414z" id="icon"></path></g></g></svg>';
	  const closeElement = document.createElement('div');
	  closeElement.setAttribute('id', 'close-conversation-button');
	  closeElement.classList.add('close-handle');
	  closeElement.classList.add('close-hidden');
	  closeElement.classList.add('brand-dark');
	  closeElement.innerHTML = button;
	  return closeElement;
	};

	const changeImgYes = () => {
	  var _document$querySelect, _document$querySelect2;

	  const image = (_document$querySelect = document.querySelector('#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : (_document$querySelect2 = _document$querySelect.contentDocument) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelector('img[src="REQUEST_TRANSCRIPT_IMAGE_URL_YES"]');
	  image === null || image === void 0 ? void 0 : image.setAttribute('src', webMessengerWrapper(getState('cdn')) + 'assets/images/yes.svg');
	};

	const changeImgNo = () => {
	  var _document$querySelect3, _document$querySelect4;

	  const image = (_document$querySelect3 = document.querySelector('#web-messenger-container')) === null || _document$querySelect3 === void 0 ? void 0 : (_document$querySelect4 = _document$querySelect3.contentDocument) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.querySelector('img[src="REQUEST_TRANSCRIPT_IMAGE_URL_NO"]');
	  image === null || image === void 0 ? void 0 : image.setAttribute('src', webMessengerWrapper(getState('cdn')) + 'assets/images/no.svg');
	};

	const changeRequestTranscriptImages = () => {
	  changeImgYes();
	  changeImgNo();
	};

	const sendRichContentButtonMessage = (text, payload) => {
	  var _conversations$;

	  const sunshine = getSunshineInstance();
	  const conversations = sunshine === null || sunshine === void 0 ? void 0 : sunshine.getConversations();
	  const conversationId = conversations === null || conversations === void 0 ? void 0 : (_conversations$ = conversations[0]) === null || _conversations$ === void 0 ? void 0 : _conversations$.id;

	  if (conversationId) {
	    sunshine === null || sunshine === void 0 ? void 0 : sunshine.sendMessage({
	      type: 'text',
	      text: text,
	      payload: payload
	    }, conversationId);
	  }
	};

	const onReplyButtonClick = event => {
	  var _event$target, _event$target2;

	  const spanElement = event === null || event === void 0 ? void 0 : (_event$target = event.target) === null || _event$target === void 0 ? void 0 : _event$target.querySelector('span');
	  const button = spanElement ?? (event === null || event === void 0 ? void 0 : (_event$target2 = event.target) === null || _event$target2 === void 0 ? void 0 : _event$target2.parentElement);
	  const text = button === null || button === void 0 ? void 0 : button.querySelector('.fn-richcontent-button-text');
	  const payload = button === null || button === void 0 ? void 0 : button.querySelector('.fn-richcontent-button-payload');
	  sendRichContentButtonMessage(text === null || text === void 0 ? void 0 : text.textContent, payload === null || payload === void 0 ? void 0 : payload.textContent);
	};
	const displayClonedRichcontentElement = () => {
	  const replyContainerHidden = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#replyContainerHidden');
	  replyContainerHidden === null || replyContainerHidden === void 0 ? void 0 : replyContainerHidden.removeAttribute('hidden');
	};
	const removeClonedRichcontentElement = () => {
	  var _replyContainerHidden;

	  const replyContainerHidden = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#replyContainerHidden');
	  replyContainerHidden === null || replyContainerHidden === void 0 ? void 0 : (_replyContainerHidden = replyContainerHidden.parentElement) === null || _replyContainerHidden === void 0 ? void 0 : _replyContainerHidden.removeChild(replyContainerHidden);
	};
	const enableInput = () => {
	  const input = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#footer .input-container textarea');
	  input === null || input === void 0 ? void 0 : input.removeAttribute('disabled');
	};
	const buildButton = (button, actions) => {
	  var _document, _element$classList, _document2, _textElement$classLis, _document3, _payloadElement$class;

	  button === null || button === void 0 ? void 0 : button.addEventListener('keypress', function (event) {
	    if (event.key === 'Enter') {
	      event.preventDefault();
	      onReplyButtonClick(event);
	    }
	  });
	  button === null || button === void 0 ? void 0 : button.addEventListener('click', function (event) {
	    event.preventDefault();
	    onReplyButtonClick(event);
	  });
	  const spanElement = button === null || button === void 0 ? void 0 : button.querySelector('span');
	  const textContent = spanElement === null || spanElement === void 0 ? void 0 : spanElement.textContent;
	  const action = actions === null || actions === void 0 ? void 0 : actions.find(action => textContent === null || textContent === void 0 ? void 0 : textContent.includes(action === null || action === void 0 ? void 0 : action.text));
	  const element = (_document = document) === null || _document === void 0 ? void 0 : _document.createElement('div');
	  element === null || element === void 0 ? void 0 : element.setAttribute('hidden', 'true');
	  element === null || element === void 0 ? void 0 : (_element$classList = element.classList) === null || _element$classList === void 0 ? void 0 : _element$classList.add('fn-richcontent-button-hidden');
	  const textElement = (_document2 = document) === null || _document2 === void 0 ? void 0 : _document2.createElement('span');
	  textElement === null || textElement === void 0 ? void 0 : (_textElement$classLis = textElement.classList) === null || _textElement$classLis === void 0 ? void 0 : _textElement$classLis.add('fn-richcontent-button-text');

	  if (action !== null && action !== void 0 && action.text) {
	    textElement.textContent = action === null || action === void 0 ? void 0 : action.text;
	  }

	  element === null || element === void 0 ? void 0 : element.appendChild(textElement);
	  const payloadElement = (_document3 = document) === null || _document3 === void 0 ? void 0 : _document3.createElement('span');
	  payloadElement === null || payloadElement === void 0 ? void 0 : (_payloadElement$class = payloadElement.classList) === null || _payloadElement$class === void 0 ? void 0 : _payloadElement$class.add('fn-richcontent-button-payload');

	  if (action !== null && action !== void 0 && action.payload) {
	    payloadElement.textContent = action === null || action === void 0 ? void 0 : action.payload;
	  }

	  element === null || element === void 0 ? void 0 : element.appendChild(payloadElement);
	  button === null || button === void 0 ? void 0 : button.appendChild(element);
	};
	const cloneAndAppend = (messages, replyContainer, actions) => {
	  const hiddenElement = document.createElement('div');
	  hiddenElement.setAttribute('id', 'replyContainerHidden');
	  hiddenElement.setAttribute('hidden', 'true');
	  const clonedNode = replyContainer === null || replyContainer === void 0 ? void 0 : replyContainer.cloneNode(true);
	  const clonedButtons = clonedNode === null || clonedNode === void 0 ? void 0 : clonedNode.querySelectorAll('.btn-reply-action');
	  clonedButtons === null || clonedButtons === void 0 ? void 0 : clonedButtons.forEach(button => {
	    buildButton(button, actions);
	  });

	  if (clonedNode) {
	    hiddenElement === null || hiddenElement === void 0 ? void 0 : hiddenElement.appendChild(clonedNode);
	  }

	  messages === null || messages === void 0 ? void 0 : messages.appendChild(hiddenElement);
	};
	const appendClonedRichcontentElement = actions => {
	  const messages = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('.messages');
	  const replyContainer = messages === null || messages === void 0 ? void 0 : messages.querySelector('.reply-container');

	  if (replyContainer) {
	    cloneAndAppend(messages, replyContainer, actions);
	  }
	};

	let sound = false;

	const toggleSoundState = function () {
	  const messengerState = getState('messenger');
	  const oldSoundState = messengerState.soundNotificationEnabled ??= false;
	  const newSoundState = !oldSoundState;
	  messengerState.soundNotificationEnabled = newSoundState;
	  const setMessenger = mutate('messenger');
	  setMessenger(messengerState);
	};

	const triggerSoundIfEnabled = () => {
	  const soundEnabled = getState('messenger').soundNotificationEnabled;

	  if (soundEnabled && !sound) {
	    sound = new AudioPlayer();
	  }

	  if (soundEnabled && sound) {
	    sound.play();
	  }

	  debug('play sound if enabled', soundEnabled);
	};

	const onMessageReceived = message => {
	  var _message$actions, _message$actions$;

	  if (!isBusinessRole(message)) {
	    debug('message received, not business role');
	    return;
	  }

	  if (isCaptureForm(message)) {
	    debug('message received, is capture form');
	    adjustForm();
	    emitter.emit(Events.ChatCaptureShown, message.id);
	    triggerSoundIfEnabled(); // work around for sunshine issue

	    fixMenuItems();
	    hideCloseButton();
	    return;
	  }

	  if (isRequestTranscript(message)) {
	    changeRequestTranscriptImages();
	  }

	  if (isSystemEventMessage(message)) {
	    debug('message received, is system event');
	    emitter.emit(message.metadata.f9_i18n, message.id);
	    return;
	  }

	  if (!isHiddenMessage(message)) {
	    debug('message received, is regular message');
	    emitter.emit(Events.ChatMessageReceived, message.id);
	    triggerSoundIfEnabled();
	  } else {
	    debug('message received, is hidden message');
	  } // work around for web messenger richcontent disappear issue


	  if (message !== null && message !== void 0 && message.actions && (message === null || message === void 0 ? void 0 : (_message$actions = message.actions) === null || _message$actions === void 0 ? void 0 : (_message$actions$ = _message$actions[0]) === null || _message$actions$ === void 0 ? void 0 : _message$actions$.type) === 'reply') {
	    // before clone, remove the old clone
	    removeClonedRichcontentElement();
	    appendClonedRichcontentElement(message === null || message === void 0 ? void 0 : message.actions); // for preview
	    // disableInput()
	  } else {
	    displayClonedRichcontentElement();
	  }
	};

	const observeImageUploadElement = () => {
	  const imageUpload = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('label.image-upload');
	  const config = {
	    attributes: true,
	    childList: true
	  };
	  const observer = new MutationObserver(mutationCallback);
	  observer.observe(imageUpload, config);
	};
	const onPrint = () => {
	  var _document$querySelect, _document$querySelect2;

	  const closeIcon = (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : (_document$querySelect2 = _document$querySelect.contentDocument) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelector('label.image-upload');

	  if (closeIcon) {
	    closeIcon.click();
	  }

	  printTranscript();
	};

	const mutationCallback = () => {
	  const uploadContainer = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('div.upload-container');

	  if (uploadContainer) {
	    uploadContainer.style.maxHeight = '216px';
	    const uploadMenu = uploadContainer.querySelector('div.upload-menu'); // uploadMenu is not there, do nothing

	    if (!uploadMenu) {
	      return;
	    }

	    uploadMenu.style.maxHeight = '200px';
	    const soundOffElement = uploadMenu.querySelector('#sound-off');
	    const soundOnElement = uploadMenu.querySelector('#sound-on');
	    const printTranscriptElement = uploadMenu.querySelector('#print-transcript'); // One of the elements are already there, no need do it again

	    if (soundOffElement || soundOnElement || printTranscriptElement) {
	      return;
	    }

	    const {
	      customText
	    } = getWebMessengerOptions();
	    const images = webMessengerWrapper(getState('cdn')) + 'assets/images';
	    const soundOff = `<div id='sound-off' class="upload-icon"><img src="${images}/mute.png" width="24" height="24"></div>${(customText === null || customText === void 0 ? void 0 : customText.soundNotification) ?? 'Sound'}`;
	    const soundOn = `<div id='sound-on' class="upload-icon"><img src="${images}/volume.png" width="24" height="24"></div>${(customText === null || customText === void 0 ? void 0 : customText.soundNotification) ?? 'Sound'}`;
	    const printTranscriptButton = `<div id='print-transcript' class="upload-icon"><img src="${images}/printer.svg" width="24" height="24"></div>${(customText === null || customText === void 0 ? void 0 : customText.printTranscipt) ?? 'Print'}`;
	    const soundEle = document.createElement('div');
	    soundEle.classList.add('upload-menu-item');
	    soundEle.innerHTML = getState('messenger').soundNotificationEnabled ? soundOff : soundOn;
	    uploadMenu.appendChild(soundEle);

	    soundEle.onclick = () => {
	      toggleSoundState();
	      const closeIcon = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('label.image-upload');
	      closeIcon.click();
	    };

	    const transcriptPrintingEnabled = getState('messenger').transcriptPrintingEnabled;

	    if (transcriptPrintingEnabled) {
	      const printerElement = document.createElement('div');
	      printerElement.classList.add('upload-menu-item');
	      printerElement.innerHTML = printTranscriptButton;
	      printerElement.onclick = onPrint;
	      uploadMenu.appendChild(printerElement);
	    }
	  }
	};

	const closeMenu = () => {
	  var _document$querySelect3, _document$querySelect4;

	  const closeIcon = (_document$querySelect3 = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect3 === void 0 ? void 0 : (_document$querySelect4 = _document$querySelect3.contentDocument) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.querySelector('label.toggled'); // open menu

	  closeIcon === null || closeIcon === void 0 ? void 0 : closeIcon.click(); // close menu

	  closeIcon === null || closeIcon === void 0 ? void 0 : closeIcon.click();
	};

	const fixMenuItems = () => {
	  var _document$querySelect5, _document$querySelect6, _document$querySelect7, _document$querySelect8;

	  const container = (_document$querySelect5 = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect5 === void 0 ? void 0 : (_document$querySelect6 = _document$querySelect5.contentDocument) === null || _document$querySelect6 === void 0 ? void 0 : _document$querySelect6.querySelector('#mount > div > div> div > div > form > .upload-container');
	  const crossButton = (_document$querySelect7 = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect7 === void 0 ? void 0 : (_document$querySelect8 = _document$querySelect7.contentDocument) === null || _document$querySelect8 === void 0 ? void 0 : _document$querySelect8.querySelector('label.toggled'); // if one of them does not exist, close the other

	  if (container || !crossButton) {
	    container === null || container === void 0 ? void 0 : container.setAttribute('style', 'display: none');
	    crossButton === null || crossButton === void 0 ? void 0 : crossButton.click();
	  }
	};

	const onMessageSent = message => {
	  // work around for web messenger menu item bug
	  closeMenu(); // work around for web messenger menu item bug

	  fixMenuItems(); // work around for web messenger richcontent disappear issue

	  enableInput();
	  removeClonedRichcontentElement();

	  if (!isUserRole(message)) {
	    debug('message sent, not user role');
	    return;
	  }

	  if (isHiddenMessage(message)) {
	    debug('message sent, is hidden message');
	    return;
	  }

	  if (isFormCompleted(message)) {
	    observeImageUploadElement();
	    emitter.emit(Events.ChatAdjustHeader);
	    showCloseButton();
	    enableConversationScrollBar();
	    disableFormSubmitButton();
	  }

	  debug('message sent, is regular message');
	  emitter.emit(Events.ChatMessageSent, message.id);
	};

	var HandleChatEvents = (sunshine => {
	  sunshine.on('message:received', onMessageReceived);
	  sunshine.on('message:sent', onMessageSent);
	});

	const sendPreflight = function (conversationId) {
	  debug('messenger#sendPreflight', conversationId);
	  const messenger = getSunshineInstance();

	  if (!messenger || !messenger.sendMessage) {
	    debug('Messenger instance is missing sendMessage, preflight won\'t be sent', messenger);
	    throw new Error('Messenger instance not ready for preflight');
	  }

	  const lang = getState('lang');
	  const languages = getState('languages');
	  const captureFields = getL10nOptions('captureFields');
	  const prepopulatedFields = getState('prepopulatedFields');

	  if (languages.enabled) {
	    const UserLocale = prepopulatedFields.find(f => f.k === 'UserLocale');

	    if (!UserLocale) {
	      prepopulatedFields.push({
	        k: 'UserLocale',
	        v: lang
	      });
	    } else {
	      UserLocale.v = lang;
	    }

	    const TranslationSourceLanguageCode = prepopulatedFields.find(f => f.k === 'TranslationSourceLanguageCode');

	    if (!TranslationSourceLanguageCode) {
	      prepopulatedFields.push({
	        k: 'TranslationSourceLanguageCode',
	        v: lang
	      });
	    } else {
	      TranslationSourceLanguageCode.v = lang;
	    }
	  }

	  debug('Prepopulated fields configured', prepopulatedFields);
	  messenger.sendMessage({
	    type: 'text',
	    text: 'Messenger Pre-Flight...',
	    metadata: {
	      f9_type: 'messengerPreFlight',
	      f9_transform: 'hide',
	      f9_businessHours: getState('useBusinessHours'),
	      f9_fields: JSON.stringify(captureFields),
	      f9_prepopulated: JSON.stringify(prepopulatedFields)
	    }
	  }, conversationId);
	};

	var appleIphone = /iPhone/i;
	var appleIpod = /iPod/i;
	var appleTablet = /iPad/i;
	var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
	var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
	var androidTablet = /Android/i;
	var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
	var amazonTablet = /Silk/i;
	var windowsPhone = /Windows Phone/i;
	var windowsTablet = /\bWindows(?:.+)ARM\b/i;
	var otherBlackBerry = /BlackBerry/i;
	var otherBlackBerry10 = /BB10/i;
	var otherOpera = /Opera Mini/i;
	var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
	var otherFirefox = /Mobile(?:.+)Firefox\b/i;

	var isAppleTabletOnIos13 = function (navigator) {
	  return typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1 && typeof MSStream === 'undefined';
	};

	function createMatch(userAgent) {
	  return function (regex) {
	    return regex.test(userAgent);
	  };
	}

	function isMobile(param) {
	  var nav = {
	    userAgent: '',
	    platform: '',
	    maxTouchPoints: 0
	  };

	  if (!param && typeof navigator !== 'undefined') {
	    nav = {
	      userAgent: navigator.userAgent,
	      platform: navigator.platform,
	      maxTouchPoints: navigator.maxTouchPoints || 0
	    };
	  } else if (typeof param === 'string') {
	    nav.userAgent = param;
	  } else if (param && param.userAgent) {
	    nav = {
	      userAgent: param.userAgent,
	      platform: param.platform,
	      maxTouchPoints: param.maxTouchPoints || 0
	    };
	  }

	  var userAgent = nav.userAgent;
	  var tmp = userAgent.split('[FBAN');

	  if (typeof tmp[1] !== 'undefined') {
	    userAgent = tmp[0];
	  }

	  tmp = userAgent.split('Twitter');

	  if (typeof tmp[1] !== 'undefined') {
	    userAgent = tmp[0];
	  }

	  var match = createMatch(userAgent);
	  var result = {
	    apple: {
	      phone: match(appleIphone) && !match(windowsPhone),
	      ipod: match(appleIpod),
	      tablet: !match(appleIphone) && (match(appleTablet) || isAppleTabletOnIos13(nav)) && !match(windowsPhone),
	      universal: match(appleUniversal),
	      device: (match(appleIphone) || match(appleIpod) || match(appleTablet) || match(appleUniversal) || isAppleTabletOnIos13(nav)) && !match(windowsPhone)
	    },
	    amazon: {
	      phone: match(amazonPhone),
	      tablet: !match(amazonPhone) && match(amazonTablet),
	      device: match(amazonPhone) || match(amazonTablet)
	    },
	    android: {
	      phone: !match(windowsPhone) && match(amazonPhone) || !match(windowsPhone) && match(androidPhone),
	      tablet: !match(windowsPhone) && !match(amazonPhone) && !match(androidPhone) && (match(amazonTablet) || match(androidTablet)),
	      device: !match(windowsPhone) && (match(amazonPhone) || match(amazonTablet) || match(androidPhone) || match(androidTablet)) || match(/\bokhttp\b/i)
	    },
	    windows: {
	      phone: match(windowsPhone),
	      tablet: match(windowsTablet),
	      device: match(windowsPhone) || match(windowsTablet)
	    },
	    other: {
	      blackberry: match(otherBlackBerry),
	      blackberry10: match(otherBlackBerry10),
	      opera: match(otherOpera),
	      firefox: match(otherFirefox),
	      chrome: match(otherChrome),
	      device: match(otherBlackBerry) || match(otherBlackBerry10) || match(otherOpera) || match(otherFirefox) || match(otherChrome)
	    },
	    any: false,
	    phone: false,
	    tablet: false
	  };
	  result.any = result.apple.device || result.android.device || result.windows.device || result.other.device;
	  result.phone = result.apple.phone || result.android.phone || result.windows.phone;
	  result.tablet = result.apple.tablet || result.android.tablet || result.windows.tablet;
	  return result;
	}

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	/** Used as the `TypeError` message for "Functions" methods. */

	var FUNC_ERROR_TEXT = 'Expected a function';
	/** Used as references for various `Number` constants. */

	var INFINITY = 1 / 0,
	    MAX_INTEGER = 1.7976931348623157e+308,
	    NAN = 0 / 0;
	/** `Object#toString` result references. */

	var symbolTag = '[object Symbol]';
	/** Used to match leading and trailing whitespace. */

	var reTrim = /^\s+|\s+$/g;
	/** Used to detect bad signed hexadecimal string values. */

	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
	/** Used to detect binary string values. */

	var reIsBinary = /^0b[01]+$/i;
	/** Used to detect octal string values. */

	var reIsOctal = /^0o[0-7]+$/i;
	/** Built-in method references without a dependency on `root`. */

	var freeParseInt = parseInt;
	/** Used for built-in method references. */

	var objectProto = Object.prototype;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */

	var objectToString = objectProto.toString;
	/**
	 * Creates a function that invokes `func`, with the `this` binding and arguments
	 * of the created function, while it's called less than `n` times. Subsequent
	 * calls to the created function return the result of the last `func` invocation.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Function
	 * @param {number} n The number of calls at which `func` is no longer invoked.
	 * @param {Function} func The function to restrict.
	 * @returns {Function} Returns the new restricted function.
	 * @example
	 *
	 * jQuery(element).on('click', _.before(5, addContactToList));
	 * // => Allows adding up to 4 contacts to the list.
	 */

	function before(n, func) {
	  var result;

	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }

	  n = toInteger(n);
	  return function () {
	    if (--n > 0) {
	      result = func.apply(this, arguments);
	    }

	    if (n <= 1) {
	      func = undefined;
	    }

	    return result;
	  };
	}
	/**
	 * Creates a function that is restricted to invoking `func` once. Repeat calls
	 * to the function return the value of the first invocation. The `func` is
	 * invoked with the `this` binding and arguments of the created function.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to restrict.
	 * @returns {Function} Returns the new restricted function.
	 * @example
	 *
	 * var initialize = _.once(createApplication);
	 * initialize();
	 * initialize();
	 * // => `createApplication` is invoked once
	 */


	function once(func) {
	  return before(2, func);
	}
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */


	function isObject(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */


	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */


	function isSymbol(value) {
	  return typeof value == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
	}
	/**
	 * Converts `value` to a finite number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.12.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted number.
	 * @example
	 *
	 * _.toFinite(3.2);
	 * // => 3.2
	 *
	 * _.toFinite(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toFinite(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toFinite('3.2');
	 * // => 3.2
	 */


	function toFinite(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }

	  value = toNumber(value);

	  if (value === INFINITY || value === -INFINITY) {
	    var sign = value < 0 ? -1 : 1;
	    return sign * MAX_INTEGER;
	  }

	  return value === value ? value : 0;
	}
	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3.2);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3.2');
	 * // => 3
	 */


	function toInteger(value) {
	  var result = toFinite(value),
	      remainder = result % 1;
	  return result === result ? remainder ? result - remainder : result : 0;
	}
	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */


	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }

	  if (isSymbol(value)) {
	    return NAN;
	  }

	  if (isObject(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject(other) ? other + '' : other;
	  }

	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }

	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
	}

	var lodash_once = once;

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing. The function also has a property 'clear'
	 * that is a function which will clear the timer to prevent previously scheduled executions.
	 *
	 * @source underscore.js
	 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
	 * @param {Function} function to wrap
	 * @param {Number} timeout in ms (`100`)
	 * @param {Boolean} whether to execute at the beginning (`true`)
	 * @api public
	 */
	function debounce(func, wait, immediate = true) {
	  let timeout, args, context, timestamp, result;
	  if (wait == null) wait = 100;

	  function later() {
	    const last = Date.now() - timestamp;

	    if (last < wait && last >= 0) {
	      timeout = setTimeout(later, wait - last);
	    } else {
	      timeout = null;

	      if (!immediate) {
	        result = func.apply(context, args);
	        context = args = null;
	      }
	    }
	  }

	  const debounced = function () {
	    context = this;
	    args = arguments;
	    timestamp = Date.now();
	    const callNow = immediate && !timeout;
	    if (!timeout) timeout = setTimeout(later, wait);

	    if (callNow) {
	      result = func.apply(context, args);
	      context = args = null;
	    }

	    return result;
	  };

	  debounced.clear = function () {
	    if (timeout) {
	      clearTimeout(timeout);
	      timeout = null;
	    }
	  };

	  debounced.flush = function () {
	    if (timeout) {
	      result = func.apply(context, args);
	      context = args = null;
	      clearTimeout(timeout);
	      timeout = null;
	    }
	  };

	  return debounced;
	}

	const container = (...children) => createStyledComponent('div', `
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 1;
    visibility: visible;
    transform: scale(1.0);
    transition: visibility 0s linear 0s, opacity 0.25s 0s, transform 0.25s;
    `, children);
	const dialog$1 = (...children) => createStyledComponent('div', `
    display: grid;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem 1.5rem;
    box-shadow: 0 12px 24px 0 rgb(71 69 123 / 16%), 0 4px 8px 0 rgb(71 69 123 / 12%); 
    background-color: #f4f6f8;
    border: 1px solid rgba(71,69,123,.12);
    border-radius: 20px;
    overflow: visible;
    width: 70%;
    grid-template-columns: 2fr 1fr 2fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
        'body body body'
        'no . yes';

    /* for IE */
    display: -ms-grid;
    -ms-grid-columns: 2fr 1fr 2fr;
    -ms-grid-rows: 1fr 1fr;
    `, children);
	const body = (...children) => createStyledComponent('div', `
    grid-area: body; 
    padding: 10px; 
    color: #212b36;

    /* for IE */
    -ms-grid-row:1;
    -ms-grid-column:1;
    -ms-grid-column-span:3;
    `, children);
	const noButton = (...children) => `
    <button id="modal-no-button" type="button" 
        style="grid-area: no; -ms-grid-row:2; -ms-grid-column:1; margin: 5px; background-color: #f4f6f8; color: #212b36; border-radius: 20px; border: 1px solid #ADAEAF" 
        onMouseOver="this.style.backgroundColor='#E2E2E3'"
        onMouseOut="this.style.backgroundColor='#f4f6f8'">
        ${children}
    </button>
    `;
	const yesButton = (...children) => `
    <button id="modal-yes-button" type="button" 
        style="grid-area: yes; -ms-grid-row:2; -ms-grid-column:3; margin: 5px; background-color: #ff6971; color: #fff; border-radius: 20px; border: none" 
        onMouseOver="this.style.backgroundColor='#ff2934'"
        onMouseOut="this.style.backgroundColor='#ff6971'">
        ${children}
    </button>
    `;

	const getModal = (message, noLabel, onNo, yesLabel, onYes) => {
	  const modal = container(dialog$1(body(message), noButton(noLabel), yesButton(yesLabel)));
	  const modalElement = document.createElement('div');
	  modalElement.innerHTML = modal;
	  const yesElement = modalElement.querySelector('#modal-yes-button');
	  yesElement.onclick = onYes;
	  const noElement = modalElement.querySelector('#modal-no-button');
	  noElement.onclick = onNo;
	  return modalElement;
	};

	// import { container } from '../modal/modal.style'
	const dialog = (...children) => createStyledComponent('div', `
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-tems: center;

  position: absolute;
  top: 50%;
  left: 50%;

  width: 70%;
  max-height: 90%;
  transform: translate(-50%, -50%);
  padding: 1rem 1.5rem;

  box-shadow: 0 12px 24px 0 rgb(71 69 123 / 16%), 0 4px 8px 0 rgb(71 69 123 / 12%); 
  background-color: #f4f6f8;
  border: 1px solid rgba(71,69,123,.12);
  border-radius: 20px;

  font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol
`, children);
	const header = () => {
	  return createStyledComponent('div', `
  border-bottom: 1px solid rgb(203, 205, 211);
  `, ['<h3>Select Language</h3>']);
	};
	const item = data => `
  <div 
    class="lang-list-item"
    style="
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      padding: 8px;
      margin-top: 2px;
      margin-bottom: 2px;
      border-radius: 2px;
    "
    data-lang="${data.code}"
  >
    <span style="width: 25px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="25" width="25"><path d="M20.95 31.95 35.4 17.5l-2.15-2.15-12.3 12.3L15 21.7l-2.15 2.15ZM9 42q-1.2 0-2.1-.9Q6 40.2 6 39V9q0-1.2.9-2.1Q7.8 6 9 6h30q1.2 0 2.1.9.9.9.9 2.1v30q0 1.2-.9 2.1-.9.9-2.1.9Zm0-3h30V9H9v30ZM9 9v30V9Z"/></svg>
    </span>
    <span style="margin-left: 5px; flex: 1;">${data.caption}</span>
    <span style="font-size: 11px; color:#a5a5a5; text-align: right;">${data.name}</span>
  </div>
  `;
	const footer = () => {
	  const cancel = `<div style="
  cursor: pointer;
  font-weight: bold;
  font-size: 18px;
  padding: 10px;
" id="lang-cancel">Cancel</div>`;
	  const confirm = `<div style="
  background-color: rgb(36, 76, 222);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-weight: bold;
  padding: 10px;
  " id="lang-continue">Continue</div>`;
	  return createStyledComponent('div', `
  border-top: 1px solid rgb(203, 205, 211);
  padding-top: 8px;
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
  `, [cancel, confirm]);
	};
	const more = () => {
	  return `
  <div style="
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      padding: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
    " id="lang-more-toggle">
      + More
    </div>
  `;
	};
	const content = () => {
	  const allowUnconfiguredLanguages = getState('languages').allowUnconfiguredLanguages;
	  const moreButton = allowUnconfiguredLanguages ? more() : '';
	  return `
  <style>
    .lang-list-item svg {
      visibility: hidden;
    }
    .lang-list-item.selected svg {
      visibility: visible;
    }
    .lang-list-item.selected svg path {
      fill: rgb(32, 68, 200);
    }
    .lang-list-item.selected {
      background-color: rgb(226, 231, 250);
      color: rgb(32, 68, 200);
    }
  </style>
  
  <div id="lang-modal-standard" style="
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-tems: center;
    overflow: auto;
  ">
    ${header()}

    <div id="lang-list" style="
    list-style: none;
    font-size: 16px;
    overflow: scroll;
    ">
      ${getItems()}
    </div>
    ${moreButton}
  </div>

  <div id="lang-modal-disclaimer" style="
    display: none;
    flex-direction: column;
    justify-content: space-between;
    align-tems: center;
  ">
    <div class="disclaimer-header" style="
    border-bottom: 1px solid rgb(203, 205, 211);
    "></div>

    <div class="disclaimer-message" style="
    list-style: none;
    font-size: 16px;
    overflow: scroll;
    padding-top: 8px;
    padding-bottom: 8px;
    "></div>
  </div>

  ${footer()}
  `;
	};
	const getItems = (showMore = false) => {
	  const allowUnconfiguredLanguages = getState('languages').allowUnconfiguredLanguages;
	  const configuredLanguages = getState('languages').languages;
	  const items = configuredLanguages.map(data => item({
	    code: data.code,
	    name: LANGUAGES[data.code].name,
	    caption: LANGUAGES[data.code].caption
	  })).join('');

	  if (allowUnconfiguredLanguages && showMore) {
	    const codesConfigured = configuredLanguages.map(data => data.code);
	    const otherCodes = Object.keys(LANGUAGES).filter(i => codesConfigured.indexOf(i) === -1);
	    return codesConfigured.concat(otherCodes).map(code => item({
	      code,
	      name: LANGUAGES[code].name,
	      caption: LANGUAGES[code].caption
	    })).join('');
	  }

	  return items;
	};

	const LABELS = {
	  MORE_BUTTON: {
	    MORE: '+ More',
	    LESS: '- Less'
	  }
	};
	const LANGUAGE_MODAL_STATE = {
	  STANDARD: 'standard',
	  MORE: 'more',
	  DISCLAIMER: 'disclaimer'
	};
	const state = {
	  view: LANGUAGE_MODAL_STATE.STANDARD,
	  selectedLangCode: 'en'
	};

	const showLanguageModal = () => {
	  var _document$querySelect;

	  const mount = (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.contentDocument.querySelector('#mount');
	  const modal = document.createElement('div');
	  modal.innerHTML = container(dialog(content()));

	  const open = () => {
	    state.view = LANGUAGE_MODAL_STATE.STANDARD;
	    state.selectedLangCode = language.getDefaultLang();
	    const wrapper = mount === null || mount === void 0 ? void 0 : mount.querySelector('div#wrapper');
	    mount === null || mount === void 0 ? void 0 : mount.appendChild(modal);
	    wrapper && wrapper.setAttribute('style', 'pointer-events: none;opacity: 0.9;');
	  };

	  const close = () => {
	    const wrapper = mount.querySelector('div#wrapper');
	    mount.removeChild(modal);
	    wrapper && wrapper.setAttribute('style', 'pointer-events: auto;opacity: 1;');
	  };

	  const selectLanguageItem = () => {
	    if (!modal.querySelector('#lang-list div[data-lang="' + state.selectedLangCode + '"]')) {
	      state.selectedLangCode = language.getDefaultLang();
	    }

	    modal.querySelector('#lang-list div[data-lang="' + state.selectedLangCode + '"]').classList.add('selected');
	  };

	  const showSelectView = () => {
	    modal.querySelector('#lang-modal-standard').style.display = 'flex';
	  };

	  const hideSelectView = () => {
	    modal.querySelector('#lang-modal-standard').style.display = 'none';
	  };

	  const showDisclaimerView = data => {
	    const disclaimer = modal.querySelector('#lang-modal-disclaimer');
	    disclaimer.style.display = 'flex';
	    disclaimer.querySelector('.disclaimer-header').innerHTML = `<h3>${data.header}</h3>`;
	    disclaimer.querySelector('.disclaimer-message').innerHTML = data.message;
	    modal.querySelector('#lang-cancel').innerHTML = data.cancel;
	    modal.querySelector('#lang-continue').innerHTML = data.continue;
	  };

	  const hideDisclaimerView = () => {
	    modal.querySelector('#lang-modal-disclaimer').style.display = 'none';
	  };

	  const bindLangListItemClicks = () => {
	    const langList = modal.querySelectorAll('#lang-list > div');
	    langList.forEach(langListItem => {
	      langListItem.addEventListener('click', ev => {
	        langList.forEach(i => i.classList.remove('selected'));
	        langListItem.classList.add('selected');
	        state.selectedLangCode = langListItem.dataset.lang;
	      });
	    });
	  };

	  const moreButton = modal.querySelector('#lang-more-toggle');
	  moreButton === null || moreButton === void 0 ? void 0 : moreButton.addEventListener('click', () => {
	    if (state.view === LANGUAGE_MODAL_STATE.STANDARD) {
	      state.view = LANGUAGE_MODAL_STATE.MORE;
	    } else {
	      state.view = LANGUAGE_MODAL_STATE.STANDARD;
	    }

	    moreButton.innerHTML = state.view === LANGUAGE_MODAL_STATE.STANDARD ? LABELS.MORE_BUTTON.MORE : LABELS.MORE_BUTTON.LESS;
	    modal.querySelector('#lang-list').innerHTML = getItems(state.view === LANGUAGE_MODAL_STATE.MORE);
	    selectLanguageItem();
	    bindLangListItemClicks();
	  });
	  const closeButton = modal.querySelector('#lang-cancel');
	  closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener('click', ev => {
	    emitter.emit(Events.LangSelectionCancelled);

	    if (state.view === LANGUAGE_MODAL_STATE.DISCLAIMER) {
	      hideDisclaimerView();
	      showSelectView();
	      modal.querySelector('#lang-cancel').innerHTML = 'Cancel';
	      modal.querySelector('#lang-continue').innerHTML = 'Continue';
	      state.view = LANGUAGE_MODAL_STATE.STANDARD;
	      return;
	    }

	    close();
	  });
	  const continueButton = modal.querySelector('#lang-continue');
	  continueButton === null || continueButton === void 0 ? void 0 : continueButton.addEventListener('click', ev => {
	    // has disclaimer?
	    if (language.hasDisclaimer(state.selectedLangCode) && state.view !== LANGUAGE_MODAL_STATE.DISCLAIMER) {
	      state.view = LANGUAGE_MODAL_STATE.DISCLAIMER;
	      const disclaimerData = language.getDisclaimer(state.selectedLangCode);
	      hideSelectView();
	      showDisclaimerView(disclaimerData);
	      return;
	    } // or is already confirmiing disclaimer


	    const setLang = mutate('lang');
	    const setInitialLanguageSelection = mutate('initialLanguageSelection');
	    setLang(state.selectedLangCode);
	    setInitialLanguageSelection(false);
	    emitter.emit(Events.LangChanged, state.selectedLangCode);
	  });
	  selectLanguageItem();
	  bindLangListItemClicks();
	  open();
	};

	const insertTranslationIcon = function () {
	  var _document$querySelect;

	  const messengerOptions = getState('messenger');
	  const defaultActionColor = '65758e';
	  const iconColor = messengerOptions.customColors && messengerOptions.customColors.brandColor ? messengerOptions.customColors.brandColor : defaultActionColor;
	  const footer = (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.contentDocument.querySelector('#footer');
	  const hasIcon = footer === null || footer === void 0 ? void 0 : footer.querySelector('#f9-translation-icon');

	  if (hasIcon) {
	    return;
	  }

	  const translationButton = document.createElement('div');
	  translationButton.id = 'f9-translation-icon';
	  translationButton.style.cursor = 'pointer';
	  translationButton.style.display = 'flex';
	  translationButton.style.margin = '8px 8px 8px 0';
	  translationButton.style.alignItems = 'center';
	  translationButton.style.justifyContent = 'center';
	  translationButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0  48 48">
      <path fill="#${iconColor}" d="m23.75 44 9.05-24h4.1l9.3 24h-4.35l-2.05-6.3h-9.6L27.85 44Zm7.55-9.8h7.1l-3.5-9.7h-.1ZM8 38l-2.75-2.75 10.2-10.2q-1.9-2.2-3.375-4.425Q10.6 18.4 9.5 16h4.35q.85 1.65 1.875 3.125t2.325 3.025q2.25-2.35 3.75-4.875T24.35 12H2V8h14V4h4v4h14v4h-5.65q-1.1 3.45-2.925 6.775Q23.6 22.1 20.95 25.1l4.9 4.95-1.5 4.05L18 28Z"/>
    </svg>`;
	  footer === null || footer === void 0 ? void 0 : footer.appendChild(translationButton);
	  translationButton.addEventListener('click', () => {
	    showLanguageModal();
	  });
	  emitter.on(Events.ChatSystemConversationCreated, () => {
	    translationButton.style.display = 'none';
	  });
	  emitter.on(Events.ChatSystemConversationTerminated, () => {
	    translationButton.style.display = 'flex';
	  });
	};

	const mobile = isMobile(window.navigator);

	class Messenger {
	  constructor() {
	    this.preflightOnce = lodash_once(() => this.doPreflight());
	    this.preflight = debounce(() => this.doPreflight(), 5000);
	    this.selectLanguageOnce = lodash_once(() => showLanguageModal());
	  }

	  init() {
	    this.load();
	    this.preInit();
	    this.configure();
	    emitter.on(Events.Destroy, () => {
	      const messenger = this.getSunshine();

	      if (messenger && messenger.destroy) {
	        messenger.destroy();
	      }
	    });
	    emitter.on(Events.ChatAdjustHeader, () => this.adjustHeader());
	  }
	  /**
	   * Load Sunshine Messenger from our white labeled CDN deployment
	   */


	  load() {
	    const cdn = webMessenger(getState('cdn'));
	    debug('messenger script url', cdn);
	    sunshineLoader(cdn);
	  }

	  preInit() {
	    const messenger = this.getSunshine();
	    messenger.on('message:received', (message, data) => {
	      if (message.metadata && message.metadata.f9_type === 'providerPreFlight') {
	        this.getCurrentConversationId(this.getSunshine()).then(conversationId => this.preflight(conversationId));
	      }
	    });
	    messenger.on(Events.Opened, () => {
	      debug('messenger: Chat has been opened');
	      this.adjustHeader();
	      observeImageUploadElement();
	      const showTranslationIcon = !!getState('languages').enabled;

	      if (showTranslationIcon) {
	        // preflight will be after language selected
	        insertTranslationIcon();
	        this.selectLanguageOnce();
	      } else {
	        // preflight immediately (only onece) if multiple language is not enabled
	        this.preflightOnce();
	      }

	      adjustForm();
	    });
	    messenger.on(Events.Closed, () => {
	      debug('messenger: Chat has been closed');
	      removeCloseButton();
	    });
	    messenger.on('ready', () => {
	      this.afterInit();
	      setTimeout(() => {
	        emitter.emit(Events.MessengerReady);
	      }, 100);
	    });
	    messenger.on('destroy', () => {
	      debug('messenger: widget destroyed');
	    });
	    HandleChatEvents(this.getSunshine());
	    this.resetMessageListAfterChat();
	    this.resetMessengerOnLanguageChange();
	  }

	  afterInit() {
	    debug('messenger: init complete');
	    const forceMobile = this.forceMobile();
	    const embedded = !!getState('messenger').embedded;
	    const showTranslationIcon = !!getState('languages').enabled;

	    try {
	      this.getSunshine().setDelegate(delegates());
	      showTranslationIcon && insertTranslationIcon();

	      if (embedded) {
	        if (showTranslationIcon) {
	          this.selectLanguageOnce();
	        } else {
	          this.doPreflight();
	        }

	        observeImageUploadElement();
	        this.adjustHeader();
	        showCloseButton();
	      } else if (forceMobile) {
	        document.querySelector('iframe#web-messenger-container').classList.add('forceMobile');
	        document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#mount > div').className = 'widget-xs';
	        window.addEventListener('resize', () => {
	          document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#mount > div').className = 'widget-xs';
	        });
	      }
	    } catch (e) {
	      debug('Exception in messenger afterInit', e);
	    }
	  }
	  /**
	   * Configure Sunshine messenger with out custom prechat handshake and
	   * language bundle
	   */


	  configure() {
	    const options = getWebMessengerOptions();

	    if (['prod-uk', 'prod-eu'].includes(getState('cdn'))) {
	      options.region = 'eu-1';
	    }

	    const containerId = options.embedded ? options.containerId : false;
	    options.containerId && delete options.containerId;
	    options.embedded && delete options.displayStyle;
	    containerId && debug('messenger container id', containerId);
	    /* this.getSunshine().on('log:debug', function (e) {
	      console.log('Timestamp:', e.timestamp) // (Float) Date.now() when it was emitted
	      console.log('Message:', e.message) // (String) Message being logged
	      console.log('Data:', e.data) // (Object) Extra details to be logged
	    }) */

	    debug('messenger initializing with options', options);
	    this.getSunshine().init(options);

	    if (options.embedded) {
	      debug('Rendering embedded widget');
	      this.getSunshine().render(document.getElementById(containerId));
	    }
	  }

	  doPreflight() {
	    this.getCurrentConversationId(this.getSunshine()).then(conversationId => sendPreflight(conversationId));
	  }

	  getSunshine() {
	    return getSunshineInstance();
	  }

	  resetMessageListAfterChat() {
	    const timeout = getState('clearMessagesTimeout');
	    if (+timeout === 0) return;
	    emitter.on(Events.ChatSystemConversationTerminated, () => {
	      // work around for web messenger richcontent disappear issue
	      enableInput();
	      removeClonedRichcontentElement();
	      setTimeout(() => {
	        this.getCurrentConversationId(this.getSunshine()).then(conversationId => {
	          // work around for web messenger richcontent disappear issue
	          enableInput();
	          removeClonedRichcontentElement();
	          debug('Reset messages after conversation terminated.');
	          this.getSunshine().loadConversation(conversationId);
	        });
	      }, timeout * 1000);
	    });
	  }

	  resetMessengerOnLanguageChange() {
	    const enabled = getState('languages').enabled;
	    const setConversationInProgress = mutate('conversationInProgress');

	    if (enabled) {
	      this.getSunshine().on('widget:closed', () => {
	        if (!getState('conversationInProgress')) {
	          emitter.emit(Events.LangShow);
	        } else {
	          emitter.emit(Events.LangHide);
	        }
	      });
	      emitter.on(Events.ChatSystemConversationCreated, () => {
	        setConversationInProgress(true);
	      });
	      emitter.on(Events.ChatSystemConversationTerminated, () => {
	        setConversationInProgress(false);
	      });
	      emitter.on(Events.LangSelectionCancelled, () => {
	        this.preflightOnce();
	      });
	      emitter.on(Events.LangChanged, () => {
	        this.getSunshine().destroy();
	        sessionStorage.clear();
	        this.load();
	        this.preInit();
	        this.configure();
	        this.getSunshine().on('ready', () => {
	          emitter.emit(Events.LangHide);
	          this.getSunshine().open();
	          this.doPreflight();
	        });
	      });
	    }
	  }

	  getCurrentConversationId(s) {
	    return new Promise(resolve => {
	      const conversations = s.getConversations();

	      if (conversations.length) {
	        s.loadConversation(conversations[0].id).then(() => {
	          resolve(conversations[0].id);
	        });
	      } else {
	        s.createConversation().then(conversation => {
	          resolve(conversation.id);
	        });
	      }
	    });
	  }

	  getCurrentConversation() {
	    const s = this.getSunshine();
	    return new Promise(resolve => {
	      const conversations = s.getConversations();

	      if (conversations.length) {
	        s.loadConversation(conversations[0].id).then(() => {
	          resolve(conversations[0]);
	        });
	      }
	    });
	  }

	  forceMobile() {
	    return mobile.phone;
	  }

	  sendTeminateConversationMessage() {
	    const messenger = getSunshineInstance();

	    if (!messenger || !messenger.sendMessage) {
	      throw new Error('Messenger instance not ready');
	    }

	    this.getCurrentConversation().then(conversation => {
	      const messages = conversation.messages.filter(message => {
	        var _message$metadata;

	        return ((_message$metadata = message.metadata) === null || _message$metadata === void 0 ? void 0 : _message$metadata.f9_type) !== 'chatTerminated';
	      });

	      if (messages.length > 0) {
	        this.getCurrentConversationId(messenger).then(conversationId => {
	          messenger.sendMessage({
	            type: 'text',
	            text: 'Terminate conversation...',
	            metadata: {
	              f9_type: 'chatTerminated',
	              f9_transform: 'hide'
	            }
	          }, conversationId);
	        });
	      }
	    });
	  }

	  onCloseConversation(event) {
	    event.stopPropagation();
	    const mount = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#mount');

	    const onYes = () => {
	      this.sendTeminateConversationMessage();
	      mount.removeChild(modal);
	      container.setAttribute('style', 'pointer-events: auto; opacity: 1;');
	    };

	    const onNo = () => {
	      mount.removeChild(modal);
	      container.setAttribute('style', 'pointer-events: auto;opacity: 1;');
	    };

	    const {
	      customText
	    } = getWebMessengerOptions();
	    const modalContent = `<label>${(customText === null || customText === void 0 ? void 0 : customText.closeConfirmationMessage) ?? 'Are you sure you want to end the chat?'}</label>`;
	    const modal = getModal(modalContent, `${(customText === null || customText === void 0 ? void 0 : customText.closeConfirmationCancel) ?? 'Cancel'}`, onNo, `${(customText === null || customText === void 0 ? void 0 : customText.closeConfirmationEndChat) ?? 'End Chat'}`, onYes);
	    mount.appendChild(modal);
	    const container = document.querySelector('iframe#web-messenger-container').contentDocument.querySelector('#mount > div > div> div');
	    container.setAttribute('style', 'pointer-events: none;opacity: 0.9;');
	  }

	  adjustHeader() {
	    var _document$querySelect, _document$querySelect2;

	    const header = (_document$querySelect = document.querySelector('iframe#web-messenger-container')) === null || _document$querySelect === void 0 ? void 0 : (_document$querySelect2 = _document$querySelect.contentDocument) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelector('#mount > div > div> div > #header');
	    const headerIcons = header === null || header === void 0 ? void 0 : header.querySelectorAll('.close-handle');
	    const minusIcon = headerIcons === null || headerIcons === void 0 ? void 0 : headerIcons[0];
	    const path = minusIcon === null || minusIcon === void 0 ? void 0 : minusIcon.querySelector('.close-icon > g > g > path');
	    path === null || path === void 0 ? void 0 : path.setAttribute('d', 'M3.5 12a.65.65 0 01.65-.65h15.59a.65.65 0 110 1.3H4.15A.65.65 0 013.5 12z');
	    const embedded = getState('messenger').embedded;
	    const closeButton = headerIcons === null || headerIcons === void 0 ? void 0 : headerIcons[1]; // create close button for: 1. embedded 2. non-embedded but minus button is there

	    if (!closeButton && (embedded || minusIcon)) {
	      const closeElement = createCloseButtonElement();
	      closeElement.onclick = this.onCloseConversation.bind(this);
	      header === null || header === void 0 ? void 0 : header.insertBefore(closeElement, minusIcon === null || minusIcon === void 0 ? void 0 : minusIcon.nextSibling);
	    }

	    if (formNotSubmitted()) {
	      hideCloseButton();
	    }
	  }

	}

	var messenger = new Messenger();

	const getWidgetId = () => {
	  var _getState;

	  return ((_getState = getState('messenger')) === null || _getState === void 0 ? void 0 : _getState.integrationId) ?? 'chat-widget';
	};

	const onOpenView = () => {
	  const setIsOpened = mutate('isOpened');
	  setIsOpened(true);
	  emitter.emit(Events.Opened);
	};

	const onCloseView = () => {
	  const setIsOpened = mutate('isOpened');
	  setIsOpened(false);
	  emitter.emit(Events.Closed);
	};

	const onAppStateEvent = (subscriberId, event, options) => {
	  var _appState$data, _appState$data2;

	  const {
	    appState
	  } = event;

	  switch (appState === null || appState === void 0 ? void 0 : appState.type) {
	    case 'inited':
	      emitter.emit(Events.Inited, appState === null || appState === void 0 ? void 0 : appState.data);
	      break;

	    case 'notEnabled':
	      messenger.init();
	      destroyNgchat();
	      break;

	    case 'languageSelected':
	      emitter.emit(Events.LangChanged);
	      break;

	    case 'languageSelectionCancelled':
	      emitter.emit(Events.LangSelectionCancelled);
	      break;

	    case 'formSubmitted':
	      emitter.emit(Events.ChatCaptureSubmitted);
	      break;

	    case 'readyToChat':
	      emitter.emit(Events.MessengerReady);
	      break;

	    case 'conversationCreated':
	      emitter.emit(Events.ChatSystemConversationCreated);
	      break;

	    case 'participantJoined':
	      emitter.emit(Events.ChatSystemParticipantJoined);
	      break;

	    case 'participantLeft':
	      emitter.emit(Events.ChatSystemParticipantLeft);
	      break;

	    case 'transferredToParticipant':
	      emitter.emit(Events.ChatSystemTransferredToParticipant);
	      break;

	    case 'transferredToGroup':
	      emitter.emit(Events.ChatSystemTransferredToGroup);
	      break;

	    case 'messageSent':
	      emitter.emit(Events.ChatMessageSent);
	      break;

	    case 'messageReceived':
	      emitter.emit(Events.ChatMessageReceived);
	      break;

	    case 'terminationRequested':
	      emitter.emit(Events.ChatSystemTerminationRequested);
	      break;

	    case 'conversationTerminated':
	      emitter.emit(Events.ChatSystemConversationTerminated);
	      break;

	    case 'historyCleared':
	      debug('onAppStateEvent: historyCleared', event);
	      break;

	    case 'windowClosed':
	      emitter.emit(Events.Destroy);
	      break;

	    case 'openView':
	      onOpenView();
	      break;

	    case 'closeView':
	      onCloseView();
	      break;

	    case 'minimized':
	      widgetMin();
	      break;

	    case 'maximized':
	      widgetMax();
	      break;

	    case 'chatEvent':
	      emitter.emit(Events.ChatEvent, {
	        eventType: 'SYSTEM',
	        eventName: appState === null || appState === void 0 ? void 0 : (_appState$data = appState.data) === null || _appState$data === void 0 ? void 0 : _appState$data.eventName,
	        displayText: appState === null || appState === void 0 ? void 0 : (_appState$data2 = appState.data) === null || _appState$data2 === void 0 ? void 0 : _appState$data2.displayText
	      });
	      break;

	    case 'navigatingOut':
	      destroyNgchat();
	      createWindowWidget({ ...options,
	        messenger: { ...(options === null || options === void 0 ? void 0 : options.messenger),
	          displayStyle: 'window'
	        }
	      });
	      emitter.emit(Events.PopOut);
	      break;

	    default:
	      debug('onAppStateEvent: unsupported appStateEvent', event);
	  }
	};

	const widgetStart = () => {
	  const iframe = document.getElementById(getWidgetId());
	  applyRule(iframe, 'f9ChatWidget');
	};
	const widgetMin = () => {
	  const iframe = document.getElementById(getWidgetId());
	  const {
	    displayStyle
	  } = getState('messenger');
	  removeRule(iframe, 'f9ChatOpened');

	  if (displayStyle === 'tab') {
	    applyRule(iframe, 'f9ChatMinimizedTab');
	  } else {
	    applyRule(iframe, 'f9ChatMinimizedButton');
	  }
	};
	const widgetMax = () => {
	  const embedded = Boolean(getState('messenger').embedded);

	  if (!embedded) {
	    const iframe = document.getElementById(getWidgetId());
	    removeRule(iframe, 'f9ChatPreviewWidth');
	    removeRule(iframe, 'f9ChatMinimizedTab');
	    removeRule(iframe, 'f9ChatMinimizedButton');
	    applyRule(iframe, 'f9ChatOpened');
	  }
	};
	const widgetEmbedded = () => {
	  const iframe = document.getElementById(getWidgetId());
	  removeRule(iframe, 'f9ChatPreviewWidth');
	  removeRule(iframe, 'f9ChatMinimizedTab');
	  removeRule(iframe, 'f9ChatMinimizedButton');
	  applyRule(iframe, 'f9ChatEmbedded');
	};
	const usePreviewWidth = () => {
	  const iframe = document.getElementById(getWidgetId());
	  applyRule(iframe, 'f9ChatPreviewWidth');
	};

	/**
	 * Lightweight drag handler for iframe widget
	 * Enables dragging the chat widget around the screen using overlay approach
	 */
	const STORAGE_KEY = 'f9-chat-widget-position';
	const DRAG_HANDLE_CURSOR = 'move';
	const DRAG_OVERLAY_ID = 'f9-drag-overlay';
	/**
	 * Expanded header drag handle sizing
	 *
	 * The overlay should not block interactive header controls inside the iframe (e.g. close/minimize).
	 * Exclusion values are in pixels and are applied on both sides of the handle area.
	 *
	 * ============================================================================
	 * ACCESSIBILITY LIMITATION (WCAG 2.4.11 Focus Not Obscured):
	 * ============================================================================
	 *
	 * ISSUE:
	 * The drag overlay must use pointer-events: auto to intercept mouse/touch events for drag
	 * initiation. This creates an inherent accessibility trade-off where focusable controls
	 * placed in the center drag area (top 50px, excluding left 50px and right 100px) may be
	 * obscured or difficult to activate with pointer devices.
	 *
	 * ARCHITECTURAL CONSTRAINT:
	 * Mouse/touch-based dragging requires the overlay to intercept pointer events from the start
	 * of interaction. Alternative approaches (e.g., small handle region, pointer-events: none by
	 * default) either break drag initiation or create poor UX (requiring users to start drag from
	 * a tiny specific area). This is a fundamental limitation of pointer-based drag implementations.
	 *
	 * MITIGATIONS IN PLACE:
	 * 1. Click forwarding: Single clicks (< 3px movement) are automatically forwarded to the iframe,
	 *    allowing activation of controls underneath (works for same-origin iframes only).
	 * 2. Exclusion zones: 50px left and 100px right exclusions leave header controls directly
	 *    accessible without requiring forwarding.
	 * 3. aria-hidden="true": Screen readers ignore the overlay completely.
	 * 4. data-drag-handle attribute: Enables automated accessibility testing tools to identify
	 *    the drag handle for validation.
	 *
	 * KNOWN LIMITATIONS:
	 * - Keyboard navigation for dragging is NOT supported (explicitly noted in product requirements).
	 * - Focus indicators on controls under the overlay may be visually obscured.
	 * - Click forwarding does not work reliably with cross-origin iframes due to browser security.
	 * - Users relying solely on keyboard cannot reposition the widget.
	 *
	 * GUIDANCE FOR IFRAME DEVELOPERS:
	 * Avoid placing critical focusable controls (buttons, links, inputs) in the center portion of
	 * the top 50px header area. Position interactive controls within the excluded zones (left 50px
	 * or right 100px) where they remain directly accessible without overlay interference.
	 *
	 * ============================================================================
	 * ACCESSIBILITY LIMITATION (WCAG 2.5.7 Dragging Movements):
	 * ============================================================================
	 *
	 * ISSUE:
	 * The widget repositioning functionality is only available via mouse/touch dragging.
	 * No keyboard-based or non-drag alternative is currently provided for repositioning
	 * the widget. Users who cannot perform drag operations (keyboard-only users, users
	 * with motor disabilities, assistive technology users) have no way to reposition
	 * the widget if needed to reach content or avoid overlap.
	 *
	 * WCAG 2.5.7 REQUIREMENT:
	 * All functionality that uses dragging movements must have a single-pointer alternative
	 * that does not require dragging (Level AA). Examples include:
	 * - Keyboard controls (arrow keys for nudging, keyboard shortcuts for snap-to positions)
	 * - UI controls (buttons for "Move to corner", "Nudge left/right/up/down", "Reset position")
	 * - Context menu options for repositioning
	 *
	 * CURRENT STATE:
	 * Keyboard navigation for widget dragging/repositioning is NOT supported. This is
	 * explicitly noted in product requirements/documentation. The widget hint states:
	 * "Draggable mode allows end users to reposition chat widget on the web page.
	 * Keyboard navigation for this action is currently not supported."
	 *
	 * EXPOSED API:
	 * The draggable implementation does expose a programmatic API that could be used
	 * by the iframe to implement alternative controls:
	 * - setPosition(x, y): Programmatically move widget to specific coordinates
	 * - getPosition(): Get current widget position
	 * - reset(): Reset widget to default position
	 *
	 * However, no UI controls are currently provided that utilize this API for
	 * keyboard-based or non-drag repositioning.
	 *
	 * FUTURE CONSIDERATION:
	 * Complete WCAG 2.5.7 compliance requires implementing alternative repositioning methods:
	 * - Keyboard shortcuts (e.g., Ctrl+Arrow keys for nudging)
	 * - UI controls accessible via keyboard (e.g., "Move" menu with preset positions)
	 * - Context menu with repositioning options
	 * - Ensure iframe UI implements keyboard-accessible controls using the exposed API
	 *
	 * This is a significant accessibility gap that prevents keyboard-only users from
	 * accessing equivalent functionality. Implementation of keyboard alternatives should
	 * be prioritized for future releases to achieve WCAG Level AA compliance.
	 * ============================================================================
	 */

	const EXPANDED_HANDLE_HEIGHT_PX = 50; // Leave room on the left for header controls inside the iframe (e.g. back button/avatar)

	const EXPANDED_HANDLE_EXCLUDE_LEFT_PX = 50; // Leave room on the right for header controls inside the iframe (close/minimize/etc.)

	const EXPANDED_HANDLE_EXCLUDE_RIGHT_PX = 100;
	/**
	 * Initialize draggable functionality for an iframe element
	 * @param {HTMLElement} container - The container element that wraps the iframe
	 * @param {HTMLElement} iframe - The iframe element to make draggable
	 * @param {Object} options - Configuration options
	 * @param {boolean} options.savePosition - Whether to save position to localStorage (default: true)
	 * @param {boolean} options.constrainToViewport - Keep widget within viewport bounds (default: true)
	 */

	const initDraggable = (container, iframe, options = {}) => {
	  if (!container) {
	    console.warn('Draggable: No container element provided');
	    return null;
	  }

	  if (!iframe) {
	    console.warn('Draggable: No iframe element provided');
	    return null;
	  }

	  const config = {
	    savePosition: options.savePosition !== false,
	    constrainToViewport: options.constrainToViewport !== false,
	    reconstrainOnStateChange: options.reconstrainOnStateChange === true,
	    onDragStart: options.onDragStart || null,
	    onDrag: options.onDrag || null,
	    onDragEnd: options.onDragEnd || null,
	    onClick: options.onClick || null
	  };
	  let isDragging = false;
	  let hasMoved = false;
	  let hasBeenDragged = false; // True once the user has successfully dragged the widget

	  let startX = 0;
	  let startY = 0;
	  let initialX = 0;
	  let initialY = 0;
	  let currentX = 0;
	  let currentY = 0;
	  let expandedX = 0; // Track position when widget is expanded

	  let expandedY = 0; // Track position when widget is expanded

	  let dragOverlay = null;
	  /**
	   * Bootstrap the internal position state from the iframe's current on-screen position.
	   *
	   * Without this, `currentX/currentY` stay at (0,0) until the first drag or a saved position restore.
	   * When the widget is minimized/expanded and `reconstrainOnStateChange` runs, it would otherwise
	   * snap the widget to the viewport's top-left corner.
	   */

	  const bootstrapCurrentPositionFromDOM = () => {
	    try {
	      const rect = iframe.getBoundingClientRect();
	      currentX = rect.left;
	      currentY = rect.top; // Initialize expanded position to current position if not minimized

	      if (!isMinimized()) {
	        expandedX = currentX;
	        expandedY = currentY;
	      }
	    } catch (e) {
	      // If layout isn't ready yet, keep defaults and rely on later updates (drag/restore/recontract)
	      console.debug('Draggable: Layout not ready, will bootstrap on next update', e);
	    }
	  }; // Check if iframe is minimized


	  const isMinimized = () => {
	    return iframe.classList.contains('f9ChatMinimizedButton') || iframe.classList.contains('f9ChatMinimizedTab');
	  }; // Check if iframe is expanded


	  const isExpanded = () => {
	    return iframe.classList.contains('f9ChatOpened');
	  };

	  const getWidgetState = () => {
	    if (isMinimized()) return 'minimized';
	    if (isExpanded()) return 'expanded';
	    return 'unknown';
	  }; // Create overlay for dragging


	  const createDragOverlay = () => {
	    if (dragOverlay) return dragOverlay;
	    dragOverlay = document.createElement('div');
	    dragOverlay.id = DRAG_OVERLAY_ID; // Accessibility: Mark overlay as hidden from screen readers since it's a non-interactive drag handle

	    dragOverlay.setAttribute('aria-hidden', 'true'); // Test identifier: Allows automated accessibility testing tools to identify the drag handle

	    dragOverlay.setAttribute('data-drag-handle', 'true');
	    dragOverlay.style.cssText = `
      position: fixed;
      cursor: ${DRAG_HANDLE_CURSOR};
      z-index: 9997;
      background: rgba(0,0,0,0);
      display: none;
      pointer-events: auto;
      border: none;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    `;
	    document.body.appendChild(dragOverlay);
	    return dragOverlay;
	  }; // Update overlay position and size to match draggable area


	  const updateOverlayPosition = (immediate = false) => {
	    if (!dragOverlay) return;
	    const rect = iframe.getBoundingClientRect();

	    if (isMinimized()) {
	      // Minimized does not support dragging — hide the overlay so clicks reach the iframe directly
	      dragOverlay.style.display = 'none';
	      return;
	    } else if (isExpanded()) {
	      // When expanded, overlay covers top area but leaves both sides clickable for controls
	      const width = Math.max(0, rect.width - EXPANDED_HANDLE_EXCLUDE_LEFT_PX - EXPANDED_HANDLE_EXCLUDE_RIGHT_PX);
	      dragOverlay.style.left = rect.left + EXPANDED_HANDLE_EXCLUDE_LEFT_PX + 'px';
	      dragOverlay.style.top = rect.top + 'px';
	      dragOverlay.style.width = width + 'px';
	      dragOverlay.style.height = EXPANDED_HANDLE_HEIGHT_PX + 'px';
	    } else {
	      // Hide overlay if state is unknown
	      dragOverlay.style.display = 'none';
	      return;
	    }

	    dragOverlay.style.display = 'block';
	  };

	  const cleanupDraggingVisuals = () => {
	    iframe.classList.remove('f9-dragging');
	    document.body.style.userSelect = '';
	    document.body.style.cursor = '';
	  };

	  const constrainCurrentPosition = () => {
	    // Re-apply currentX/currentY after size changes (minimized <-> expanded)
	    const newPos = updatePosition(currentX, currentY);
	    currentX = newPos.x;
	    currentY = newPos.y;
	  }; // Reset to original position (used when minimizing)


	  const resetToOriginalPosition = () => {
	    currentX = 0;
	    currentY = 0;
	    iframe.style.transform = '';
	    iframe.style.right = '';
	    iframe.style.bottom = '';
	    iframe.style.left = '';
	    iframe.style.top = '';
	  }; // Restore to expanded position (used when expanding)


	  const restoreExpandedPosition = () => {
	    currentX = expandedX;
	    currentY = expandedY;
	    const newPos = updatePosition(currentX, currentY);
	    currentX = newPos.x;
	    currentY = newPos.y;
	  }; // Observe iframe changes to update overlay


	  const observeIframe = () => {
	    let lastKnownState = getWidgetState();
	    let reconstrainTimers = [];
	    let debouncedUpdateOverlay = null;

	    const clearReconstrainTimers = () => {
	      reconstrainTimers.forEach(t => clearTimeout(t));
	      reconstrainTimers = [];
	    };

	    const scheduleReconstrain = () => {
	      clearReconstrainTimers(); // Only use immediate timer - remove the 350ms delay that causes visible lag

	      reconstrainTimers.push(setTimeout(() => {
	        if (!isDragging) constrainCurrentPosition();
	      }, 0));
	    }; // Debounce overlay updates to avoid excessive recalculations during animations
	    // Use immediate update for state changes to fix Issue #2 and #3


	    const debouncedUpdateOverlayPosition = (immediate = false) => {
	      if (immediate) {
	        // Immediate update for state changes (minimize/maximize)
	        if (!isDragging) {
	          updateOverlayPosition(true);
	        }

	        return;
	      } // Debounced update for other cases (resize, etc.)


	      if (debouncedUpdateOverlay) {
	        clearTimeout(debouncedUpdateOverlay);
	      }

	      debouncedUpdateOverlay = setTimeout(() => {
	        if (!isDragging) {
	          updateOverlayPosition();
	        }
	      }, 50); // Wait 50ms for DOM to stabilize
	    };

	    const observer = new MutationObserver(() => {
	      const state = getWidgetState();
	      const stateChanged = state !== lastKnownState;
	      const previousState = lastKnownState;
	      lastKnownState = state;

	      if (!isDragging) {
	        // Use immediate update for state changes to eliminate delay (Issue #3)
	        debouncedUpdateOverlayPosition(true);

	        if (config.reconstrainOnStateChange && stateChanged) {
	          // Use isMinimized()/isExpanded() helpers for the *current* state rather than string
	          // equality, so this remains correct if getWidgetState() gains additional state names.
	          // Minimized does not support dragging, so position saving/restoring only applies to
	          // the expanded <-> minimized transition (expanded is the only draggable state).
	          const nowMinimized = isMinimized();
	          const nowExpanded = isExpanded();
	          const wasExpanded = previousState === 'expanded';
	          const wasMinimized = previousState === 'minimized';

	          if (nowMinimized && wasExpanded) {
	            // expanded -> minimized: save the dragged position so it can be restored, then reset.
	            expandedX = currentX;
	            expandedY = currentY; // Use immediate execution (no setTimeout) to eliminate delay

	            if (!isDragging) {
	              resetToOriginalPosition();
	              savePosition(); // persist the reset so page-refresh restores origin, not old drag pos
	            }
	          } else if (nowExpanded && wasMinimized) {
	            // minimized -> expanded: restore the previously saved expanded position.
	            // Use immediate execution (no setTimeout) to eliminate delay (Issue #3)
	            // Only restore if the widget has actually been dragged; otherwise let CSS handle position.
	            if (!isDragging && hasBeenDragged) restoreExpandedPosition();
	          } else {
	            // All other transitions (e.g. unknown <-> expanded, opening, docked, etc.):
	            // use the normal constrain behaviour so the widget stays within the viewport.
	            scheduleReconstrain();
	          }
	        }
	      }
	    });
	    observer.observe(iframe, {
	      attributes: true,
	      attributeFilter: ['class', 'style']
	    }); // attach cleanup so detachListeners can clear pending timers too

	    observer._clearReconstrainTimers = clearReconstrainTimers;

	    observer._clearDebouncedOverlay = () => {
	      if (debouncedUpdateOverlay) clearTimeout(debouncedUpdateOverlay);
	    };

	    return observer;
	  }; // Restore saved position


	  const restorePosition = () => {
	    if (!config.savePosition) return;

	    try {
	      const saved = localStorage.getItem(STORAGE_KEY);

	      if (saved) {
	        const data = JSON.parse(saved); // Handle both old format (just x,y) and new format (with expandedX, expandedY).
	        // Use nullish coalescing so explicitly stored 0 / negative values are preserved correctly
	        // (|| would silently convert a valid stored 0 to the fallback).

	        currentX = data.x ?? 0;
	        currentY = data.y ?? 0;
	        expandedX = data.expandedX ?? data.x ?? 0;
	        expandedY = data.expandedY ?? data.y ?? 0; // Only apply the transform if not minimized. When minimized the widget should stay at its
	        // CSS default position (origin); the position variables are still loaded so expanding will
	        // correctly restore the saved expanded position via restoreExpandedPosition().

	        if (!isMinimized()) {
	          updatePosition(currentX, currentY);
	        }
	      }
	    } catch (e) {
	      console.warn('Failed to restore widget position:', e);
	    }
	  }; // Save current position


	  const savePosition = () => {
	    if (!config.savePosition) return;

	    try {
	      localStorage.setItem(STORAGE_KEY, JSON.stringify({
	        x: currentX,
	        y: currentY,
	        expandedX: expandedX,
	        expandedY: expandedY
	      }));
	    } catch (e) {
	      console.warn('Failed to save widget position:', e);
	    }
	  }; // Update iframe position


	  const updatePosition = (x, y) => {
	    if (config.constrainToViewport) {
	      const rect = iframe.getBoundingClientRect();
	      const maxX = window.innerWidth - rect.width;
	      const maxY = window.innerHeight - rect.height;
	      x = Math.max(0, Math.min(x, maxX));
	      y = Math.max(0, Math.min(y, maxY));
	    } // Use transform for smooth performance


	    iframe.style.transform = `translate(${x}px, ${y}px)`;
	    iframe.style.right = 'auto';
	    iframe.style.bottom = 'auto';
	    iframe.style.left = '0';
	    iframe.style.top = '0';
	    return {
	      x,
	      y
	    };
	  }; // Handle drag start


	  const handleDragStart = e => {
	    // Only left mouse button or touch
	    if (e.type === 'mousedown' && e.button !== 0) return; // Prevent dragging when minimized

	    if (isMinimized()) {
	      return;
	    } // Lazy bootstrap: on first drag, sync internal position state with widget's actual on-screen
	    // position so dragging works correctly from CSS default positioning (e.g. bottom-right).


	    if (currentX === 0 && currentY === 0 && expandedX === 0 && expandedY === 0) {
	      bootstrapCurrentPositionFromDOM();
	    }

	    isDragging = true;
	    hasMoved = false;
	    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
	    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
	    startX = clientX;
	    startY = clientY;
	    const rect = iframe.getBoundingClientRect();
	    initialX = rect.left;
	    initialY = rect.top; // Don't prevent default or apply drag styling yet
	    // We'll do that in handleDrag if the user actually drags

	    if (config.onDragStart) {
	      config.onDragStart({
	        x: initialX,
	        y: initialY
	      });
	    }
	  }; // Handle dragging


	  const handleDrag = e => {
	    if (!isDragging) return; // Safety check: stop dragging if widget becomes minimized during drag

	    if (isMinimized()) {
	      handleDragEnd(e);
	      return;
	    }

	    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
	    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
	    const deltaX = clientX - startX;
	    const deltaY = clientY - startY; // Check if mouse has moved enough to be considered a drag (threshold: 3px)

	    if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
	      hasMoved = true; // Apply drag styling only when actually dragging

	      iframe.classList.add('f9-dragging');
	      document.body.style.userSelect = 'none';
	      document.body.style.cursor = DRAG_HANDLE_CURSOR;
	    } // Only update position if we're actually dragging


	    if (hasMoved) {
	      // Mark that the user has actually dragged the widget
	      if (!hasBeenDragged) {
	        hasBeenDragged = true;
	      }

	      currentX = initialX + deltaX;
	      currentY = initialY + deltaY;
	      const newPos = updatePosition(currentX, currentY);
	      currentX = newPos.x;
	      currentY = newPos.y; // If dragging while expanded, also update the expanded position

	      if (isExpanded()) {
	        expandedX = currentX;
	        expandedY = currentY;
	      } // Update overlay position during drag


	      updateOverlayPosition();

	      if (config.onDrag) {
	        config.onDrag({
	          x: currentX,
	          y: currentY
	        });
	      }
	    }

	    e.preventDefault();
	  };

	  const dispatchMouseEvent = (target, type, opts) => {
	    if (!target) return;
	    const ev = new MouseEvent(type, {
	      bubbles: true,
	      cancelable: true,
	      view: window,
	      ...opts
	    });
	    target.dispatchEvent(ev);
	  };

	  const forwardClick = (clientX, clientY) => {
	    var _iframe$click;

	    // Prefer forwarding into iframe document (works only if same-origin)
	    try {
	      var _iframe$contentWindow;

	      const rect = iframe.getBoundingClientRect();
	      const xInFrame = clientX - rect.left;
	      const yInFrame = clientY - rect.top;
	      const doc = (_iframe$contentWindow = iframe.contentWindow) === null || _iframe$contentWindow === void 0 ? void 0 : _iframe$contentWindow.document;
	      const target = doc === null || doc === void 0 ? void 0 : doc.elementFromPoint(xInFrame, yInFrame);

	      if (target) {
	        dispatchMouseEvent(target, 'mousedown', {
	          clientX: xInFrame,
	          clientY: yInFrame
	        });
	        dispatchMouseEvent(target, 'mouseup', {
	          clientX: xInFrame,
	          clientY: yInFrame
	        });
	        dispatchMouseEvent(target, 'click', {
	          clientX: xInFrame,
	          clientY: yInFrame
	        });
	        return;
	      }
	    } catch (err) {// Cross-origin iframe: ignore and fallback below
	    } // Fallback: focus + click on the iframe element itself


	    try {
	      var _iframe$contentWindow2;

	      (_iframe$contentWindow2 = iframe.contentWindow) === null || _iframe$contentWindow2 === void 0 ? void 0 : _iframe$contentWindow2.focus();
	    } catch (err) {// ignore
	    }

	    iframe.focus();
	    (_iframe$click = iframe.click) === null || _iframe$click === void 0 ? void 0 : _iframe$click.call(iframe);
	    dispatchMouseEvent(iframe, 'click', {
	      clientX,
	      clientY
	    });
	  }; // Handle drag end


	  const handleDragEnd = e => {
	    if (!isDragging) return;
	    isDragging = false; // If the user didn't actually drag, it was just a click

	    if (!hasMoved) {
	      const clientX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
	      const clientY = e.type === 'touchend' ? e.changedTouches[0].clientY : e.clientY;
	      const state = isMinimized() ? 'minimized' : isExpanded() ? 'expanded' : 'unknown'; // 1) Let caller handle the click (recommended for minimized open behavior)

	      if (typeof config.onClick === 'function') {
	        try {
	          const handled = config.onClick({
	            clientX,
	            clientY,
	            state
	          });
	          if (handled === true) return;
	        } catch (err) {// ignore and fallback
	        }
	      } // 2) Fallback: attempt to forward the click into the iframe


	      if (dragOverlay) dragOverlay.style.pointerEvents = 'none';
	      setTimeout(() => {
	        forwardClick(clientX, clientY);
	        if (dragOverlay) dragOverlay.style.pointerEvents = 'auto';
	      }, 0);
	      return; // Don't save position or trigger onDragEnd for clicks
	    } // Only clean up drag styling if we actually dragged


	    iframe.classList.remove('f9-dragging');
	    document.body.style.userSelect = '';
	    document.body.style.cursor = '';
	    savePosition();

	    if (config.onDragEnd) {
	      config.onDragEnd({
	        x: currentX,
	        y: currentY
	      });
	    }

	    e.preventDefault();
	  }; // Attach event listeners


	  const attachListeners = () => {
	    const overlay = createDragOverlay();
	    const observer = observeIframe(); // Mouse events

	    overlay.addEventListener('mousedown', handleDragStart, {
	      passive: false
	    });
	    document.addEventListener('mousemove', handleDrag, {
	      passive: false
	    });
	    document.addEventListener('mouseup', handleDragEnd, {
	      passive: false
	    }); // Touch events

	    overlay.addEventListener('touchstart', handleDragStart, {
	      passive: false
	    });
	    document.addEventListener('touchmove', handleDrag, {
	      passive: false
	    });
	    document.addEventListener('touchend', handleDragEnd, {
	      passive: false
	    }); // Initial overlay setup

	    setTimeout(() => {
	      updateOverlayPosition();
	    }, 100);

	    const handleResize = () => {
	      if (!isDragging) {
	        updateOverlayPosition(); // Only constrain if the widget has been dragged from its CSS default position.
	        // If never dragged, let CSS (right/bottom positioning) handle the resize naturally.

	        if (hasBeenDragged) {
	          constrainCurrentPosition();
	        }
	      }
	    };

	    window.addEventListener('resize', handleResize); // Store observer/handlers for cleanup

	    overlay._observer = observer;
	    overlay._handleResize = handleResize;
	    console.log('Widget dragging initialized with overlay');
	  }; // Detach event listeners


	  const detachListeners = () => {
	    if (dragOverlay) {
	      if (dragOverlay._observer) {
	        if (typeof dragOverlay._observer._clearReconstrainTimers === 'function') {
	          dragOverlay._observer._clearReconstrainTimers();
	        }

	        if (typeof dragOverlay._observer._clearDebouncedOverlay === 'function') {
	          dragOverlay._observer._clearDebouncedOverlay();
	        }

	        dragOverlay._observer.disconnect();
	      }

	      if (dragOverlay._handleResize) {
	        window.removeEventListener('resize', dragOverlay._handleResize);
	      }

	      dragOverlay.remove();
	      dragOverlay = null;
	    }

	    document.removeEventListener('mousemove', handleDrag);
	    document.removeEventListener('mouseup', handleDragEnd);
	    document.removeEventListener('touchmove', handleDrag);
	    document.removeEventListener('touchend', handleDragEnd); // Clean up iframe styles

	    cleanupDraggingVisuals();
	  }; // Reset to default position


	  const resetPosition = () => {
	    currentX = 0;
	    currentY = 0;
	    expandedX = 0;
	    expandedY = 0;
	    iframe.style.transform = '';
	    iframe.style.right = '';
	    iframe.style.bottom = '';
	    iframe.style.left = '';
	    iframe.style.top = '';

	    if (config.savePosition) {
	      localStorage.removeItem(STORAGE_KEY);
	    }

	    updateOverlayPosition(true);
	  }; // Initialize — clear any persisted position so every page load starts at origin.
	  // Position memory (expandedX/Y) is maintained in-session only (minimize <-> expand).


	  attachListeners();

	  if (config.savePosition) {
	    localStorage.removeItem(STORAGE_KEY);
	  }

	  restorePosition(); // Bootstrap position from DOM if the widget has been moved via setPosition or restorePosition.
	  // Only do so when position variables are non-zero (i.e., position was actually restored),
	  // meaning the widget has been explicitly placed. This avoids incorrectly capturing the
	  // CSS default position (e.g. bottom-right) which would break resize behaviour.

	  if (!isMinimized() && (currentX !== 0 || currentY !== 0)) {
	    hasBeenDragged = true;
	    bootstrapCurrentPositionFromDOM();
	  } // Return control API


	  return {
	    destroy: detachListeners,
	    reset: resetPosition,
	    getPosition: () => ({
	      x: currentX,
	      y: currentY,
	      expandedX: expandedX,
	      expandedY: expandedY
	    }),
	    setPosition: (x, y) => {
	      currentX = x;
	      currentY = y;
	      hasBeenDragged = true; // setPosition explicitly places the widget
	      // If setting position while expanded, also update expanded position

	      if (isExpanded()) {
	        expandedX = x;
	        expandedY = y;
	      }

	      updatePosition(currentX, currentY);
	      savePosition();
	    }
	  };
	};
	/**
	 * Clear saved widget position from localStorage
	 */

	const clearSavedPosition = () => {
	  try {
	    localStorage.removeItem(STORAGE_KEY);
	  } catch (e) {
	    console.warn('Failed to clear saved position:', e);
	  }
	};

	const removeWebMessenger = () => {
	  var _iframe$parentElement;

	  const iframe = document.body.querySelector('iframe#web-messenger-container');
	  iframe === null || iframe === void 0 ? void 0 : (_iframe$parentElement = iframe.parentElement) === null || _iframe$parentElement === void 0 ? void 0 : _iframe$parentElement.removeChild(iframe);
	};

	const showIframeWidget = () => {
	  const iframe = document.getElementById(getWidgetId());
	  iframe === null || iframe === void 0 ? void 0 : iframe.removeAttribute('hidden');
	};

	const setGlobalInstance = () => {
	  window[MessengerNamespace] = {
	    isOpened: function () {
	      return getState('isOpened');
	    },
	    proactiveOpen: function (chatWebHistory) {
	      var _window, _window$ngChatOptions;

	      let convertedOptions = (_window = window) === null || _window === void 0 ? void 0 : (_window$ngChatOptions = _window.ngChatOptions) === null || _window$ngChatOptions === void 0 ? void 0 : _window$ngChatOptions.convertedOptions;

	      if (chatWebHistory && Object.keys(chatWebHistory).length > 0 && convertedOptions !== undefined) {
	        if (chatWebHistory.profile) {
	          convertedOptions = mergeOptions({
	            prepopulatedFields: [{
	              k: 'campaign',
	              v: chatWebHistory.profile
	            }]
	          }, convertedOptions);
	        }

	        if (chatWebHistory.chatQuestion) {
	          convertedOptions = mergeOptions({
	            prepopulatedFields: [{
	              k: 'Question',
	              v: chatWebHistory.chatQuestion
	            }]
	          }, convertedOptions);
	        }
	      }

	      launchNgchat(convertedOptions, undefined); // set it to open

	      emitter.on(Events.Inited, () => {
	        emitter.off(Events.Inited);
	        openHandler$1(chatWebHistory);
	      });
	    },
	    open: function (chatWebHistory) {
	      openHandler$1(chatWebHistory);
	    }
	  };
	};

	const openHandler$1 = chatWebHistory => {
	  const setIsOpened = mutate('isOpened');
	  setIsOpened(true);
	  const dataExchangeEvent = new index_min.exports.DataExchangeEvent(getWidgetId(), {
	    desiredState: 'open',
	    chatWebHistory,
	    parentOrigin: window.origin
	  });
	  managerAPI.publish(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.DataExchangeEvent.EVENT_NAME), dataExchangeEvent);
	};

	const onWidgetReadyEvent = (subscriberId, event, options) => {
	  console.log('Received WidgetReadyEvent from widget', event); // destroy the possible web-messenger

	  removeWebMessenger();
	  showIframeWidget();
	  const dataExchangeEvent = new index_min.exports.DataExchangeEvent(getWidgetId(), {
	    initState: 'close',
	    parentOrigin: window.origin,
	    options
	  });
	  managerAPI.publish(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.DataExchangeEvent.EVENT_NAME), dataExchangeEvent);
	  widgetStart();
	  const embedded = Boolean(getState('messenger').embedded);

	  if (!embedded) {
	    widgetMin(); // Initialize drag functionality for non-embedded widgets

	    initializeDragFeature(options);
	  }

	  emitter.emit(Events.Ready);
	  setGlobalInstance();
	};
	const createWidget = options => {
	  const widget = managerAPI.createWidget(getWidgetId(), {
	    src: getNgchatUrl(getState('cdn')),
	    name: getWidgetId(),
	    allowfullscreen: true,
	    scrolling: 'no',
	    frameborder: 0,
	    allow: 'geolocation; microphone'
	  });
	  managerAPI.subscribe(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.AppStateEvent.EVENT_NAME), (subscriberId, event) => {
	    var _event$appState;

	    const type = event === null || event === void 0 ? void 0 : (_event$appState = event.appState) === null || _event$appState === void 0 ? void 0 : _event$appState.type;

	    if (type === 'draggable') {
	      var _options$messenger, _event$appState2;

	      const dragAllowedByOptions = (options === null || options === void 0 ? void 0 : (_options$messenger = options.messenger) === null || _options$messenger === void 0 ? void 0 : _options$messenger.displayStyle) === 'draggable';
	      const dragAllowedByEvent = Boolean(event === null || event === void 0 ? void 0 : (_event$appState2 = event.appState) === null || _event$appState2 === void 0 ? void 0 : _event$appState2.data);
	      initializeDragFeature(options, dragAllowedByOptions && dragAllowedByEvent);
	      return;
	    }

	    onAppStateEvent(subscriberId, event, options);
	  });
	  managerAPI.subscribe(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.WidgetReadyEvent.EVENT_NAME), (subscriberId, event) => onWidgetReadyEvent(subscriberId, event, options));
	  return widget.getHtmlElement();
	};
	const createWindowWidget = (options, param) => {
	  const widget = managerAPI.createWindowWidget(getWidgetId(), getNgchatUrl(getState('cdn')), {
	    scrollbars: false,
	    resizable: false,
	    location: true,
	    status: false,
	    toolbar: false,
	    width: (param === null || param === void 0 ? void 0 : param.width) ?? 374,
	    height: (param === null || param === void 0 ? void 0 : param.height) ?? 590,
	    left: (param === null || param === void 0 ? void 0 : param.left) ?? 1000,
	    top: (param === null || param === void 0 ? void 0 : param.top) ?? 100
	  });
	  managerAPI.subscribe(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.WidgetReadyEvent.EVENT_NAME), (subscriberId, event) => onWidgetReadyEvent(subscriberId, event, options));
	  return widget.getHtmlElement();
	}; // Store drag instance globally to allow cleanup

	let dragInstance = null; // Cleanup on page unload to prevent memory leaks

	if (typeof window !== 'undefined') {
	  window.addEventListener('beforeunload', () => {
	    if (dragInstance) {
	      try {
	        dragInstance.destroy();
	      } catch (e) {
	        console.warn('Error cleaning up drag instance on unload:', e);
	      }

	      dragInstance = null;
	    }
	  });
	}
	/**
	 * Initialize drag feature for the widget.
	 * Dragging is enabled only when `Boolean(options?.messenger?.displayStyle === 'draggable')` is true.
	 * When disabled, it removes any draggable overlay and resets the widget back to its original position.
	 */


	const initializeDragFeature = (options, dragEnabledOverride) => {
	  var _options$messenger2;

	  // If no explicit override is provided, default to disabled.
	  // Drag is explicitly enabled/disabled via AppStateEvent ("draggable") using the override parameter.
	  const resolvedOverride = dragEnabledOverride === undefined ? false : dragEnabledOverride;
	  const dragEnabled = Boolean((options === null || options === void 0 ? void 0 : (_options$messenger2 = options.messenger) === null || _options$messenger2 === void 0 ? void 0 : _options$messenger2.displayStyle) === 'draggable') && resolvedOverride;
	  const iframe = document.getElementById(getWidgetId());
	  const container = document.getElementById('fn-chat-iframe-container');

	  const resetWidgetToOriginalPosition = () => {
	    var _overlay$parentElemen;

	    if (!iframe) return;
	    iframe.style.transform = '';
	    iframe.style.right = '';
	    iframe.style.bottom = '';
	    iframe.style.left = '';
	    iframe.style.top = ''; // Best-effort cleanup in case an overlay exists from a previous init

	    const overlay = document.getElementById('f9-drag-overlay');
	    overlay === null || overlay === void 0 ? void 0 : (_overlay$parentElemen = overlay.parentElement) === null || _overlay$parentElemen === void 0 ? void 0 : _overlay$parentElemen.removeChild(overlay);
	  };

	  if (!dragEnabled) {
	    // Remove any persisted drag position
	    clearSavedPosition(); // Reset position and cleanup any existing drag instance/overlay

	    if (dragInstance) {
	      try {
	        if (typeof dragInstance.reset === 'function') dragInstance.reset();
	        if (typeof dragInstance.destroy === 'function') dragInstance.destroy();
	      } catch (e) {
	        console.warn('Error cleaning up drag instance:', e);
	      }

	      dragInstance = null;
	    }

	    resetWidgetToOriginalPosition();
	    return;
	  } // Drag enabled: (re)initialize


	  if (!iframe) {
	    console.warn('Cannot initialize dragging: iframe not found');
	    return;
	  }

	  if (!container) {
	    console.warn('Cannot initialize dragging: container not found');
	    return;
	  }

	  if (dragInstance) {
	    try {
	      dragInstance.destroy();
	    } catch (e) {
	      console.warn('Error destroying previous drag instance:', e);
	    }

	    dragInstance = null;
	  } // Wait for the iframe to be fully rendered (100ms is typically sufficient for DOM layout)
	  // Add guard to check if widget still exists before initializing


	  setTimeout(() => {
	    // Verify iframe and container still exist and are in the DOM
	    if (!document.body.contains(iframe) || !document.body.contains(container)) {
	      console.warn('Widget was removed before drag initialization could complete');
	      return;
	    }

	    try {
	      dragInstance = initDraggable(container, iframe, {
	        savePosition: true,
	        constrainToViewport: true,
	        reconstrainOnStateChange: true,
	        onClick: ({
	          state
	        }) => {
	          // Overlay intercepts pointer events. For minimized state, treat click as "open widget".
	          // This avoids relying on forwarding click events into a (potentially cross-origin) iframe.
	          if (state === 'minimized') {
	            openHandler$1(undefined);
	            return true;
	          }

	          return false;
	        },
	        onDragStart: () => {
	          console.debug('Widget drag started');
	        },
	        onDragEnd: position => {
	          console.debug('Widget drag ended at position:', position);
	        }
	      });
	      console.log('Widget dragging initialized successfully');
	    } catch (error) {
	      console.error('Failed to initialize widget dragging:', error);
	      dragInstance = null;
	    }
	  }, 100);
	};

	const iframeContainerId = 'fn-chat-iframe-container';
	const pageStorageId = 'f9-proactive-page-data';

	const launchIframeWidget = options => {
	  var _oldWidget$parentElem, _options$messenger;

	  const oldWidget = document.getElementById(getWidgetId());
	  oldWidget === null || oldWidget === void 0 ? void 0 : (_oldWidget$parentElem = oldWidget.parentElement) === null || _oldWidget$parentElem === void 0 ? void 0 : _oldWidget$parentElem.removeChild(oldWidget);
	  const widgetElement = createWidget(options);
	  widgetElement === null || widgetElement === void 0 ? void 0 : widgetElement.setAttribute('hidden', true);
	  let container;

	  if (options !== null && options !== void 0 && (_options$messenger = options.messenger) !== null && _options$messenger !== void 0 && _options$messenger.embedded) {
	    var _options$messenger2, _container;

	    const containerId = (options === null || options === void 0 ? void 0 : (_options$messenger2 = options.messenger) === null || _options$messenger2 === void 0 ? void 0 : _options$messenger2.containerId) ?? 'chatWidgetContainer';
	    container = document.getElementById(containerId);
	    (_container = container) === null || _container === void 0 ? void 0 : _container.appendChild(widgetElement);
	    widgetEmbedded();
	  } else {
	    const oldContainer = document.getElementById(iframeContainerId);

	    if (!oldContainer) {
	      var _container2, _container3;

	      container = document.createElement('div');
	      (_container2 = container) === null || _container2 === void 0 ? void 0 : _container2.setAttribute('id', iframeContainerId);
	      document.body.appendChild(container);
	      (_container3 = container) === null || _container3 === void 0 ? void 0 : _container3.appendChild(widgetElement);
	    } else {
	      console.info('old container not removed yet');
	    }
	  }
	};

	const launchWindowWidget = (options, param) => {
	  createWindowWidget(options, param);
	};

	const convertUrl = url => {
	  // normal url
	  if (!url || url !== null && url !== void 0 && url.startsWith('https:') || url !== null && url !== void 0 && url.startsWith('http:')) {
	    return url;
	  } // relative path


	  return url !== null && url !== void 0 && url.startsWith('/') ? window.location.origin + url : window.location.origin + '/' + url;
	};

	const convertOptions = options => {
	  var _options$messenger3, _options$messenger4, _options$messenger5, _options$messenger6;

	  const convertedBusinessIconUrl = convertUrl(options === null || options === void 0 ? void 0 : (_options$messenger3 = options.messenger) === null || _options$messenger3 === void 0 ? void 0 : _options$messenger3.businessIconUrl);
	  const convertedButtonIconUrl = convertUrl(options === null || options === void 0 ? void 0 : (_options$messenger4 = options.messenger) === null || _options$messenger4 === void 0 ? void 0 : _options$messenger4.buttonIconUrl);
	  const convertedBackgroundImageUrl = convertUrl(options === null || options === void 0 ? void 0 : (_options$messenger5 = options.messenger) === null || _options$messenger5 === void 0 ? void 0 : _options$messenger5.backgroundImageUrl);
	  const convertedCustomCssUrl = convertUrl(options === null || options === void 0 ? void 0 : (_options$messenger6 = options.messenger) === null || _options$messenger6 === void 0 ? void 0 : _options$messenger6.customCssUrl);
	  return { ...options,
	    messenger: { ...(options === null || options === void 0 ? void 0 : options.messenger),
	      businessIconUrl: convertedBusinessIconUrl,
	      buttonIconUrl: convertedButtonIconUrl,
	      backgroundImageUrl: convertedBackgroundImageUrl,
	      customCssUrl: convertedCustomCssUrl
	    }
	  };
	};

	const downloadConfiguration = async (cdn, integrationId, chatDeploymentId) => {
	  try {
	    const configurationUrl = `${getConfigurationCdnHost(cdn)}/${integrationId}/${chatDeploymentId}/configuration.json`;
	    const response = await fetch(configurationUrl);

	    if (!response.ok) {
	      console.error('There was a problem fetching the configuration data.');
	      return undefined;
	    }

	    const data = await response.json();
	    console.debug('The configuration data is downloaded from CDN', data);
	    return data;
	  } catch (error) {
	    console.error('There was a problem fetching the configuration data:', error);
	    return undefined;
	  }
	};

	const inPrepopulcatedFields = (key, prepopulatedFields) => {
	  return Boolean(prepopulatedFields === null || prepopulatedFields === void 0 ? void 0 : prepopulatedFields.find(field => (field === null || field === void 0 ? void 0 : field.k) === key));
	};

	const convertL10n = (prepopulatedFields, l10n) => {
	  return Object.keys(l10n).map(l10nCode => {
	    var _details$captureField;

	    const details = l10n[l10nCode];
	    const captureFields = details === null || details === void 0 ? void 0 : (_details$captureField = details.captureFields) === null || _details$captureField === void 0 ? void 0 : _details$captureField.filter(field => !inPrepopulcatedFields(field === null || field === void 0 ? void 0 : field.k, prepopulatedFields));
	    const l10nOption = { ...details,
	      captureFields
	    };
	    return {
	      l10nCode,
	      l10nOption
	    };
	  }).reduce((result, item) => {
	    result[item.l10nCode] = item.l10nOption;
	    return result;
	  }, {});
	};

	const mergeOptions = (initOptions, cdnConfiguration) => {
	  const cdnFields = cdnConfiguration.prepopulatedFields ?? [];
	  const initFields = initOptions.prepopulatedFields ?? [];
	  const fieldsMap = new Map();
	  cdnFields.forEach(field => {
	    if (field !== null && field !== void 0 && field.k) {
	      fieldsMap.set(field.k, field);
	    }
	  });
	  initFields.forEach(field => {
	    if (field !== null && field !== void 0 && field.k) {
	      fieldsMap.set(field.k, field);
	    }
	  });
	  const prepopulatedFields = Array.from(fieldsMap.values());
	  const previewSettings = initOptions === null || initOptions === void 0 ? void 0 : initOptions.previewSettings;
	  const tokenSettings = initOptions === null || initOptions === void 0 ? void 0 : initOptions.tokenSettings;
	  const l10n = convertL10n(initOptions.prepopulatedFields ?? [], cdnConfiguration.l10n);
	  return { ...cdnConfiguration,
	    previewSettings,
	    tokenSettings,
	    l10n,
	    prepopulatedFields,
	    chatDeploymentId: (initOptions === null || initOptions === void 0 ? void 0 : initOptions.chatDeploymentId) || (cdnConfiguration === null || cdnConfiguration === void 0 ? void 0 : cdnConfiguration.chatDeploymentId)
	  };
	};
	const getConvertedOptions = async configuration => {
	  const {
	    cdn,
	    integrationId,
	    chatDeploymentId
	  } = configuration;

	  if (integrationId && chatDeploymentId) {
	    const cdnConfiguration = await downloadConfiguration(cdn, integrationId, chatDeploymentId);

	    if (cdnConfiguration) {
	      return mergeOptions(configuration, cdnConfiguration);
	    }
	  }

	  return configuration;
	};
	const launchNgchat = (options, param) => {
	  var _convertedOptions$mes;

	  const convertedOptions = convertOptions(options);
	  destroyNgchat();

	  if ((convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$mes = convertedOptions.messenger) === null || _convertedOptions$mes === void 0 ? void 0 : _convertedOptions$mes.displayStyle) === 'window') {
	    launchWindowWidget(convertedOptions, param);
	  } else {
	    launchIframeWidget(convertedOptions);
	  }
	};
	const addProactiveScript = (options, event) => {
	  const proactiveScriptUrl = getProactiveScriptUrl(getState('cdn'));
	  const script = document.createElement('script');
	  script.setAttribute('src', proactiveScriptUrl);
	  document.head.appendChild(script);
	  script.addEventListener('load', () => proactiveHandler(options, script, event));
	};

	function proactiveHandler(options, script, event) {
	  console.log('initialising proactive and starting');
	  const convertedOptions = convertOptions(options);
	  initialiseAndStartProactiveChat(convertedOptions, event);
	  script.removeEventListener('load', proactiveHandler);
	}

	const initialiseAndStartProactiveChat = (convertedOptions, event) => {
	  var _convertedOptions$lan, _convertedOptions$lan2, _convertedOptions$lan3, _convertedOptions$lan4, _convertedOptions$l;

	  // default to browser if checkbox is ticked get browser default else to default in config else english
	  let languageTobepresented = convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$lan = convertedOptions.languages) === null || _convertedOptions$lan === void 0 ? void 0 : (_convertedOptions$lan2 = _convertedOptions$lan.languages) === null || _convertedOptions$lan2 === void 0 ? void 0 : (_convertedOptions$lan3 = _convertedOptions$lan2.find(language => language.default)) === null || _convertedOptions$lan3 === void 0 ? void 0 : _convertedOptions$lan3.code;
	  let browserDefaultLanguage;

	  if (convertedOptions !== null && convertedOptions !== void 0 && (_convertedOptions$lan4 = convertedOptions.languages) !== null && _convertedOptions$lan4 !== void 0 && _convertedOptions$lan4.defaultToBrowserLocale) {
	    var _convertedOptions$lan5, _convertedOptions$lan6;

	    browserDefaultLanguage = getLanguageIfExistent(browserLanguage(), languageTobepresented).split('-')[0]; // check if existent in options

	    if ((convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$lan5 = convertedOptions.languages) === null || _convertedOptions$lan5 === void 0 ? void 0 : (_convertedOptions$lan6 = _convertedOptions$lan5.languages) === null || _convertedOptions$lan6 === void 0 ? void 0 : _convertedOptions$lan6.filter(language => language.code === browserDefaultLanguage).length) > 0) {
	      languageTobepresented = browserDefaultLanguage;
	    }
	  }

	  if (languageTobepresented === undefined) {
	    // defaulting to english if not able to work out
	    languageTobepresented = 'en';
	  }

	  const chatPrompts = convertedOptions !== null && convertedOptions !== void 0 && convertedOptions.l10n ? convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$l = convertedOptions.l10n[languageTobepresented]) === null || _convertedOptions$l === void 0 ? void 0 : _convertedOptions$l.chatPrompts : undefined;
	  const domainName = event === null || event === void 0 ? void 0 : event.tenantName;

	  if (!domainName || !((chatPrompts === null || chatPrompts === void 0 ? void 0 : chatPrompts.length) > 0)) {
	    console.warn('Proactive chat cannot be started because of preconditions');
	  } else {
	    var _convertedOptions$mes2, _convertedOptions$mes3, _convertedOptions$mes4, _convertedOptions$mes5, _convertedOptions$mes6, _convertedOptions$mes7, _convertedOptions$mes8;

	    const Config = {
	      restAPI: getRestAPI(getState('cdn'))
	    };
	    const script = document.createElement('script');
	    const chatPromptsCampaignWise = {}; // consolidate chat by campaigns

	    chatPrompts === null || chatPrompts === void 0 ? void 0 : chatPrompts.forEach(chatPrompt => {
	      chatPrompt.campaigns.forEach(campaign => {
	        if (chatPromptsCampaignWise[campaign]) {
	          chatPromptsCampaignWise[campaign].chatQuestions.push(chatPrompt.chatQuestion);

	          if ((chatPrompt === null || chatPrompt === void 0 ? void 0 : chatPrompt.chatField) !== '') {
	            chatPromptsCampaignWise[campaign].chatFields.push(chatPrompt.chatField);
	          }
	        } else {
	          chatPromptsCampaignWise[campaign] = {
	            chatQuestions: [chatPrompt.chatQuestion],
	            chatFields: [chatPrompt.chatField]
	          };
	        }
	      });
	    });
	    const proactiveOptions = {
	      restAPI: Config.restAPI,
	      notificationType: 'notification',
	      chatPromptsCampaignWise,
	      tenant: domainName,
	      brandColor: convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$mes2 = convertedOptions.messenger) === null || _convertedOptions$mes2 === void 0 ? void 0 : (_convertedOptions$mes3 = _convertedOptions$mes2.customColors) === null || _convertedOptions$mes3 === void 0 ? void 0 : _convertedOptions$mes3.brandColor,
	      conversationColor: convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$mes4 = convertedOptions.messenger) === null || _convertedOptions$mes4 === void 0 ? void 0 : (_convertedOptions$mes5 = _convertedOptions$mes4.customColors) === null || _convertedOptions$mes5 === void 0 ? void 0 : _convertedOptions$mes5.conversationColor,
	      actionColor: convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$mes6 = convertedOptions.messenger) === null || _convertedOptions$mes6 === void 0 ? void 0 : (_convertedOptions$mes7 = _convertedOptions$mes6.customColors) === null || _convertedOptions$mes7 === void 0 ? void 0 : _convertedOptions$mes7.actionColor,
	      businessIconUrl: convertedOptions === null || convertedOptions === void 0 ? void 0 : (_convertedOptions$mes8 = convertedOptions.messenger) === null || _convertedOptions$mes8 === void 0 ? void 0 : _convertedOptions$mes8.businessIconUrl
	    };
	    let pageId = 'page' + Math.random().toString(16).slice(2);
	    let pageData = readPageData();

	    if (pageData && pageData[window.location.href]) {
	      pageId = pageData[window.location.href];
	    } else {
	      if (!pageData) {
	        pageData = {};
	      }

	      pageData[window.location.href] = pageId;
	      writePageData(pageData);
	    }

	    let startOptions = {};
	    let startScript = '';
	    startOptions = {
	      pageId,
	      profiles: Object.keys(chatPromptsCampaignWise),
	      fields: chatPromptsCampaignWise
	    };
	    startScript = startScript + `F9.Chat.Proactive.start(${JSON.stringify(startOptions)});`;
	    script.innerHTML = `F9.Chat.Proactive.init( ${JSON.stringify(proactiveOptions)}  ); ${startScript}`;
	    document.body.appendChild(script);
	  }
	};

	function readPageData() {
	  try {
	    if (typeof Storage !== 'undefined') {
	      const json = sessionStorage.getItem(pageStorageId);

	      if (json) {
	        return JSON.parse(json);
	      }
	    }
	  } catch (e) {
	    console.error(e);
	  }
	}

	function writePageData(pageData) {
	  const json = JSON.stringify(pageData);
	  sessionStorage.setItem(pageStorageId, json);
	}

	const getLanguageIfExistent = (languageCode, defaultLanguage) => {
	  return languageCode || defaultLanguage;
	};

	const browserLanguage = () => {
	  return navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
	};

	const updateOptions = options => {
	  var _options$messenger7;

	  const displayStyle = options === null || options === void 0 ? void 0 : (_options$messenger7 = options.messenger) === null || _options$messenger7 === void 0 ? void 0 : _options$messenger7.displayStyle;

	  if (displayStyle) {
	    usePreviewWidth();
	    const messengerState = getState('messenger');
	    messengerState.displayStyle = displayStyle;
	    const setMessenger = mutate('messenger');
	    setMessenger(messengerState);
	  }

	  const dataExchangeEvent = new index_min.exports.DataExchangeEvent(getWidgetId(), {
	    options
	  });
	  managerAPI.publish(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.DataExchangeEvent.EVENT_NAME), dataExchangeEvent);
	};
	const destroyNgchat = () => {
	  var _container$parentNode;

	  const container = document.getElementById(iframeContainerId);
	  container === null || container === void 0 ? void 0 : (_container$parentNode = container.parentNode) === null || _container$parentNode === void 0 ? void 0 : _container$parentNode.removeChild(container);
	};

	const setOption = (value, key) => {
	  const current = getState(key);
	  const set = mutate(key);
	  value !== undefined && current !== undefined && value !== current && set(value);
	};

	const init = (options, param) => {
	  window.ngChatOptions = {};
	  getConvertedOptions(options).then(convertedOptions => {
	    window.ngChatOptions.convertedOptions = convertedOptions;
	    lodash_forin(convertedOptions, setOption);
	    addNgchatStylesheet(convertedOptions);
	    launchNgchat(convertedOptions, param);
	    const chatPrompt = convertedOptions !== null && convertedOptions !== void 0 && convertedOptions.l10n ? Object.values(convertedOptions === null || convertedOptions === void 0 ? void 0 : convertedOptions.l10n).find(option => option.chatPrompts !== undefined) : undefined;

	    if (chatPrompt !== undefined) {
	      emitter.on(Events.Inited, event => {
	        openHandler(convertedOptions, event);
	      });
	    }
	  }).catch(error => {
	    console.error('Failed to convert the options', error);
	  });
	};

	const openHandler = (convertedOptions, event) => {
	  emitter.off(Events.Inited);

	  if (event !== null && event !== void 0 && event.tenantName && (event === null || event === void 0 ? void 0 : event.tenantName) !== '') {
	    addProactiveStylesheet();
	    addProactiveScript(convertedOptions, event);
	  } else {
	    console.warn('tenant name not passed, so cannot start proactive chat');
	  }
	};

	const publishChatEvent = eventData => {
	  const chatCustomEvent = new index_min.exports.ChatCustomEvent(getWidgetId(), eventData);
	  managerAPI.publish(index_min.exports.getWidgetTopicUrl(getWidgetId(), index_min.exports.ChatCustomEvent.EVENT_NAME), chatCustomEvent);
	};

	var index = {
	  Events,
	  init,
	  publishChatEvent,
	  updateOptions,
	  messenger: {
	    on: (eventName, callback) => emitter.on(eventName, callback),
	    off: (eventName, callback) => emitter.off(eventName, callback),
	    emit: (eventName, payload) => emitter.emit(eventName, payload)
	  },

	  destroy() {
	    destroyNgchat();
	    emitter.emit(Events.Destroy);
	  }

	};

	return index;

})();
//# sourceMappingURL=index.js.map
