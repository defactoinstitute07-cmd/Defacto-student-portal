package com.student.erp

import android.Manifest
import android.content.pm.PackageManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.IOException

class LoginActivity : AppCompatActivity() {
    private val authRepository by lazy { AppContainer.authRepository(applicationContext) }
    private val notificationPermissionRequestCode = 2001

    private lateinit var rollNumberLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var rollNumberInput: TextInputEditText
    private lateinit var passwordInput: TextInputEditText
    private lateinit var loginButton: MaterialButton
    private lateinit var loginProgress: LinearProgressIndicator
    private lateinit var errorText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        setContentView(R.layout.activity_login)
        requestNotificationsPermissionIfNeeded()

        rollNumberLayout = findViewById(R.id.rollNumberLayout)
        passwordLayout = findViewById(R.id.passwordLayout)
        rollNumberInput = findViewById(R.id.rollNumberInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.loginButton)
        loginProgress = findViewById(R.id.loginProgress)
        errorText = findViewById(R.id.errorText)

        loginButton.setOnClickListener { submit() }
        passwordInput.setOnEditorActionListener { _, _, event ->
            if (event == null || event.keyCode == KeyEvent.KEYCODE_ENTER) {
                submit()
                true
            } else {
                false
            }
        }

        intent.getStringExtra(EXTRA_MESSAGE)?.takeIf { it.isNotBlank() }?.let {
            showError(resolveMessage(it))
        }
    }

    private fun requestNotificationsPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return
        }

        val permission = Manifest.permission.POST_NOTIFICATIONS
        if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
            return
        }

        ActivityCompat.requestPermissions(this, arrayOf(permission), notificationPermissionRequestCode)
    }

    private fun submit() {
        val rollNo = rollNumberInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        if (!validate(rollNo, password)) {
            return
        }

        setLoading(true)
        showError(null)

        lifecycleScope.launch {
            try {
                authRepository.login(rollNo, password)
                startActivity(WebViewActivity.createIntent(this@LoginActivity))
                finishAffinity()
            } catch (error: ApiException) {
                handleAuthError(error.statusCode, error.reason, error.message)
            } catch (_: IOException) {
                showError(getString(R.string.error_network))
            } catch (_: Exception) {
                showError(getString(R.string.error_generic))
            } finally {
                setLoading(false)
            }
        }
    }

    private fun handleAuthError(code: Int, reason: String?, fallbackMessage: String) {
        val normalizedReason = normalizeReason(reason)
        val message = resolveFriendlyMessage(code, normalizedReason, fallbackMessage)
        showError(buildTechnicalMessage(message, code, normalizedReason, fallbackMessage, source = "native_login"))
    }

    private fun validate(rollNo: String, password: String): Boolean {
        rollNumberLayout.error = null
        passwordLayout.error = null

        var valid = true

        if (rollNo.isBlank()) {
            rollNumberLayout.error = getString(R.string.validation_roll_number_required)
            valid = false
        } else if (rollNo.length < 3) {
            rollNumberLayout.error = getString(R.string.validation_roll_number_short)
            valid = false
        }

        if (password.isBlank()) {
            passwordLayout.error = getString(R.string.validation_password_required)
            valid = false
        }

        return valid
    }

    private fun setLoading(isLoading: Boolean) {
        loginButton.isEnabled = !isLoading
        rollNumberInput.isEnabled = !isLoading
        passwordInput.isEnabled = !isLoading
        loginProgress.visibility = if (isLoading) View.VISIBLE else View.GONE
    }

    private fun showError(message: String?) {
        errorText.text = message.orEmpty()
        errorText.visibility = if (message.isNullOrBlank()) View.GONE else View.VISIBLE
        if (!message.isNullOrBlank()) {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }
    }

    private fun resolveMessage(rawMessage: String): String {
        val diagnostic = parseDiagnostic(rawMessage)
        if (diagnostic != null) {
            val normalizedReason = normalizeReason(diagnostic.optString("upstreamReason").ifBlank {
                diagnostic.optString("reason")
            })
            val statusCode = diagnostic.optInt("statusCode").takeIf { it > 0 }
            val detailMessage = diagnostic.optString("message").takeIf { it.isNotBlank() }
            val source = diagnostic.optString("source").takeIf { it.isNotBlank() }
            val path = diagnostic.optString("path").takeIf { it.isNotBlank() }
            val friendlyMessage = resolveFriendlyMessage(
                statusCode,
                normalizedReason,
                detailMessage.orEmpty()
            )

            return buildTechnicalMessage(
                friendlyMessage,
                statusCode,
                normalizedReason,
                detailMessage,
                source = source,
                path = path
            )
        }

        return when (normalizeReason(rawMessage)) {
            "session_expired", "web_session_cleared" -> getString(R.string.error_session_expired)
            "token_invalid", "token_missing" -> getString(R.string.error_authentication_failed)
            "db_unavailable" -> getString(R.string.error_server_starting)
            "user_logout", "logout" -> getString(R.string.login_signed_out)
            else -> rawMessage
        }
    }

    private fun resolveFriendlyMessage(code: Int?, normalizedReason: String?, fallbackMessage: String): String {
        return when {
            code == 401 && normalizedReason == "invalid_credentials" -> getString(R.string.error_invalid_credentials)
            code == 401 && normalizedReason == "session_expired" -> getString(R.string.error_session_expired)
            code == 401 && normalizedReason == "token_invalid" -> getString(R.string.error_authentication_failed)
            code == 401 && normalizedReason == "token_missing" -> getString(R.string.error_authentication_failed)
            code == 401 && normalizedReason == "db_unavailable" -> getString(R.string.error_server_starting)
            code == 401 -> getString(R.string.error_login_failed_401)
            code == 429 -> getString(R.string.error_rate_limited)
            code == 503 || normalizedReason == "db_unavailable" -> getString(R.string.error_server_unavailable)
            normalizedReason == "session_expired" || normalizedReason == "web_session_cleared" -> getString(R.string.error_session_expired)
            normalizedReason == "token_invalid" || normalizedReason == "token_missing" -> getString(R.string.error_authentication_failed)
            normalizedReason == "user_logout" || normalizedReason == "logout" -> getString(R.string.login_signed_out)
            normalizedReason == "db_unavailable" -> getString(R.string.error_server_starting)
            else -> fallbackMessage.ifBlank { getString(R.string.error_generic) }
        }
    }

    private fun buildTechnicalMessage(
        userMessage: String,
        code: Int?,
        reason: String?,
        detailMessage: String?,
        source: String? = null,
        path: String? = null
    ): String {
        val diagnostics = mutableListOf<String>()

        code?.let { diagnostics += "HTTP $it" }
        normalizeReason(reason)?.let { diagnostics += "reason=$it" }
        detailMessage
            ?.takeIf { it.isNotBlank() && !it.equals(userMessage, ignoreCase = true) }
            ?.let { diagnostics += "message=$it" }
        path?.takeIf { it.isNotBlank() }?.let { diagnostics += "path=$it" }
        source?.takeIf { it.isNotBlank() }?.let { diagnostics += "source=$it" }

        if (diagnostics.isEmpty()) {
            return userMessage
        }

        return "$userMessage\nTechnical details: ${diagnostics.joinToString(" | ")}"
    }

    private fun parseDiagnostic(rawMessage: String): JSONObject? {
        val trimmed = rawMessage.trim()
        if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
            return null
        }

        return try {
            JSONObject(trimmed)
        } catch (_: Exception) {
            null
        }
    }

    private fun normalizeReason(reason: String?): String? {
        return reason
            ?.trim()
            ?.lowercase()
            ?.replace('-', '_')
            ?.takeIf { it.isNotBlank() }
    }

    companion object {
        private const val EXTRA_MESSAGE = "extra_message"

        fun createIntent(context: Context, message: String? = null): Intent {
            return Intent(context, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                if (!message.isNullOrBlank()) {
                    putExtra(EXTRA_MESSAGE, message)
                }
            }
        }
    }
}
