package com.student.erp

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging

object PushTokenSyncer {
    private const val TAG = "PushTokenSyncer"

    fun syncCurrentToken(context: Context, authToken: String) {
        if (authToken.isBlank()) {
            Log.w(TAG, "Cannot sync push token without an auth token.")
            return
        }

        fetchAndRegister(context, authToken, allowRefresh = true)
    }

    private fun fetchAndRegister(context: Context, authToken: String, allowRefresh: Boolean) {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { fcmToken ->
                if (fcmToken.isNullOrBlank()) {
                    Log.w(TAG, "Fetched FCM token was blank.")
                    if (allowRefresh) {
                        refreshAndRetry(context, authToken)
                    }
                    return@addOnSuccessListener
                }

                PushTokenRegistrar(context).registerToken(authToken, fcmToken)
            }
            .addOnFailureListener { error ->
                Log.e(TAG, "Failed to fetch FCM token.", error)
                if (allowRefresh) {
                    refreshAndRetry(context, authToken)
                }
            }
    }

    private fun refreshAndRetry(context: Context, authToken: String) {
        FirebaseMessaging.getInstance().deleteToken()
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w(TAG, "Failed to delete stale FCM token before retry.", task.exception)
                }

                fetchAndRegister(context, authToken, allowRefresh = false)
            }
    }
}
