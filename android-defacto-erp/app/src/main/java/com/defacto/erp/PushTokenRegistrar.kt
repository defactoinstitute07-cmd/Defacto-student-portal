package com.student.erp

import android.content.Context
import android.os.Build
import android.util.Log
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
        if (authToken.isBlank() || fcmToken.isBlank()) {
            Log.w("PushTokenRegistrar", "Cannot register token: authToken or fcmToken is blank")
            return
        }

        executor.execute {
            try {
                val registerUrl = WebPortalActivity.Config.getApiUrl("api/student/device")
                
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
                    .url(registerUrl)
                    .addHeader("Authorization", "Bearer $authToken")
                    .post(body)
                    .build()

                Log.i("PushTokenRegistrar", "Registering device token to: $registerUrl")
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.i("PushTokenRegistrar", "Device token registered successfully.")
                    } else {
                        val errBody = response.body?.string() ?: ""
                        Log.e("PushTokenRegistrar", "Failed to register device token. code=${response.code} body=$errBody")
                    }
                }
            } catch (e: Exception) {
                Log.e("PushTokenRegistrar", "Exception during token registration: ${e.message}", e)
            }
        }
    }

    private fun getAppVersion(): String {
        return runCatching {
            val info = context.packageManager.getPackageInfo(context.packageName, 0)
            info.versionName ?: ""
        }.getOrDefault("")
    }
}
