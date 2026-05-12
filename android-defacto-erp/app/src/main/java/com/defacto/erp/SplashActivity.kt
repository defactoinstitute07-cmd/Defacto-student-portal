package com.student.erp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * SplashActivity — launcher entry point.
 *
 * On the very first launch we request all runtime permissions before navigating
 * to either LoginActivity or WebPortalActivity:
 *
 *   • POST_NOTIFICATIONS  (Android 13 / API 33+)
 *   • READ_MEDIA_IMAGES   (Android 13 / API 33+)
 *   • READ_MEDIA_VIDEO    (Android 13 / API 33+)
 *   • READ_EXTERNAL_STORAGE  (Android ≤ 12 / API ≤ 32)
 *   • CAMERA
 *
 * On subsequent launches (permissions already decided by the user) we navigate
 * immediately without showing any dialog.
 */
class SplashActivity : AppCompatActivity() {

    /* ── permission request launcher ── */
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        // User responded (granted or denied) — proceed regardless.
        navigateNext()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val missing = buildMissingPermissions()
        if (missing.isEmpty()) {
            // All permissions already granted (or not applicable on this API level).
            navigateNext()
        } else {
            // Show the OS permission dialogs — navigateNext() is called in the callback.
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    /**
     * Returns the list of permissions that still need to be requested.
     * Permissions already granted are omitted so we don't re-ask unnecessarily.
     */
    private fun buildMissingPermissions(): List<String> {
        val wanted = mutableListOf<String>()

        // Notifications — Android 13+ only
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted += Manifest.permission.POST_NOTIFICATIONS
        }

        // Media/storage — split by API level
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+: granular media permissions
            wanted += Manifest.permission.READ_MEDIA_IMAGES
            wanted += Manifest.permission.READ_MEDIA_VIDEO
        } else {
            // Android 12 and below: legacy storage permission
            wanted += Manifest.permission.READ_EXTERNAL_STORAGE
        }

        // Camera — for taking profile photos directly
        wanted += Manifest.permission.CAMERA

        // Filter to only those not already granted
        return wanted.filter { perm ->
            ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED
        }
    }

    /** Navigate to Login or Portal based on existing session. */
    private fun navigateNext() {
        val session = SessionManager(this)
        val target = if (session.hasSession()) {
            WebPortalActivity::class.java
        } else {
            LoginActivity::class.java
        }
        startActivity(Intent(this, target))
        finish()
    }
}
