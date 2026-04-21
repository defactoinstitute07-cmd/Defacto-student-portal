package com.student.erp

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Bundle
import android.view.View
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class WebPortalActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var pageLoading: ProgressBar
    private lateinit var sessionManager: SessionManager

    private var didInjectSession = false
    private var didReloadAfterInject = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_web_portal)

        sessionManager = SessionManager(this)

        val token = intent.getStringExtra(EXTRA_TOKEN).orEmpty().ifBlank {
            sessionManager.getToken().orEmpty()
        }
        val refreshToken = intent.getStringExtra(EXTRA_REFRESH_TOKEN).orEmpty().ifBlank {
            sessionManager.getRefreshToken().orEmpty()
        }
        val studentJson = intent.getStringExtra(EXTRA_STUDENT_JSON).orEmpty().ifBlank {
            sessionManager.getStudentJson().orEmpty()
        }
        val accessTokenExpiresAt = intent.getStringExtra(EXTRA_ACCESS_TOKEN_EXPIRES_AT).orEmpty().ifBlank {
            sessionManager.getAccessTokenExpiresAt().orEmpty()
        }

        if ((token.isBlank() && refreshToken.isBlank()) || studentJson.isBlank()) {
            redirectToLogin()
            return
        }

        if (token.isNotBlank()) {
            PushTokenSyncer.syncCurrentToken(this, token)
        }

        webView = findViewById(R.id.webView)
        pageLoading = findViewById(R.id.pageLoading)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                pageLoading.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                val currentUrl = url.orEmpty()
                if (!didInjectSession) {
                    val tokenJs = JSONObject.quote(token)
                    val refreshTokenJs = JSONObject.quote(refreshToken)
                    val studentJs = JSONObject.quote(studentJson)
                    val expiryJs = JSONObject.quote(accessTokenExpiresAt)
                    val script = """
                        (function() {
                            if ($tokenJs && $tokenJs !== "") {
                                localStorage.setItem('studentToken', $tokenJs);
                            } else {
                                localStorage.removeItem('studentToken');
                            }

                            if ($refreshTokenJs && $refreshTokenJs !== "") {
                                localStorage.setItem('studentRefreshToken', $refreshTokenJs);
                            } else {
                                localStorage.removeItem('studentRefreshToken');
                            }

                            localStorage.setItem('studentInfo', $studentJs);

                            if ($expiryJs && $expiryJs !== "") {
                                localStorage.setItem('studentAccessTokenExpiresAt', $expiryJs);
                            } else {
                                localStorage.removeItem('studentAccessTokenExpiresAt');
                            }
                        })();
                    """.trimIndent()

                    webView.evaluateJavascript(script, null)
                    didInjectSession = true
                }

                if (!didReloadAfterInject) {
                    didReloadAfterInject = true
                    webView.loadUrl(Config.FRONTEND_URL)
                    return
                }

                syncSessionFromWebStorage()

                if (currentUrl.contains("/student/login")) {
                    redirectToLogin()
                    return
                }

                pageLoading.visibility = View.GONE
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true && errorResponse?.statusCode == 404) {
                    Toast.makeText(this@WebPortalActivity, "Link not found", Toast.LENGTH_LONG).show()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    pageLoading.visibility = View.GONE
                    val message = when (error?.errorCode) {
                        ERROR_HOST_LOOKUP,
                        ERROR_CONNECT,
                        ERROR_TIMEOUT -> "Link not found"
                        else -> "Unable to connect. Check your internet connection."
                    }
                    Toast.makeText(this@WebPortalActivity, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                super.onReceivedSslError(view, handler, error)
                handler?.cancel()
                Toast.makeText(this@WebPortalActivity, "Secure connection failed", Toast.LENGTH_LONG).show()
            }
        }

        webView.loadUrl(Config.FRONTEND_URL)
    }

    private fun syncSessionFromWebStorage() {
        val script = """
            (function() {
                return {
                    token: localStorage.getItem('studentToken'),
                    refreshToken: localStorage.getItem('studentRefreshToken'),
                    studentInfo: localStorage.getItem('studentInfo'),
                    accessTokenExpiresAt: localStorage.getItem('studentAccessTokenExpiresAt')
                };
            })();
        """.trimIndent()

        webView.evaluateJavascript(script) { rawResult ->
            try {
                if (rawResult.isNullOrBlank() || rawResult == "null") {
                    return@evaluateJavascript
                }

                val payload = JSONObject(rawResult)
                val tokenValue = payload.optString("token").takeIf { it.isNotBlank() }
                val refreshTokenValue = payload.optString("refreshToken").takeIf { it.isNotBlank() }
                val studentInfoValue = payload.optString("studentInfo").takeIf { it.isNotBlank() }
                val expiryValue = payload.optString("accessTokenExpiresAt").takeIf { it.isNotBlank() }

                if (tokenValue == null && refreshTokenValue == null && studentInfoValue.isNullOrBlank()) {
                    sessionManager.clear()
                    return@evaluateJavascript
                }

                sessionManager.saveSession(
                    token = tokenValue,
                    refreshToken = refreshTokenValue,
                    studentJson = studentInfoValue,
                    accessTokenExpiresAt = expiryValue
                )
            } catch (_: Exception) {
                // Ignore serialization issues; the next navigation can sync again.
            }
        }
    }

    private fun redirectToLogin() {
        sessionManager.clear()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    object Config {
        const val API_BASE_URL = "https://defacto-student-portal.vercel.app/"
        const val FRONTEND_URL = "https://student.defactoinstitute.in/"

        fun getApiUrl(endpoint: String): String {
            val base = API_BASE_URL.removeSuffix("/")
            val cleanEndpoint = endpoint.removePrefix("/")
            return "$base/$cleanEndpoint"
        }
    }

    companion object {
        const val EXTRA_TOKEN = "extra_token"
        const val EXTRA_REFRESH_TOKEN = "extra_refresh_token"
        const val EXTRA_STUDENT_JSON = "extra_student_json"
        const val EXTRA_ACCESS_TOKEN_EXPIRES_AT = "extra_access_token_expires_at"
    }
}
