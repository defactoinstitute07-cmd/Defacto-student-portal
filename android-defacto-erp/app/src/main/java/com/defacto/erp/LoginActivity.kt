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
import com.google.firebase.messaging.FirebaseMessaging
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

    private val tokenRegistrar by lazy { PushTokenRegistrar(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sessionManager = SessionManager(this)

        rollNoInput = findViewById(R.id.rollNoInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.loginButton)
        loginProgress = findViewById(R.id.loginProgress)
        errorText = findViewById(R.id.errorText)

        requestNotificationPermissionIfNeeded()

        val existingToken = sessionManager.getToken()
        val existingStudentJson = sessionManager.getStudentJson()
        if (!existingToken.isNullOrBlank() && !existingStudentJson.isNullOrBlank()) {
            syncPushTokenIfPossible(existingToken)
            openPortal(existingToken, existingStudentJson)
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
                        sessionManager.saveSession(result.data.token, result.data.studentJson)
                        syncPushTokenIfPossible(result.data.token)
                        openPortal(result.data.token, result.data.studentJson)
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
        loginButton.isEnabled = !isLoading
        loginProgress.visibility = if (isLoading) View.VISIBLE else View.GONE
    }

    private fun openPortal(token: String, studentJson: String) {
        val intent = Intent(this, WebPortalActivity::class.java)
        intent.putExtra(WebPortalActivity.EXTRA_TOKEN, token)
        intent.putExtra(WebPortalActivity.EXTRA_STUDENT_JSON, studentJson)
        startActivity(intent)
        finish()
    }

    private fun syncPushTokenIfPossible(authToken: String) {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { fcmToken ->
                if (!fcmToken.isNullOrBlank()) {
                    tokenRegistrar.registerToken(authToken, fcmToken)
                }
            }
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
