package com.student.erp

import android.content.Context

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("defacto_session", Context.MODE_PRIVATE)

    fun saveSession(token: String, studentJson: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_STUDENT_JSON, studentJson)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getStudentJson(): String? = prefs.getString(KEY_STUDENT_JSON, null)

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        const val KEY_TOKEN = "student_token"
        const val KEY_STUDENT_JSON = "student_json"
    }
}
