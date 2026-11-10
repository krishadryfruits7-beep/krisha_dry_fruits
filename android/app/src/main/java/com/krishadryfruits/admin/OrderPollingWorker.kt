package com.krishadryfruits.admin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class OrderPollingWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "KDF_PollingWorker"
        private const val PREFS_NAME = "krisha_admin_prefs"
        private const val KEY_LAST_ORDER_ID = "last_seen_order_id"
    }

    override suspend fun doWork(): Result {
        return try {
            val pendingOrders = fetchPendingOrders()
            if (pendingOrders.length() > 0) {
                val latest = pendingOrders.getJSONObject(0)
                val orderId = latest.optString("orderId", latest.optString("_id"))
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val lastSeenId = prefs.getString(KEY_LAST_ORDER_ID, null)

                if (!orderId.isNullOrBlank() && orderId != lastSeenId) {
                    val customer = latest.optJSONObject("customer")
                    val customerName = customer?.optString("fullName") ?: "Customer"
                    val total = latest.optDouble("total", 0.0)

                    val title = "🚨 New Order: #$orderId"
                    val body = "$customerName placed an order for ₹${total.toInt()}. Tap to view."
                    val targetUrl = "https://krishadryfruits.in/admin?tab=orders&orderId=$orderId"

                    showLocalAlert(title, body, targetUrl, orderId)
                    prefs.edit().putString(KEY_LAST_ORDER_ID, orderId).apply()
                }
            }
            Result.success()
        } catch (e: Exception) {
            Log.w(TAG, "Order polling worker check notice: ${e.message}")
            Result.retry()
        }
    }

    private fun fetchPendingOrders(): JSONArray {
        val url = URL("https://krishadryfruits.in/api/admin-orders?status=pending&limit=5")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.connectTimeout = 8000
        conn.readTimeout = 8000
        conn.setRequestProperty("Authorization", "Bearer krisha_admin_2024")
        conn.setRequestProperty("Accept", "application/json")

        if (conn.responseCode == 200) {
            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val sb = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                sb.append(line)
            }
            reader.close()
            val res = sb.toString().trim()
            return if (res.startsWith("[")) {
                JSONArray(res)
            } else {
                val obj = JSONObject(res)
                obj.optJSONArray("orders") ?: JSONArray()
            }
        }
        return JSONArray()
    }

    private fun showLocalAlert(title: String, body: String, targetUrl: String, orderId: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                AdminFirebaseMessagingService.CHANNEL_ID,
                AdminFirebaseMessagingService.CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent alerts for newly placed orders"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("targetUrl", targetUrl)
            putExtra("orderId", orderId)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            orderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
        val defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notification = NotificationCompat.Builder(context, AdminFirebaseMessagingService.CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(largeIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setSound(defaultSound)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(orderId.hashCode(), notification)
    }
}
