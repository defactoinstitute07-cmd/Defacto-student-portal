package com.student.erp

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PushRegistrationService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        if (token.isBlank()) return

        val appContext = applicationContext
        val secureStore = SecureTokenStore(appContext)
        val authState = secureStore.read() ?: return

        val api = AuthApi()
        val devicePayload = DevicePayload.fromContext(appContext)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                api.registerDeviceForPush(authState.accessToken, token, devicePayload)
            } catch (e: Exception) {
                Log.e("PushRegistration", "Failed to register FCM token", e)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // For now we rely on FCM notification payload to show system notifications.
        // If you later send data-only messages, you can build a Notification here.
    }
}
