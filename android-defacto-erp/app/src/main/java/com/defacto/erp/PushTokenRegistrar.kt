package com.student.erp

import android.content.Context
import android.os.Build
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.Executors

class PushTokenRegistrar(private val context: Context) {
    private val client = OkHttpClient()
    private val executor = Executors.newSingleThreadExecutor()
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    fun registerToken(authToken: String, fcmToken: String) {
        if (authToken.isBlank() || fcmToken.isBlank()) return

        executor.execute {
            try {
                val body = JSONObject()
                    .put("fcmToken", fcmToken)
                    .put("platform", "android")
                    .put("appVersion", getAppVersion())
                    .put("appType", "native")
                    .put("packageName", context.packageName)
                    .put("model", Build.MODEL ?: "")
                    .put("manufacturer", Build.MANUFACTURER ?: "")
                    .toString()
                    .toRequestBody(jsonType)

                val request = Request.Builder()
                    .url(DEVICE_REGISTER_URL)
                    .addHeader("Authorization", "Bearer $authToken")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { _ ->
                    // Best-effort token sync; response is intentionally ignored.
                }
            } catch (_: Exception) {
                // Ignore transient failures; token will be retried on next app open/login.
            }
        }
    }

    private fun getAppVersion(): String {
        return runCatching {
            val info = context.packageManager.getPackageInfo(context.packageName, 0)
            info.versionName ?: ""
        }.getOrDefault("")
    }

    companion object {
        private const val DEVICE_REGISTER_URL = "https://defacto-student-portal.vercel.app/api/student/device"
    }
}
