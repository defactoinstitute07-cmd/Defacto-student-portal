package com.student.erp

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        Handler(Looper.getMainLooper()).postDelayed({
            val session = SessionManager(this)
            val target = if (session.hasSession()) {
                // User already has a saved session — go straight to the portal.
                WebPortalActivity::class.java
            } else {
                LoginActivity::class.java
            }
            startActivity(Intent(this, target))
            finish()
        }, SPLASH_DELAY_MS)
    }

    companion object {
        private const val SPLASH_DELAY_MS = 1400L
    }
}
