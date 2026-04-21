package com.student.erp

import android.content.Context

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("defacto_session", Context.MODE_PRIVATE)

    fun saveSession(
        token: String?,
        refreshToken: String?,
        studentJson: String?,
        accessTokenExpiresAt: String?
    ) {
        if (token.isNullOrBlank() && refreshToken.isNullOrBlank() && studentJson.isNullOrBlank()) {
            clear()
            return
        }

        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_REFRESH_TOKEN, refreshToken)
            putString(KEY_STUDENT_JSON, studentJson)
            putString(KEY_ACCESS_TOKEN_EXPIRES_AT, accessTokenExpiresAt)
            apply()
        }
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun getStudentJson(): String? = prefs.getString(KEY_STUDENT_JSON, null)
    fun getAccessTokenExpiresAt(): String? = prefs.getString(KEY_ACCESS_TOKEN_EXPIRES_AT, null)

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        const val KEY_TOKEN = "student_token"
        const val KEY_REFRESH_TOKEN = "student_refresh_token"
        const val KEY_STUDENT_JSON = "student_json"
        const val KEY_ACCESS_TOKEN_EXPIRES_AT = "student_access_token_expires_at"
    }
}
