package de.ihreapotheken.reactnative.core

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/*
 * Null-safe accessors for the argument maps JS sends. A missing key and an
 * explicit `null` both read as `null`.
 */

fun ReadableMap.getStringOrNull(key: String): String? =
  if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.String) getString(key) else null

fun ReadableMap.getBooleanOrNull(key: String): Boolean? =
  if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Boolean) getBoolean(key) else null

fun ReadableMap.getDoubleOrNull(key: String): Double? =
  if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Number) getDouble(key) else null

fun ReadableMap.getMapOrNull(key: String): ReadableMap? =
  if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Map) getMap(key) else null

fun ReadableMap.getArrayOrNull(key: String): ReadableArray? =
  if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Array) getArray(key) else null

fun ReadableArray.toStringList(): List<String> =
  (0 until size()).mapNotNull { index ->
    if (getType(index) == ReadableType.String) getString(index) else null
  }

/**
 * The error code naming a failed method, like the iOS module's, for example
 * `CLEAR_CART_ERROR` for `clearCart`.
 */
fun methodErrorCode(method: String): String =
  method.replace(Regex("([a-z0-9])([A-Z])"), "$1_$2").uppercase() + "_ERROR"

fun Promise.rejectMethod(method: String, message: String?, throwable: Throwable? = null) {
  reject(methodErrorCode(method), message ?: "$method failed.", throwable)
}
