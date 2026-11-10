package com.krishadryfruits.admin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AdminFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "KDF_FCM"
        const val CHANNEL_ID = "krisha_orders_channel"
        const val CHANNEL_NAME = "New Order Alerts"
        const val TOPIC_ORDERS = "admin_orders"

        fun subscribeToOrderAlerts() {
            try {
                FirebaseMessaging.getInstance().subscribeToTopic(TOPIC_ORDERS)
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            Log.d(TAG, "Subscribed successfully to FCM topic: $TOPIC_ORDERS")
                        } else {
                            Log.w(TAG, "Failed to subscribe to FCM topic: $TOPIC_ORDERS", task.exception)
                        }
                    }
            } catch (e: Exception) {
                Log.e(TAG, "Error subscribing to topic", e)
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Registration Token: $token")
        subscribeToOrderAlerts()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Message received from: ${remoteMessage.from}")

        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "🚨 New Order Placed!"

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: "A customer has just placed a new order. Tap to view."

        val orderId = remoteMessage.data["orderId"]
        val targetUrl = remoteMessage.data["targetUrl"]
            ?: if (!orderId.isNullOrBlank()) {
                "https://krishadryfruits.in/admin?tab=orders&orderId=$orderId"
            } else {
                "https://krishadryfruits.in/admin?tab=orders"
            }

        showOrderNotification(title, body, targetUrl, orderId)
    }

    private fun showOrderNotification(
        title: String,
        body: String,
        targetUrl: String,
        orderId: String?
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build()

            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent alerts for newly placed orders"
                enableLights(true)
                lightColor = android.graphics.Color.YELLOW
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                setSound(soundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("targetUrl", targetUrl)
            if (!orderId.isNullOrBlank()) {
                putExtra("orderId", orderId)
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        val defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(largeIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setSound(defaultSound)
            .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        val notificationId = orderId?.hashCode() ?: System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
