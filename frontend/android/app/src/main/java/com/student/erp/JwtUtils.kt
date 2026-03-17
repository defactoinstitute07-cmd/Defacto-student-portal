package com.student.erp

import android.util.Base64
import org.json.JSONObject

object JwtUtils {
    fun getExpiryEpochSeconds(token: String): Long? = try {
        val parts = token.split(".")
        if (parts.size < 2) {
            null
        } else {
            val payload = String(
                Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP),
                Charsets.UTF_8
            )
            JSONObject(payload).optLong("exp").takeIf { it > 0L }
        }
    } catch (_: Exception) {
        null
    }

    fun isExpired(token: String, skewSeconds: Long = 0L): Boolean {
        val expiry = getExpiryEpochSeconds(token) ?: return true
        val now = System.currentTimeMillis() / 1000L
        return now + skewSeconds >= expiry
    }
}
