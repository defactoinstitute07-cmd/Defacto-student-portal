package com.student.erp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PushRegistrationService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID = "student_portal_general"
        private const val CHANNEL_NAME = "Student Alerts"
        private const val CHANNEL_DESC = "General notifications from the student portal"
    }

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

        // Show notifications when app is in foreground, and support data-only payloads.
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Student Portal"
        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: return

        showLocalNotification(title, body)
    }

    private fun showLocalNotification(title: String, body: String) {
        createNotificationChannelIfNeeded()

        val intent = Intent(this, AuthRouterActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(BitmapFactory.decodeResource(resources, R.drawable.ic_stat_df))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val id = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
        NotificationManagerCompat.from(this).notify(id, notification)
    }

    private fun createNotificationChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val manager = getSystemService(NotificationManager::class.java)
        val existing = manager?.getNotificationChannel(CHANNEL_ID)
        if (existing != null) {
            return
        }

        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = CHANNEL_DESC
        }

        manager?.createNotificationChannel(channel)
    }
}
