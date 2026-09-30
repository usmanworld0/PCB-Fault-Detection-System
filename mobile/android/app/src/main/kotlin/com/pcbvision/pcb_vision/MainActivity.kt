package com.pcbvision.pcb_vision

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelId = "pcb_inspection_alerts"
    private var permissionResult: MethodChannel.Result? = null
    private val notificationPermissionRequest = 4401
    private var notificationChannel: MethodChannel? = null
    private var pendingInspectionId: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        pendingInspectionId = intent?.getStringExtra("inspection_id")
        notificationChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger,
            "com.pcbvision.pcb_vision/local_alerts").also { channel ->
          channel.setMethodCallHandler { call, result ->
            when (call.method) {
                "requestPermission" -> requestNotificationPermission(result)
                "consumePendingInspectionId" -> {
                    result.success(pendingInspectionId)
                    pendingInspectionId = null
                }
                "show" -> {
                    showAlert(call.argument<String>("title") ?: "PCB inspection alert",
                        call.argument<String>("message") ?: "A new alert was created.",
                        call.argument<String>("inspectionId"))
                    result.success(null)
                }
                else -> result.notImplemented()
            }
          }
        }
        createNotificationChannel()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.getStringExtra("inspection_id")?.let { inspectionId ->
            pendingInspectionId = inspectionId
            notificationChannel?.invokeMethod("openInspection", inspectionId)
        }
    }

    private fun requestNotificationPermission(result: MethodChannel.Result) {
        if (Build.VERSION.SDK_INT < 33 ||
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            result.success(true)
            return
        }
        permissionResult = result
        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), notificationPermissionRequest)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == notificationPermissionRequest) {
            permissionResult?.success(grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED)
            permissionResult = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "PCB inspection alerts", NotificationManager.IMPORTANCE_HIGH)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun showAlert(title: String, message: String, inspectionId: String?) {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        if (inspectionId != null) {
            val openIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("inspection_id", inspectionId)
            }
            val pending = PendingIntent.getActivity(
                this,
                inspectionId.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            builder.setContentIntent(pending)
        }
        val notification = builder
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(Notification.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .build()
        getSystemService(NotificationManager::class.java).notify(System.currentTimeMillis().toInt(), notification)
    }
}
