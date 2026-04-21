package com.student.erp

import android.Manifest
import android.content.pm.PackageManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.appcompat.app.AppCompatActivity
import java.util.concurrent.Executors

class LoginActivity : AppCompatActivity() {
    private lateinit var sessionManager: SessionManager
    private val loginRepository = LoginRepository()
    private val executor = Executors.newSingleThreadExecutor()

    private lateinit var rollNoInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var loginProgress: ProgressBar
    private lateinit var errorText: TextView
    private lateinit var showPasswordBtn: android.widget.ImageButton
    private var isPasswordVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sessionManager = SessionManager(this)

        rollNoInput = findViewById(R.id.rollNoInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.loginButton)
        loginProgress = findViewById(R.id.loginProgress)
        errorText = findViewById(R.id.errorText)
        showPasswordBtn = findViewById(R.id.showPasswordBtn)

        showPasswordBtn.setOnClickListener {
            isPasswordVisible = !isPasswordVisible
            if (isPasswordVisible) {
                passwordInput.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                showPasswordBtn.setImageResource(android.R.drawable.ic_menu_view)
            } else {
                passwordInput.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                showPasswordBtn.setImageResource(android.R.drawable.ic_menu_view)
            }
            passwordInput.setSelection(passwordInput.text?.length ?: 0)
        }

        requestNotificationPermissionIfNeeded()

        val existingToken = sessionManager.getToken()
        val existingRefreshToken = sessionManager.getRefreshToken()
        val existingStudentJson = sessionManager.getStudentJson()
        val existingExpiry = sessionManager.getAccessTokenExpiresAt()
        if ((!existingToken.isNullOrBlank() || !existingRefreshToken.isNullOrBlank()) && !existingStudentJson.isNullOrBlank()) {
            if (!existingToken.isNullOrBlank()) {
                syncPushTokenIfPossible(existingToken)
            }
            openPortal(existingToken.orEmpty(), existingRefreshToken.orEmpty(), existingStudentJson, existingExpiry)
            return
        }

        loginButton.setOnClickListener {
            submitLogin()
        }
    }

    private fun submitLogin() {
        val rollNo = rollNoInput.text.toString().trim()
        val password = passwordInput.text.toString()
        errorText.visibility = View.GONE

        if (rollNo.isBlank() || password.isBlank()) {
            errorText.text = "Roll number and password are required"
            errorText.visibility = View.VISIBLE
            return
        }

        setLoading(true)

        executor.execute {
            val result = loginRepository.login(rollNo, password)
            runOnUiThread {
                setLoading(false)
                when (result) {
                    is LoginResult.Success -> {
                        sessionManager.saveSession(
                            token = result.data.token,
                            refreshToken = result.data.refreshToken,
                            studentJson = result.data.studentJson,
                            accessTokenExpiresAt = result.data.accessTokenExpiresAt
                        )
                        syncPushTokenIfPossible(result.data.token)
                        openPortal(
                            result.data.token,
                            result.data.refreshToken,
                            result.data.studentJson,
                            result.data.accessTokenExpiresAt
                        )
                    }
                    is LoginResult.Error -> {
                        errorText.text = result.error.message
                        errorText.visibility = View.VISIBLE
                    }
                }
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        rollNoInput.isEnabled = !isLoading
        passwordInput.isEnabled = !isLoading
        loginButton.isEnabled = !isLoading
        loginButton.text = getString(if (isLoading) R.string.logging_in else R.string.secure_login_access)
        loginProgress.visibility = if (isLoading) View.VISIBLE else View.GONE
    }

    private fun openPortal(
        token: String,
        refreshToken: String,
        studentJson: String,
        accessTokenExpiresAt: String?
    ) {
        val intent = Intent(this, WebPortalActivity::class.java)
        intent.putExtra(WebPortalActivity.EXTRA_TOKEN, token)
        intent.putExtra(WebPortalActivity.EXTRA_REFRESH_TOKEN, refreshToken)
        intent.putExtra(WebPortalActivity.EXTRA_STUDENT_JSON, studentJson)
        intent.putExtra(WebPortalActivity.EXTRA_ACCESS_TOKEN_EXPIRES_AT, accessTokenExpiresAt)
        startActivity(intent)
        finish()
    }

    private fun syncPushTokenIfPossible(authToken: String) {
        PushTokenSyncer.syncCurrentToken(this, authToken)
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return

        val granted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED

        if (!granted) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                REQUEST_NOTIFICATION_PERMISSION
            )
        }
    }

    companion object {
        private const val REQUEST_NOTIFICATION_PERMISSION = 101
    }
}
