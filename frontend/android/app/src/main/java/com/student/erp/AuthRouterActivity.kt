package com.student.erp

import android.os.Bundle
import android.view.WindowManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.IOException

class AuthRouterActivity : AppCompatActivity() {
    private val authRepository by lazy { AppContainer.authRepository(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        setTheme(R.style.Theme_StudentPortal)
        setContentView(R.layout.activity_auth_router)

        lifecycleScope.launch {
            val cachedSession = authRepository.loadCachedSession()

            val nextIntent = try {
                val session = authRepository.ensureValidSession(validateWithServer = cachedSession != null)
                if (session == null) {
                    LoginActivity.createIntent(this@AuthRouterActivity)
                } else {
                    WebViewActivity.createIntent(this@AuthRouterActivity)
                }
            } catch (error: ApiException) {
                LoginActivity.createIntent(
                    this@AuthRouterActivity,
                    JSONObject().apply {
                        put("reason", error.reason ?: "session_expired")
                        put("statusCode", error.statusCode)
                        put("message", error.message)
                        put("source", "auth_router")
                    }.toString()
                )
            } catch (_: IOException) {
                if (cachedSession != null && !JwtUtils.isExpired(cachedSession.accessToken)) {
                    WebViewActivity.createIntent(this@AuthRouterActivity)
                } else {
                    Toast.makeText(
                        this@AuthRouterActivity,
                        getString(R.string.error_network),
                        Toast.LENGTH_LONG
                    ).show()
                    LoginActivity.createIntent(this@AuthRouterActivity)
                }
            }

            startActivity(nextIntent)
            finish()
        }
    }
}
