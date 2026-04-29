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
            // Only overwrite each field if the new value is non-blank.
            // This prevents a partial sync (e.g. after a token rotation where only
            // the access token changed) from accidentally blanking the refresh token.
            if (!token.isNullOrBlank()) {
                putString(KEY_TOKEN, token)
            }
            if (!refreshToken.isNullOrBlank()) {
                putString(KEY_REFRESH_TOKEN, refreshToken)
            }
            if (!studentJson.isNullOrBlank()) {
                putString(KEY_STUDENT_JSON, studentJson)
            }
            if (!accessTokenExpiresAt.isNullOrBlank()) {
                putString(KEY_ACCESS_TOKEN_EXPIRES_AT, accessTokenExpiresAt)
            }
            apply()
        }
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun getStudentJson(): String? = prefs.getString(KEY_STUDENT_JSON, null)
    fun getAccessTokenExpiresAt(): String? = prefs.getString(KEY_ACCESS_TOKEN_EXPIRES_AT, null)

    fun hasSession(): Boolean {
        val refresh = getRefreshToken()
        val student = getStudentJson()
        return !refresh.isNullOrBlank() && !student.isNullOrBlank()
    }

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
